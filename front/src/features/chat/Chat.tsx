/*
** ********************************************************************************
** IMPORTS
** ********************************************************************************
*/
 /* eslint-disable @typescript-eslint/no-explicit-any */
import './Chat.css';
import { useContext, useEffect, useRef, useState } from 'react';
import { UserContext } from "../../App";
import { useThrowAsyncError } from '../../utils/useThrowAsyncError';
import { ChatResponse } from '../../model/ChatResponse';
import { Channel } from '../../model/Channel';
import { User } from '../../model/User';
import { Message } from '../../model/Message';
import { GameInvitation } from '../../model/GameInvitation';
import Live from './Live';
import ChannelDetailsPublic from './ChannelDetailsPublic';
import ChannelDetailsDM from './ChannelDetailsDM';
import SingleChannel from './SingleChannel';
import LiveForbidden from './LiveForbidden';
import {  fetchChannelAdmins,
          fetchChannelMembers,
          fetchChannelMessages,
          fetchChannelInvited,
          fetchUserChannels,
          fetchPublicChannels,
          fetchUserDMs,
          fetchUserPrivateChannels,
          fetchUserProtectedChannels,
          fetchChannelBanned,
          fetchChannelMuted,
          fetchInvitablePlayers,
          fetchUserFriendRequests,
          fetchUserBlackList,
          fetchUserNewMessages,
          fetchDMablePlayers} from './fetchData';
import ChannelDetailsReadonly from './ChannelDetailsReadonly';
import ChannelDetailsALL from './ChannelDetailsALL';
import { Paper, Typography } from '@mui/material';
import { HiUserPlus } from 'react-icons/hi2';
import SelectPlayerDialog from '../../common/dialog/SelectPlayerDialog';
import LiveRestrictedArea from './LiveRestrictedArea';
import ErrorMessageDialog from '../../common/dialog/ErrorMessageDialog';

function Chat() {
/*
** ********************************************************************************
** VARIABLES
** ********************************************************************************
*/
  // console.log("Debut fonction Chat");
  const {user, chatSocket, allPlayers, blackList, setBlackList}   = useContext(UserContext);
  const throwAsyncError                                           = useThrowAsyncError();

  const [channelAdmins, setChannelAdmins]                         = useState<User[]>([]);
  const [channelMembers, setChannelMembers]                       = useState<User[]>([]);
  const [channelInvited, setChannelInvited]                       = useState<User[]>([]);
  const [channelBanned, setChannelBanned]                         = useState<User[]>([]);
  const [channelMuted, setChannelMuted]                           = useState<User[]>([]);
  const [dmAblePlayers, setDmAblePlayers]                         = useState<User[]>([]);
  const [messages, setMessages]                                   = useState<Message[]>([]);
  const [allChannels, setAllChannels]                             = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel]                     = useState<Channel | null>(null);
  const [gameInvitations, setGameInvitations]                     = useState<GameInvitation[]>([]);
  const [friendRequest, setFriendRequests]                        = useState<string[]>([]);
	const [isAdmin, setIsAdmin]                                     = useState(false);
	const [isMember, setIsMember]                                   = useState(false);
	const [canSee, setCanSee]                                       = useState(false);
	const [canJoin, setCanJoin]                                     = useState(false);
	const [canWrite, setCanWrite]                                   = useState(false);
	const [readOnly, setReadOnly]                                   = useState(false);
  const [displayDMDialog, setDisplayDMDialog]                     = useState(false);
  const [displayErrorMessageDialog, setDisplayErrorMessageDialog] = useState(false);
  const [errorMessage, setErrorMessage]                           = useState("");

  const [channelsWithNewMsg, setChannelsWithNewMsg]   = useState<string[]>([]);

