/*
 ** ********************************************************************************
 ** IMPORTS
 ** ********************************************************************************
 */
import "./Live.css";
import "./Chat.css";
import { useContext, useRef, useState } from "react";
import { UserContext } from "../../App";
import { useThrowAsyncError } from "../../utils/useThrowAsyncError";
import { Channel } from "../../model/Channel";
import { Message } from "../../model/Message";
import { ChatResponse } from "../../model/ChatResponse";
import { User } from "../../model/User";
import { GameInvitation } from "../../model/GameInvitation";
import { RiCheckboxCircleFill } from "react-icons/ri";
import SingleMessage from "./SingleMessage";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import baseURL from "../../utils/baseURL";
import { Cookies } from "react-cookie";
import { fetchSelectedChannel } from "./fetchData";
import LiveRestrictedArea from "./LiveRestrictedArea";


interface Props {
  channel: Channel;
  isMember: boolean;
  isPlaying: boolean;
  canWrite: boolean;
  messages: Message[];
  channelInvited: User[];
  gameInvitations: GameInvitation[];
  setGameInvitations: React.Dispatch<React.SetStateAction<GameInvitation[]>>;
  friendRequest:string[];
  setFriendRequests: React.Dispatch<React.SetStateAction<string[]>>;
}

function Live({
  channel,
  isMember,
  isPlaying,
  canWrite,
  messages,
  channelInvited,
  gameInvitations,
  setGameInvitations,
  friendRequest,
  setFriendRequests,
  }: Props) {
  /*
   ** ********************************************************************************
   ** VARIABLES
   ** ********************************************************************************
   */
  // console.log("Debut fonction Live isPlaying:", isPlaying);
  const { user,  gameSocket, chatSocket, blackList, setGameSocket }   = useContext(UserContext);
  const throwAsyncError                                               = useThrowAsyncError();
  const [isRestricted, setRestricted]                                 = useState(false);
  // const navigate                                                      = useNavigate();
  const cookies                                                       = new Cookies();

  let isInvitedGame                                                   = false;
  let isInvitedGameWait                                               = false;
  let isInvitedGameRedirect                                           = false;
  let isRequestedFriend                                               = false;
  let isInvited                                                       = false;
  const location = useLocation();

  const myGameInvitations = gameInvitations.filter((invite) => {
    if (invite.dmName === channel.name)
      return true;
    return false;
  });
  try {
    if (myGameInvitations.length !== 0 || friendRequest.length !== 0) {
      if (myGameInvitations.length !== 0){
        isInvitedGame = true;
        if (isPlaying) {
          isInvitedGameWait = true;
        } else if (location.pathname !== '/') {
          isInvitedGameRedirect = true;
        }
        // console.log("isPlaying:", isPlaying); 
        // console.log("isInvitedGame:", isInvitedGame);
        // console.log("isInvitedGameWait:", isInvitedGameWait);
        // console.log("isInvitedGameRedirect:", isInvitedGameRedirect);
      }
      if (friendRequest.length !== 0)
        isRequestedFriend = true;
    } else {
      if (!isBlocked(channel.label)){
        const invitedNicknames = channelInvited.map(
          (invited) => invited.nickname
        );
        isInvited = invitedNicknames.indexOf(user!.nickname) !== -1;
      }
    }
    fetchSelectedChannel(channel.id)
      .then((channelDB:Channel) => {
        if (channelDB.type === "PROTECTED" && !isMember) {
          setRestricted(true);
        }
      })
      .catch(error => throwAsyncError(error));
  } catch (error) {
    throwAsyncError(error);
  }

  /*
   ** ********************************************************************************
   ** FUNCTIONS
   ** ********************************************************************************
  */

  function isBlocked(playerNickname:string){   
    const found = blackList.find(({ nickname }) => nickname === playerNickname);
    if (found)
      return true;
    return false;
  } 

  function sendMessage(message: string) {
    // console.log("Debut fonction sendMessage");
    return new Promise((resolve, reject) => {
      return chatSocket!.emit(
        "createMessage",
        { channelName: channel.name, message: message },
        (response: ChatResponse) => {
          if (!response.ok) return reject(false);
          return resolve(true);
        }
      );
    });
  }

  function joinChannel(auto: boolean) {
    // console.log("Debut fonction joinChannel");
    return new Promise((resolve, reject) => {
      return chatSocket!.emit(
        "joinChannel",
        { channelName: channel.name, auto: auto },
        (response: ChatResponse) => {
          if (!response.ok) 
            return reject(false);
          return resolve(true);
        }
      );
    });
  }

  function acceptGameInvitation () {
    // navigate("/");  
    try {
      setGameInvitations(
        gameInvitations.filter((invite) => {
          if (invite.dmName === channel.name) 
          return false;
        return true;
      })
      );
      if (!gameSocket!.connected){
        const socket = io(baseURL + "/game", {
            forceNew: true,
            query: { tokenJwt: cookies.get("jwt") },
        });
          setGameSocket(socket);
        // console.log('BEFORE JOIN INVIT', gameSocket)
        socket!.emit("joinInvitation", myGameInvitations[0].gameId, (response: ChatResponse) => {
        // console.log('AFTER JOIN INVIT', gameSocket)


          if (!response.ok) {
            throw Error(response.statusText);
          } else {
            // console.log("RESPONSE GAME INVIT", response);
          }
        });
      } else {
        gameSocket!.emit("joinInvitation", myGameInvitations[0].gameId, (response: ChatResponse) => {
          if (!response.ok) {
            throw Error(response.statusText);
          } else {
            // console.log("RESPONSE GAME INVIT", response);
          } 
        });
      }
      sendMessage("Game invitation accepted.");
    } catch (error) {
      throwAsyncError(error);
    }
  }
  
  function acceptFriendRequest(){
    try {
      setFriendRequests(
        friendRequest.filter((invite) => {
          if (invite === channel.label)
            return false;
          return true;
        })
      );
      const friendNickname = channel.label;
      chatSocket!.emit("addFriend", {friendNickname});
      sendMessage("Friend request accepted.");
    } catch (error) {
      throwAsyncError(error);
    }
  }
  /*
   ** ********************************************************************************
   ** EVENT LISTENERS
   ** ********************************************************************************
   */

  const newMessage = useRef<HTMLInputElement>(null);
  const handleSubmitNewMessage = (event: React.FormEvent) => {
    // console.log("Debut fonction handleSubmitNewMessage");
    event.preventDefault();
    try {
      if (newMessage.current) {
        const msg = newMessage.current.value.trim();
        if (msg !== "") {
          if (!isMember) {
            joinChannel(true)
              .then(() => sendMessage(msg))
              .catch((error) => {
                throwAsyncError(error);
              });
          } else {
            sendMessage(msg).catch((error) => {
              throwAsyncError(error);
            });
          }
          newMessage.current.value = "";
        }
      }
    } catch (error) {
      throwAsyncError(error);
    }
  };

  const handleAcceptJoinChannel = (event: React.FormEvent) => {
    // console.log("Debut fonction handleAcceptJoinChannel");
    event.preventDefault();
    try {
      joinChannel(false).catch((error) => {
        throwAsyncError(error);
      });
    } catch (error) {
      throwAsyncError(error);
    }
  };

  const handleAcceptGame = (event: React.FormEvent) => {
    // console.log("Debut fonction handleAcceptGame");
    event.preventDefault();
    try {
      if (isMember) {
        acceptGameInvitation();
      } else {
        joinChannel(true)
          .then(() => {acceptGameInvitation()});
      }
    } catch (error) {
      throwAsyncError(error);
    }
  };



  const handleAcceptFriendRequest = (event: React.FormEvent) => {
    // console.log("Debut fonction handleAcceptFriendRequest");
    event.preventDefault();
    try {
      if (isMember) {
        acceptFriendRequest();
      } else {
        joinChannel(true)
          .then(() => {acceptFriendRequest()})
      }
    } catch (error) {
      throwAsyncError(error);
    }
  };

  /*
   ** ********************************************************************************
   ** UI COMPONENT
   ** ********************************************************************************
   */
  if (isRestricted) {
    return <LiveRestrictedArea channel={channel} />
  }

  return (
    <div className="Live">
      <div className="Messages">
        {messages.map((message) => (
          <SingleMessage key={message.id} message={message} />
        ))}
        {isInvitedGame && !isInvitedGameRedirect && !isInvitedGameWait && (
          <span>
            You are invited to join a game
            <RiCheckboxCircleFill
              title="Accept"
              className="Live__invitIcons accept"
              onClick={handleAcceptGame}
            />
          </span>
        )}
        {isInvitedGameRedirect && (
          <span>
            You are invited to join a game: please go to the Game page to accept invitation.
          </span>
        )}
        {isInvitedGameWait && (
          <span>
            You are invited to join a game: you can accept invitation when the game is finished.
          </span>
        )}
{/*         {isInvitedGame && (
          <>
          {location.pathname === '/' ? (
          <>
            <span>
              You are invited to join a game
              <RiCheckboxCircleFill
                title="Accept"
                className="Live__invitIcons accept"
                onClick={handleAcceptGame}
              />
            </span>
            </>
            ) : (
              <p>Please go to the Game page to accept invitation</p>
            )

          }
          </>
        )} */}
        {isRequestedFriend && (
          <>
            <span>
              You received a friend request
              <RiCheckboxCircleFill
                title="Accept"
                className="Live__invitIcons accept"
                onClick={handleAcceptFriendRequest}
              />
            </span>
          </>
        )}
        {isInvited && (
          <>
            <span>
              You are invited to join this channel
              <RiCheckboxCircleFill
                title="Accept"
                className="Live__invitIcons accept"
                onClick={handleAcceptJoinChannel}
              />
            </span>
          </>
        )}
      </div>
      <form onSubmit={(e) => handleSubmitNewMessage(e)}>
        <input
          ref={newMessage}
          className="inputChat"
          type="text"
          placeholder={"Message #" + channel.name}
          disabled={!canWrite}
        />
      </form>
    </div>
  );
}

export default Live;
