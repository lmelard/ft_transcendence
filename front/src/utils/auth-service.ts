import { UserDetails } from "../model/UserDetails";
import axiosInstance from "../utils/axiosInstance";
import { Socket } from "socket.io-client";
import { frontURL } from "./baseURL";
import baseURL from "./baseURL";
import axios from "axios";

const fetchHeaders = {
  "Content-Type": "application/json;charset=UTF-8",
  "Access-Control-Allow-Origin": frontURL,
};

async function register(firstname: string, lastname: string, nickname: string, email: string, password: string) {
  try {
    const fullName = firstname + " " + lastname;
    return axiosInstance.post("/user/signup", {
      fullName,
      email,
      nickname,
      password,
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const customMessage = error.response.data.message;
      throw new Error(customMessage || "An unexpected error occurred.");
    } else {
      throw new Error("The request was made but no response was received");
    }
  }
}

async function login(email: string, password: string) {
  try {
    await axiosInstance.post("/user/signin", {
      email: email,
      password: password,
    });

    const userResponse = await axiosInstance.get("/user/me");
    return userResponse.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Authentication failed. ${error.response.data.error}`);
    } else {
      throw new Error("Authentication failed. Please check your network connection.");
    }
  }
}

async function logout(chatSocket: Socket | null, gameSocket: Socket | null) {
  try {
    chatSocket?.disconnect();
    gameSocket?.disconnect();
    const logoutResponse = await axiosInstance.get("/user/logout");

    if (logoutResponse.data.message) {
      throw new Error(logoutResponse.data.message);
    }
  } catch (error) {
    console.error("Error logging out:", error);
    // console.log(gameSocket);
    throw error;
  }
}

async function getUserFromBack(): Promise<UserDetails | null> {
  const response = await axiosInstance.get("/user/me");
  if (response.status === 401) {
    throw new Error("Unauthorized access.");
  }
  return response.data;
}

async function turnOffTwoFA() {
  const response = await axiosInstance.post("/user/turnOff2FA", null);
  if (response.data.ok) {
    throw Error;
  }
}

async function changeSettings(fullName: string, nickname: string, email: string) {
  let updatedUser: UserDetails | null = null;
  await fetch(baseURL + "/user/changeSettings", {
    method: "POST",
    credentials: "include",
    headers: fetchHeaders,
    body: JSON.stringify({
      fullName: fullName,
      nickname: nickname,
      email: email,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.message) {
        throw new Error(data.message);
      }
      updatedUser = data;
      // console.log("DATAAAA RECEIVED IN CHANGE SETTINGS", updatedUser);
      return updatedUser;
    })
    .catch((error) => {
      // console.log("Error changing settings: ", error);
      throw error;
    });
  return updatedUser;
}

async function updateAvatar(imageUrl: string | undefined) {
  let updatedUser: UserDetails | null = null;
  if (imageUrl) {
    await fetch(baseURL + "/user/updateAvatar", {
      method: "POST",
      credentials: "include",
      headers: fetchHeaders,
      body: JSON.stringify({
        imageUrl: imageUrl,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          throw new Error(data.message);
        }
        updatedUser = data;
        return updatedUser;
      })
      .catch((error) => {
        throw error;
      });
  }
  return updatedUser;
}

async function checkCurrentPassword(currentPassword: string) {
  await fetch(baseURL + "/user/checkCurrentPassword", {
    method: "POST",
    credentials: "include",
    headers: fetchHeaders,
    body: JSON.stringify({
      currentPassword: currentPassword,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      // console.log("check current password return", data);
      if (data.message) {
        throw new Error(data.message);
      } else {
        return true;
      }
    })
    .catch((error) => {
      // console.log("Error changing settings: ", error);
      throw error;
    });
  return true;
}

async function updatePassword(newPassword: string) {
  let updatedUser: UserDetails | null = null;

  const response = await axiosInstance.post("/user/updatePassword", { newPassword: newPassword });
  // console.log("RESPONSE: ", response);
  updatedUser = response.data;
  return updatedUser;
}

const AuthService = {
  register,
  login,
  logout,
  getUserFromBack,
  turnOffTwoFA,
  changeSettings,
  updateAvatar,
  checkCurrentPassword,
  updatePassword,
};

export default AuthService;