/*
** ********************************************************************************
** FUNCTIONS
** ********************************************************************************
*/

  function updateChannelsList(selectFirstChannel:boolean){
    // console.log("Debut fonction updateChannelsList selectedChannel", selectedChannel);
    // Fetch channels from the backend
    Promise
      .all([
        fetchPublicChannels(),
        fetchUserProtectedChannels(user!.id),
        fetchUserPrivateChannels(user!.id),
        fetchUserDMs(user!.id)])
      .then((channels) => {
        try {
          const allPublicChannels: Channel[]      = channels[0];
          const userProtectedChannels: Channel[]  = channels[1];
          const userPrivateChannels: Channel[]    = channels[2];
          const userDMs: Channel[]                = channels[3];
          const allChannelsDB                     = allPublicChannels.concat(userProtectedChannels.concat(userPrivateChannels.concat(userDMs)));
          setAllChannels(allChannelsDB);
          if (selectFirstChannel)
            setSelectedChannel(allChannelsDB[0]);
          else if (selectedChannel) {
            const found = allChannelsDB.find(({ id }) => id === selectedChannel.id);
            if (!found)
              setSelectedChannel(allChannelsDB[0]);
          }

          for (const channel of allChannelsDB) {
            chatSocket!.emit('joinSocketToChannel', { channelName: channel.name});
          }
        } catch (error) {
          throwAsyncError(error);
        }})
      .catch(error => throwAsyncError(error));
  }

  function updateChannelDetails(channelID:string){
    // console.log('Debut fonction updateChannelDetails...');
    Promise
      .all([
        fetchChannelAdmins(channelID),
        fetchChannelMembers(channelID),
        fetchChannelInvited(channelID),
        fetchUserChannels(user!.id),
        fetchChannelBanned(channelID),
        fetchChannelMuted(channelID),
        fetchInvitablePlayers(channelID),
      ])
      .then((values) => {
        try {
          setChannelAdmins(values[0]);
          setChannelMembers(values[1]);
          setChannelInvited(values[2]);
          setChannelBanned(values[4]);
          setChannelMuted(values[5]);
          if (user) {
            const adminsList = values[0].map((userList:User) => userList.nickname);
            const membersList = values[1].map((userList:User) => userList.nickname);
            const invitedList = values[2].map((userList:User) => userList.nickname);
            const mutedList = values[5].map((userList:User) => userList.nickname);
            const bannedList = values[4].map((userList:User) => userList.nickname);
            const membersAndInvitedList = membersList.concat(invitedList);
            setIsAdmin(adminsList.indexOf(user.nickname) !== -1);
            setIsMember(membersList.indexOf(user.nickname) !== -1);
            setReadOnly(bannedList.indexOf(user.nickname) !== -1);
            // setReadOnly(bannedList.indexOf(user.nickname) !== -1 || mutedList.indexOf(user.nickname) !== -1);
            setCanSee(selectedChannel?.type === "PUBLIC" || membersAndInvitedList.indexOf(user.nickname) !== -1);
            const canWriteList = membersList.filter((userNickname:string) => {
              if (mutedList.indexOf(userNickname) !== -1)
                return false;
              return true;
            });
            setCanWrite(canWriteList.indexOf(user.nickname) !== -1);
            const canJoinList = values[6].map((userList:User) => userList.nickname);
            setCanJoin(canJoinList.indexOf(user.nickname) !== -1);
          }
        } catch (error) {
          throwAsyncError(error);
        }
      })
      .catch(error => throwAsyncError(error));
  }

  function createChannel(newChannelValue:string){
    // console.log('Debut fonction createChannel', newChannelValue);
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('token');
      return chatSocket!.emit(
        'createChannel',
        { channelName: newChannelValue, token },
        (response:ChatResponse) => {
            if (!response.ok) {
              if (response.status === 409)
                return reject (response);
              return reject(false);
            }
            return resolve(true);
        });
    })
  }

  function onCreatedChannel(newChannel : Channel, userNickname:string){
    // console.log("Debut fonction onCreatedChannel", newChannel.name);
    try {
      const allChannelNames = allChannels.map((channel:Channel) => channel.name);
      if (allChannelNames.indexOf(newChannel.name) === -1) {
        setAllChannels((prevChannels) => [...prevChannels, newChannel]);
        chatSocket!.emit('joinSocketToChannel', { channelName: newChannel.name});
      }
      // upd selected channel
      if (userNickname === user!.nickname) {
        setSelectedChannel(newChannel);
      }
    } catch (error) {
      throwAsyncError(error);
    }
  }

  function onCreatedDM(newDM : Channel, user1nickname:string, user2nickname:string ){
    // console.log("Debut fonction onCreatedDM", newDM.name);
    try {
      const userDMs = allChannels.filter((channel:Channel) => {
        if (channel.type === "DM")
          return true;
        return false;
      });
      const userDMNames = userDMs.map((channel:Channel) => channel.name);
      if (userDMNames.indexOf(newDM.name) === -1) {
        if (user!.nickname === user1nickname || user!.nickname === user2nickname){
          if (user!.nickname === user1nickname){
            newDM.label = user2nickname;
          } else {
            newDM.label = user1nickname;
          }
          setAllChannels((prevChannels) => [...prevChannels, newDM]);
          chatSocket!.emit('joinSocketToChannel', { channelName: newDM.name});
        }
      }
    } catch (error) {
      throwAsyncError(error);
    }
  }

  function onInviteGame(data:any){
    // console.log("Debut fonction onInviteGame", data.gameId);
    try {
      if (data.invited === user!.nickname){
        // console.log("current user is invited");
        setGameInvitations((prevInvitations) => [...prevInvitations,
          {gameId:data.gameId, dmName:data.dmName}])
      }
    } catch (error) {
      throwAsyncError(error);
    }
  }

  function onImcomingFriendRequest(data:any){
    // console.log("Debut fonction onImcomingFriendRequest", data);
    try {
      if (data.invited === user!.nickname){
        // console.log("current user is invited");
        setFriendRequests((prevRequests) => [...prevRequests, data.host])
      }
    } catch (error) {
      throwAsyncError(error);
    }
  }

  function isBlocked(playerNickname:string){
    const found = blackList.find(({ nickname }) => nickname === playerNickname);
    if (found)
      return true;
    return false;
  }

  /*
  ** ********************************************************************************
  ** USE EFFECTS
  ** ********************************************************************************
  */
  useEffect(() => {
    // Fetch channels from the backend
    if (chatSocket){
      try {
        // subscribe to chat events
        chatSocket.on('createdChannel', onCreatedChannel);
        chatSocket.on('createdDM', onCreatedDM);
        chatSocket.on('inviteGame', onInviteGame);
        chatSocket.on('incomingFriendRequest', onImcomingFriendRequest);
      } catch (error) {
        throwAsyncError(error);
      }
    }

    try {
      // Fetch user channels with new messages
      // Call updateChannelsList before fetchUserNewMessages
      updateChannelsList(true);

      fetchUserNewMessages(user!.id)
        .then((channelsDB) =>{
          setChannelsWithNewMsg(channelsDB);
        })
        .catch(error => throwAsyncError(error));

      // Fetch user friend requests
      fetchUserFriendRequests()
        .then((requests) =>{
          if (requests.length !== 0){
            const pendingFriendRequests = requests.map((request:any) => {
              if (request.user1 === user!.nickname)
                return request.user2;
              else
                return request.user1;
            });
            setFriendRequests(pendingFriendRequests);
          }
        })
        .catch(error => throwAsyncError(error));
    } catch (error) {
      throwAsyncError(error);
    }

    return () => {
      try {
        chatSocket?.off('createdChannel', onCreatedChannel);
        chatSocket?.off('createdDM', onCreatedDM);
        chatSocket?.off('inviteGame', onInviteGame);
        chatSocket?.off('incomingFriendRequest', onImcomingFriendRequest);
      } catch (error) {
        throwAsyncError(error);
      }
    }
  }, [chatSocket]);

  useEffect(() => {
    function updateBlackList() {
      fetchUserBlackList()
      .then(res => {
        setBlackList(res.blocked);
        if (selectedChannel) {
          fetchChannelMessages(selectedChannel!.name, user!.id)
          .then(messagesDB => setMessages(messagesDB))
          .catch(error => throwAsyncError(error));
        }
      })
      .catch(error => throwAsyncError(error));
    }

    // New channel member listener
    function onJoinChannel(newChannel:string){
      // console.log("Debut fonction onJoinChannel");
      try {
        if (selectedChannel && selectedChannel.name === newChannel){
          updateChannelDetails(selectedChannel.id);
        }
      } catch (error) {
        throwAsyncError(error);
      }
    }

    // New message listener
    function onNewMessage(message:Message){
      // console.log("Debut fonction onNewMessage", message);
      try {
        if (message.channelName === selectedChannel!.name){
          fetchChannelMessages(message.channelName, user!.id)
          .then(messagesDB => setMessages(messagesDB))
          .catch(error => throwAsyncError(error));
        }
        else {
          setChannelsWithNewMsg([...channelsWithNewMsg, message.channelName]);
        }
      } catch (error) {
        throwAsyncError(error);
      }
    }
    // New channel update
    function onChannelDetailsUpdated(updChannel:string){
      // console.log("Debut fonction onChannelDetailsUpdated");
      try {
        updateChannelsList(false);
        if (selectedChannel && selectedChannel.name === updChannel){
          updateChannelDetails(selectedChannel.id);
        }
      } catch (error) {
        throwAsyncError(error);
      }
    }

    function onDeletedChannel(oldChannel : Channel){
      // console.log("Debut fonction onDeletedChannel");
      try {
        setSelectedChannel(allChannels[0]);
        const newChannelsList = allChannels.filter((channel:Channel) => {
          if (channel.name === oldChannel.name)
            return false;
          return true;
        });
        setAllChannels(newChannelsList);
    } catch (error) {
      throwAsyncError(error);
    }
  }

  function onChannelTypeUpdated(){
    // console.log("Debut fonction onChannelTypeUpdated");
    // Fetch channels from the backend
    try {
      updateChannelsList(false);
    } catch (error) {
      throwAsyncError(error);
    }
  }

  try {
    // Fetch ALL messages
    if (selectedChannel){
      updateChannelDetails(selectedChannel.id);
      fetchChannelMessages(selectedChannel.name, user!.id)
      .then(messagesDB => setMessages(messagesDB))
      .catch(error => throwAsyncError(error));
    }

    // Subscribe to socket events
    chatSocket!.on('join', onJoinChannel);
    chatSocket!.on('message', onNewMessage);
    chatSocket!.on('deletedChannel', onDeletedChannel);
    chatSocket!.on('channelTypeUpdated', onChannelTypeUpdated);
    chatSocket!.on("updateBlackList", updateBlackList);
    chatSocket!.on('channelDetailsUpdated', onChannelDetailsUpdated);
  }
  catch (error) {
    throwAsyncError(error);
  }

  // Clean listeners
  return () => {
    try {
      chatSocket?.off('join', onJoinChannel);
      chatSocket?.off('message', onNewMessage);
      chatSocket?.off('deletedChannel', onDeletedChannel);
      chatSocket?.off('channelTypeUpdated', onChannelTypeUpdated);
      chatSocket?.off("updateBlackList", updateBlackList);
      chatSocket?.off('channelDetailsUpdated', onChannelDetailsUpdated);
    } catch (error) {
        throwAsyncError(error);
      }
    }
  }, [selectedChannel, allPlayers]);

