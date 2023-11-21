import { FC, useContext, useEffect, useState } from "react";
import { GameMdl } from "../../../model/GameMdl";
import { User } from "../../../model/User";
import { Avatar, Button, Dialog, DialogActions, DialogContent, Typography } from "@mui/material";
import { useThrowAsyncError } from "../../../utils/useThrowAsyncError";
import { UserContext } from "../../../App";
import { ChatResponse } from "../../../model/ChatResponse";
import { GameResponse } from "../../../model/GameResponse";
import axiosInstance from "../../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { Cookies } from "react-cookie";
import baseURL from "../../../utils/baseURL";
import { useLocation } from "react-router-dom";

interface UserListProps {
  selectedUser: User | null;
  selectedGames: GameMdl[] | null;
  closeUserDialog: () => void;
  isFriends: boolean;
  isBlocked: boolean;
}

const UserInfoDialog: FC<UserListProps> = ({ selectedUser, closeUserDialog, isFriends, isBlocked }) => {
  const { user, gameSocket, chatSocket, setGameSocket } = useContext(UserContext);
  const throwAsyncError = useThrowAsyncError();
  const [hasPendingRequest, setPendingRequest] = useState(false);
  const [gameInvitationError, setGameInvitationError] = useState<string>("");
  const navigate = useNavigate();
  const cookies = new Cookies();
  const location = useLocation();

  async function getFriendRequests() {
    try {
      const res = await axiosInstance.get("/user/userFriendRequests");

      return res.data;
    } catch (error: unknown) {
      throwAsyncError(error as Error);
    }
  }

  useEffect(() => {
    if (user && selectedUser) {
      getFriendRequests()
        .then((data) => {
          const pendings = data.filter((request: any) => {
            if (
              (request.user1 === user!.nickname && request.user2 === selectedUser!.nickname) ||
              (request.user2 === user!.nickname && request.user1 === selectedUser!.nickname)
            ) {
              return true;
            }
            return false;
          });
          if (pendings.length !== 0) setPendingRequest(true);
          else setPendingRequest(false);
        })
        .catch((error) => throwAsyncError(error));
    }
  }); // dependency on mount cant be used

  useEffect(() => {
    setGameInvitationError("");
  }, [closeUserDialog]);

  function onAddFriend(userTarget: User) {
    const host = user!.nickname;
    const player = userTarget.nickname;
    try {
      chatSocket!.emit("friendRequest", { host, player }, (response: ChatResponse) => {
        if (!response.ok) throwAsyncError("Error sending Friend request " + response.status + " " + response.statusText);
      });
      closeUserDialog();
    } catch (error: unknown) {
      throwAsyncError(error as Error);
    }
  }

  function onRemoveFriend(userTarget: User) {
    try {
      chatSocket?.emit("removeFriend", {
        friend: userTarget,
      });
      closeUserDialog();
    } catch (error: unknown) {
      throwAsyncError(error as Error);
    }
  }

  function onBlockPlayer(userTarget: User) {
    try {
      chatSocket?.emit("blockPlayer", {
        friend: userTarget,
      });
      closeUserDialog();
    } catch (error: unknown) {
      throwAsyncError(error as Error);
    }
  }

  function onUnblockPlayer(userTarget: User) {
    try {
      chatSocket?.emit("unblockPlayer", {
        friend: userTarget,
      });
      closeUserDialog();
    } catch (error: unknown) {
      throwAsyncError(error as Error);
    }
  }

  function onInviteForGame(selectedUser: User) {
    try {
      if (!gameSocket!.connected) {
        const socket = io(baseURL + "/game", {
          forceNew: true,
          query: { tokenJwt: cookies.get("jwt") },
        });
        setGameSocket(socket);
        socket!.emit("createAnInviteGame", selectedUser, (response: GameResponse) => {
          if (!response.ok) {
            setGameInvitationError(response.statusText);
          }
        });
      } else {
        gameSocket!.emit("createAnInviteGame", selectedUser, (response: GameResponse) => {
          if (!response.ok) {
            setGameInvitationError(response.statusText);
          }
        });
      }
    } catch (error: unknown) {
      throwAsyncError(error as Error);
    }
  }

  const openGameDialog = () => {
    closeUserDialog();
    navigate(`/profile/${selectedUser!.id}`);
  };

  if (!selectedUser) {
    return null;
  }

  return (
    <Dialog open={true} onClose={closeUserDialog}>
      <DialogContent>
        {gameInvitationError && <div style={{ color: "red" }}>{gameInvitationError}</div>}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: "20px" }}>
            <Typography variant="h5">{selectedUser.nickname}</Typography>
            <div>
              <strong>Email:</strong> {selectedUser.email}
            </div>
            <div>
              <strong>Full Name:</strong> {selectedUser.fullName}
            </div>
          </div>
          <Avatar alt="User Avatar" src={selectedUser.imageUrl} className="avatar" sx={{ width: 70, height: 70 }} />
        </div>
      </DialogContent>
      <DialogActions>
        {onAddFriend && !isFriends && !hasPendingRequest && !isBlocked && (
          <Button onClick={() => onAddFriend(selectedUser)} color="primary">
            Add Friend
          </Button>
        )}
        {onRemoveFriend && isFriends && (
          <Button onClick={() => onRemoveFriend(selectedUser)} color="primary">
            Remove Friend
          </Button>
        )}
        {!isFriends && !isBlocked && (
          <Button onClick={() => onBlockPlayer(selectedUser)} color="primary">
            Block Player
          </Button>
        )}
        {isBlocked && (
          <Button onClick={() => onUnblockPlayer(selectedUser)} color="primary">
            Unblock Player
          </Button>
        )}
        {location.pathname === "/" && !isBlocked && selectedUser.online && !user?.isPlaying && (
          <Button onClick={() => onInviteForGame(selectedUser)} color="primary">
            Start a game
          </Button>
        )}
        <Button onClick={openGameDialog} color="primary">
          View Profile
        </Button>
        <Button onClick={closeUserDialog} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserInfoDialog;
