import "./Main.css";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../App";
import Chat from "../../features/chat/Chat";
import Game from "../../features/game/Game";
import { io } from "socket.io-client";
import baseURL from "../../utils/baseURL";
import axiosInstance from "../../utils/axiosInstance";
import { User } from "../../model/User";
import { useThrowAsyncError } from "../../utils/useThrowAsyncError";
import { Cookies } from "react-cookie";
import PlayerList from "../../features/players/PlayerList";
import { useLocation } from "react-router-dom";
import Leaderboard from "./Leaderboard";
import Profile from "./Profile";
import SettingsDialog from "../header/dialogs/SettingsDialog";
import { Box, Grid, ThemeProvider, Typography, createTheme } from "@mui/material";
import { fetchUserDetails } from "../../features/chat/fetchData";
//import { useRouteMatch } from "react-router-dom";

const theme = createTheme({
  palette: {
    background: {
      default: '#FFFFFF' // Votre couleur de fond personnalisée
    },
  },
  components: {
    // Style des boutons MUI
    MuiButton: {
      styleOverrides: {
        // Appliquez ce style aux boutons avec la variante "contained"
        contained: {
          backgroundColor: '#366873', // votre couleur personnalisée
          color: '#fff', // texte blanc
          '&:hover': {
            backgroundColor: '#2d5559', // une teinte légèrement plus foncée pour l'effet hover
          },
          // Ajoutez d'autres styles si nécessaire
        },
      },
    },
  },
});

const Main: React.FC = () => {
  //console.log("Debut fonction Main");
  
  const cookies = new Cookies();
  const { user, chatSocket, setChatSocket, setPlayersList, setFriendsList, setBlackList, setUser } = useContext(UserContext);
  const throwAsyncError = useThrowAsyncError();
  const [display, setDisplay] = useState<boolean>(false);

  const location = useLocation();

  useEffect(() => {
    async function getAllPlayers() {
      try {
        const users = await axiosInstance.get("/user/all");
        return users;
      } catch (error) {
        throwAsyncError(error);
      }
    }

    async function getAllFriends() {
      try {
        const friendsList = await axiosInstance.get("/user/allFriends");
        return friendsList;
      } catch (error) {
        throwAsyncError(error);
      }
    }

    async function getBlockedPlayers() {
      try {
        const blackList = await axiosInstance.get("/user/blockedPlayers");
        return blackList;
      } catch (error) {
        throwAsyncError(error);
      }
    }

    try {
      setChatSocket(
        io(baseURL + "/chat", {
          forceNew: true,
          query: { tokenJwt: cookies.get("jwt") },
        })
      );
      //console.log("chat socket created");
      // setGameSocket(
      //   io(baseURL + "/game", {
      //     forceNew: true,
      //     query: { tokenJwt: cookies.get("jwt") },
      //   })
      // );
      // console.log("game socket created");
    } catch (error) {
      throwAsyncError(error);
    }

    if (user) {
      getAllPlayers()
        .then((users) =>
          setPlayersList(
            users!.data.filter((userDB: User) => {
              if (userDB.id !== user?.id) return true;
              return false;
            })
          )
        )
        .catch((error) => throwAsyncError(error));

      getAllFriends()
        .then((info) => {
          setFriendsList(info!.data.friends);
        })
        .catch((error) => throwAsyncError(error));

      getBlockedPlayers()
        .then((info) => {
          setBlackList(info!.data.blocked);
        })
        .catch((error) => throwAsyncError(error));
    }

    return () => {
      try {
        chatSocket?.disconnect();
        //console.log("chat socket disconnected");
        // gameSocket?.disconnect();
        // console.log("game socket disconnected");
      } catch (error) {
        throwAsyncError(error);
      }
    };
  }, []);

  useEffect(() => {
    function updatePlayersList(users: User[]) {
      setPlayersList(
        users.filter((userDB) => {
          if (userDB.id !== user?.id) return true;
          return false;
        })
      );
      // const userDB = users.find(({ nickname }) => nickname === user!.nickname);
      // if (userDB && user) {
      //   const updatedUserDetails = user;
      //   if (updatedUserDetails.isPlaying !== userDB.isPlaying){
          fetchUserDetails()
            .then(userDetailsDB => {
              setUser(userDetailsDB);
            })
            .catch(error => throwAsyncError(error));
      //   }
      // }
    }

    try {
      chatSocket?.on("playersStatusUpdate", updatePlayersList);
    } catch (error) {
      throwAsyncError(error);
    }

    return () => {
      try {
        chatSocket?.off("playersStatusUpdate", updatePlayersList);
      } catch (error) {
        throwAsyncError(error);
      }
    };
  }, [chatSocket]);

  useEffect(() => {
    if (user!.firstCon) {
      setDisplay(true);
    }
    async function getFirstCon() {
      await axiosInstance.get("/user/updateFirstCon");
    }

    getFirstCon().catch((error) => throwAsyncError(error));
  }, []);

  //const matchProfile = useRouteMatch("/profile/:userId");
  function updateUserOnLogout() {
    setUser(null);
  }

  if (!cookies.get("jwt")) {
    //if (gameSocket) gameSocket.disconnect;
    if (chatSocket) chatSocket.disconnect;
    updateUserOnLogout();
    return;
  }

  return (
    <ThemeProvider theme={theme}>
      {user && chatSocket ? (
        <div className="Main">
          {/* Game and Player List - Always together */}
          <Grid item xs={12} md={8} lg={9}>
            <Grid container>
              {/* Player List */}
              <Grid item xs={4} md={3} lg={2}>
                <PlayerList />
              </Grid>

              {/* Game/Leaderboard/Profile */}
              <Grid item xs={8} md={9} lg={10}>
                {location.pathname !== "/" ? location.pathname === "/leaderboard" ? <Leaderboard /> :  <Profile /> : <Game />}
              </Grid>
            </Grid>
          </Grid>

          {/* Chat - Right on large screens, bottom on small/medium screens */}
          <Chat />
        </div>
      ) : (
        <Box sx={{ textAlign: "center" }}>
          <Typography></Typography>
        </Box>
      )}

      <SettingsDialog display={display} setDisplay={setDisplay} />
    </ThemeProvider>
  );
};

export default Main;