/*
** ********************************************************************************
** EVENT LISTENERS
** ********************************************************************************
*/
  const newChannel = useRef<HTMLInputElement>(null); // Ref pour le nom du nouveau channel
  const handleSubmitNewChannel = (event: React.FormEvent) => {
    // console.log("Debut fonction handleSubmitNewChannel");
    event.preventDefault();
    try {
      if (newChannel.current){
        const newChannelValue = newChannel.current.value.trim();
        // Vérifier input
        if (newChannelValue === ""){
          setErrorMessage('Invalid channnel name!');
          setDisplayErrorMessageDialog(true);
        }
        else {
          // Vérifier si le channel existe déjà dans la liste
          const allChannelsList = allChannels.map((channel:Channel) => channel.name);
          if (allChannelsList.indexOf(newChannelValue) !== -1) {
            setErrorMessage('A channel with the same name already exists!');
            setDisplayErrorMessageDialog(true);
          }
          else {
            createChannel(newChannelValue)
            .then (() => {
              newChannel.current!.value = "";
            })
            .catch(error => {
              if (error.status === 409) {
                setErrorMessage('A channel with the same name already exists!');
                setDisplayErrorMessageDialog(true);
              } else {
                throwAsyncError(error)
              }
            });
          }
        }
      }
    } catch (error) {
        throwAsyncError(error);
    }
  }

  const handleSelectedChannel = (channelDetails: Channel) => {
    // console.log("Debut fonction handleSelectedChannel");
    try {
      setSelectedChannel(channelDetails);
      const tmp = channelsWithNewMsg.filter((name) => {
        if (name === channelDetails.name)
          return false;
        return true;
      });
      setChannelsWithNewMsg(tmp);
      updateChannelDetails(channelDetails.id);
      fetchChannelMessages(channelDetails.name, user!.id)
        .then(messagesDB => setMessages(messagesDB))
        .catch(error => throwAsyncError(error));
    } catch (error) {
        throwAsyncError(error);
    }
    return true;
  }

  const handleDMrequest = (player: string) => {
    // console.log("handleDMrequest", player);
    try {
      setDisplayDMDialog(false);
      chatSocket!.emit("createDm", { player }, (response: ChatResponse) => {
        if (!response.ok)
          throwAsyncError(
            "Error sending DM request " +
              response.status +
              " " +
              response.statusText
          );
      });
    } catch (error) {
      throwAsyncError(error);
    }
    return true;
  };

  const onDisplayDMDialog = () => {
    // console.log("onDisplayDMDialog");
    try {
      fetchDMablePlayers(user!.id)
        .then((usersDB) => {
          setDmAblePlayers(usersDB);
          setDisplayDMDialog(true);
        })
        .catch(error => throwAsyncError(error));
    } catch (error) {
      throwAsyncError(error);
    }
    return true;
  };

