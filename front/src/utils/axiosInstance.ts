import axios from "axios";
import baseURL from "./baseURL";

const axiosInstance = axios.create({
  baseURL: baseURL,
  withCredentials: true
});

export default axiosInstance;
