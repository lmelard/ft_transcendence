/* eslint-disable @typescript-eslint/no-explicit-any */
import "./PlayerList.css";
import { useContext, useState, useEffect } from "react";
import { User } from "../../model/User";
import { Avatar, Divider, List, ListItem, ListItemAvatar, ListItemText, ListSubheader, Paper, Typography } from "@mui/material";
import { ChatResponse } from "../../model/ChatResponse";
import { UserContext } from "../../App";
import { useThrowAsyncError } from "../../utils/useThrowAsyncError";
import { GameMdl } from "../../model/GameMdl";
import UserInfoDialog from "./dialog/UserInfoDialog";
import axiosInstance from "../../utils/axiosInstance";

function PlayerList() {
  const { gameSocket, chatSocket, allPlayers, friendsList, blackList, setFriendsList } = useContext(UserContext);
  const throwAsyncError = useThrowAsyncError();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedGames, setSelectedGames] = useState<GameMdl[] | null>(null);
  const [gameInvitationError, setGameInvitationError] = useState<string>("");
  const [display, setDisplay] = useState<boolean>(false);

  /*
   ** Handle game invite
   ** ********************************************************************************
   */
  useEffect(() => {
    try {
      if (gameSocket) {
        gameSocket.on("createdGame", onCreatedGame);
      }
    } catch (error) {
      throwAsyncError(error);
    }

    return () => {
      try {
        gameSocket?.off("createdGame", onCreatedGame);
      } catch (error) {
        throwAsyncError(error);
      }
    };
  }, [gameSocket, selectedUser]);

  function onCreatedGame(game: any) {
    if (selectedUser) {
      try {
        chatSocket?.emit("inviteGame", { player: selectedUser, gameId: game.id }, (response: ChatResponse) => {
          if (!response.ok) {
            setGameInvitationError(response.statusText);
          }
        });
      } catch (error) {
        throwAsyncError(error);
      }
    }
  }

  useEffect(() => {
    setGameInvitationError("");
  }, [setSelectedUser]);
  /*
   ** ********************************************************************************
   */

  const generateUserList = (filteredUsers: User[]) => {
    return filteredUsers.map((filteredUser) => (
      <ListItem key={filteredUser.id} button onClick={() => openUserDialog(filteredUser)} className="PlayerList__item">
        <ListItemAvatar>
          <Avatar src={filteredUser.imageUrl} alt={filteredUser.nickname} className="PlayerList__avatar" />
        </ListItemAvatar>
        <ListItemText primary={filteredUser.nickname} primaryTypographyProps={{ className: "PlayerList__text" }} />
        <div className={`PlayerList__status ${filteredUser.online ? (filteredUser.isPlaying ? "playing" : "online") : "offline"}`} />
      </ListItem>
    ));
  };

  // function onGetUserInfo(data: any) {
  //   setSelectedUser(data.userinfo);
  //   setSelectedGames(data.gamesInfo);
  // }

  const openUserDialog = async (user: User) => {
    setDisplay(true); // TEST LENA
    setSelectedUser(user);
    const tmpUser = await axiosInstance.post('user/userById', user);
    setSelectedUser(tmpUser.data);
  };

  const closeUserDialog = () => {
    setDisplay(false);
    setSelectedUser(null);
    setSelectedGames(null);
  };

  function userIsFriend(user: User | null, friends: User[]) {
    if (friends && user && friends.some((friend) => friend.id === user.id)) {
      return true;
    }
    return false;
  }

  function userIsBlocked(user: User | null, blocked: User[]) {
    if (blocked && user && blocked.some((player) => player.id === user.id)) {
      return true;
    }
    return false;
  }

  function userIsOther(user: User, friends: User[], blocked: User[]) {
    if (friends.some((player) => player.id === user.id) || blocked.some((player) => player.id === user.id)) {
      return false;
    }
    return true;
  }

  /*
   ** Handle friends and blocked players update
   ** ********************************************************************************
   */
  useEffect(() => {
    if (chatSocket) {
      try {
        // subscribe to chat events
        chatSocket.on("updateOnFriend", updateFriendsList);
      } catch (error) {
        throwAsyncError(error);
      }
    }

    return () => {
      try {
        chatSocket?.off("updateOnFriend", updateFriendsList);
      } catch (error) {
        throwAsyncError(error);
      }
    };
  }, [chatSocket]);

  async function getFriendsList() {
    try {
      const friendsList = await axiosInstance.get("/user/allFriends");
      return friendsList;
    } catch (error) {
      throwAsyncError(error);
    }
  }

  function updateFriendsList() {
    getFriendsList()
      .then((info) => {
        setFriendsList(info!.data.friends);
      })
      .catch((error) => throwAsyncError(error));
  }
  /*
   ** ********************************************************************************
   */

  return (
    <Paper
      elevation={3}
      sx={{
        marginTop: 2,
        // maxWidth: 200,
        // minWidth: 150,
        // overflowX: "auto",
        overflowY: "auto",
        borderRadius: 1,
        height: 'calc(100vh - 120px)',
        bgcolor: 'background.default', 
        // boxShadow: 'none', // Supprime l'ombre
        border: `1px solid #366873` // Ajoute une bordure de couleur #366873
      }}
    >
      {gameInvitationError && <Typography color="error">{gameInvitationError}</Typography>}
      <Typography className="PlayerList__title" sx={{color:'#015958', fontWeight:'bold', fontSize: '13px'}}>
          Players
        </Typography>
      <List className="PlayerList__list">
        <ListSubheader
          sx={{
            marginTop: 2,
            maxWidth: 200,
            overflowY: "auto",
            borderRadius: 1,
            bgcolor: 'background.default',
            color:"black" 
          }}
        >
          Friends
        </ListSubheader>
        {generateUserList(allPlayers.filter((user) => userIsFriend(user, friendsList)))}
        <Divider />
        <ListSubheader
          sx={{
            marginTop: 2,
            maxWidth: 200,
            overflowY: "auto",
            borderRadius: 1,
            bgcolor: 'background.default',
            color:"black" 
          }}
        >
          Other players
        </ListSubheader>
        {generateUserList(allPlayers.filter((user) => userIsOther(user, friendsList, blackList)))}
        <Divider />
        <ListSubheader
          sx={{
            marginTop: 2,
            maxWidth: 200,
            overflowY: "auto",
            borderRadius: 1,
            bgcolor: 'background.default',
            color:"black" 
          }}
        >
          Blocked players
        </ListSubheader>
        {generateUserList(allPlayers.filter((user) => userIsBlocked(user, blackList)))}
      </List>

      {display && (
        <>
        <UserInfoDialog
          selectedUser={selectedUser}
          selectedGames={selectedGames}
          closeUserDialog={closeUserDialog}
          isFriends={userIsFriend(selectedUser, friendsList)}
          isBlocked={userIsBlocked(selectedUser, blackList)}
        />
        </>
      )}
    </Paper>
  );
}

export default PlayerList;