/*
** ********************************************************************************
** UI COMPONENT
** ********************************************************************************
*/
  if (!selectedChannel)
    return null;

  return (

    <Paper elevation={3} className="Chat" sx={{
      marginTop: 2,
      borderRadius: 1,
      // boxShadow: 'none', // Supprime l'ombre
      border: `1px solid #366873`, // Ajoute une bordure de couleur #366873
      height: 'calc(100vh - 120px)', 
      bgcolor: 'background.default',
      }}>
      

      {/* Header */}
      <div className="Chat__header">
      
      <Typography className="Chat__header__title" sx={{color:'#015958', fontWeight:'bold', fontSize: '13px'}}>Channels</Typography>
        <HiUserPlus title="DM a player" className="Chat__header__icon" onClick={onDisplayDMDialog}/>
        {displayDMDialog && (
          <SelectPlayerDialog
            title="Send a direct message request"
            display={displayDMDialog}
            setDisplay={setDisplayDMDialog}
            actionLabel="Send"
            players={dmAblePlayers}
            handleRequest={handleDMrequest}
          />
        )}
      </div>

      <div className='Chat__main'>
        {/* Channel list */}
        <div className="Chat__channels">
          <form className="Chat__newChannelForm" onSubmit={handleSubmitNewChannel}>
              <input ref={newChannel} className="Chat__newChannelForm__input inputChat"
                type="text"
                placeholder="New channel"
              />
          </form>
          <div className="ChannelsList">
            {allChannels.map((channelListItem) => (
              <SingleChannel key={channelListItem.id}
                channel={channelListItem}
                isSelected={channelListItem.name === selectedChannel.name}
                hasUnreadMessage={channelsWithNewMsg.indexOf(channelListItem.name) !== -1}
                handleSelectedChannel={handleSelectedChannel}
                />
              ))}
            </div>
          </div>

        {/* Messages */}
        {canSee && (selectedChannel.type !== "PROTECTED" || (selectedChannel.type === "PROTECTED" && isMember)) &&
          <Live
            channel={selectedChannel}
            isMember={isMember}
            isPlaying={user!.isPlaying}
            canWrite={canWrite}
            channelInvited={channelInvited}
            gameInvitations={gameInvitations}
            setGameInvitations={setGameInvitations}
            friendRequest={friendRequest.filter((request) => {
              if (request === selectedChannel.label && !isBlocked(selectedChannel.label))
                return true;
              return false;
            })}
            setFriendRequests={setFriendRequests}
            messages={messages}
            />
        }
        {canSee && selectedChannel.type === "PROTECTED" && !isMember &&
          <LiveRestrictedArea channel={selectedChannel} />
        }
        {!canSee &&
          <LiveForbidden />
        }
      </div>


      {/* Channel details */}
      {selectedChannel.name ==="ALL" &&
        <ChannelDetailsALL
          channel={selectedChannel}
          channelAdmins={channelAdmins}
          channelMembers={channelMembers}
          channelInvited={channelInvited}/>
      }
      {readOnly &&
        <ChannelDetailsReadonly
          channel={selectedChannel}
          channelAdmins={channelAdmins}
          channelMembers={channelMembers}
          channelInvited={channelInvited}
          channelBanned={channelBanned}
          channelMuted={channelMuted}/>
      }
      {!readOnly && selectedChannel.name !=="ALL" && (selectedChannel.type !== "PROTECTED" || (selectedChannel.type === "PROTECTED" && isMember)) && selectedChannel.type !== "DM"  &&
        <ChannelDetailsPublic
          channel={selectedChannel}
          isAdmin={isAdmin}
          isMember={isMember}
          canJoin={canJoin}
          channelAdmins={channelAdmins}
          channelMembers={channelMembers}
          channelInvited={channelInvited}
          channelBanned={channelBanned}
          channelMuted={channelMuted}/>
      }
      {!readOnly && selectedChannel.type === "DM" &&
        <ChannelDetailsDM
          channel={selectedChannel}
          channelAdmins={channelAdmins}
          channelMembers={channelMembers}
          channelInvited={channelInvited}/>
      }

      {/* Error Message Dialog */}
      {displayErrorMessageDialog &&
        <ErrorMessageDialog
          displayErrorMessageDialog={displayErrorMessageDialog}
          setDisplayErrorMessageDialog={setDisplayErrorMessageDialog}
          errorMessage={errorMessage}
        />
      }
    </Paper>
  );
}

export default Chat;
