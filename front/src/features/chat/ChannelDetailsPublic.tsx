/*
** ********************************************************************************
** IMPORTS
** ********************************************************************************
*/
import './ChannelDetails.css';
import './Chat.css';
import { Channel } from '../../model/Channel';
import { User } from '../../model/User';
import { useContext, useEffect, useState } from 'react';
import { useThrowAsyncError } from '../../utils/useThrowAsyncError';
import { UserContext } from '../../App';
import SelectPlayerDialog from '../../common/dialog/SelectPlayerDialog';
import { ChatResponse } from '../../model/ChatResponse';
import { HiUserPlus, HiUserMinus } from "react-icons/hi2";
import { MdCached } from "react-icons/md";
import { IoLogOutOutline, IoLogInOutline } from "react-icons/io5";
import {  fetchAdminAblePlayers,
          fetchBannablePlayers,
          fetchInvitablePlayers,
          fetchKickablePlayers,
          fetchMutablePlayers,
          fetchChannelBanned,
          fetchUnadminAblePlayers,
          fetchSelectedChannel } from './fetchData';
import ChannelTypeDialog from './ChannelTypeDialog';

interface Props {
  channel: Channel;
  isAdmin: boolean;
  isMember: boolean;
  canJoin: boolean;
  channelAdmins: User[];
  channelMembers: User[];
  channelInvited: User[];
  channelBanned: User[];
  channelMuted: User[];
}

function ChannelDetailsPublic({channel, isAdmin, isMember, canJoin,
  channelAdmins, channelMembers, channelInvited, channelBanned, channelMuted}:Props) {
/*
** ********************************************************************************
** VARIABLES
** ********************************************************************************
*/
  // console.log("Debut fonction ChannelDetailsPublic:", channel.name);
  const { user, chatSocket}                          = useContext(UserContext);
  const throwAsyncError                           = useThrowAsyncError();

	const [isOwner, setOwner]                           = useState(false);
	const [displayInvite, setDisplayInvite]             = useState(false);
	const [displayBan, setDisplayBan]                   = useState(false);
	const [displayKick, setDisplayKick]                 = useState(false);
	const [displayMute, setDisplayMute]                 = useState(false);
  const [displayUnban, setDisplayUnban]               = useState(false);
	const [displaySetAsAdmin, setDisplaySetAsAdmin]     = useState(false);
	const [displayUnsetAsAdmin, setDisplayUnsetAsAdmin] = useState(false);
  const [displayChannelType, setDisplayChannelType]   = useState(false);
  const [invitablePlayers, setInvitablePlayers]       = useState<User[]>([]);
  const [adminablePlayers, setAdminablePlayers]       = useState<User[]>([]);
  const [bannablePlayers, setBannablePlayers]         = useState<User[]>([]);
  const [mutablePlayers, setMutablePlayers]           = useState<User[]>([]);
  const [kickablePlayers, setKickablePlayers]         = useState<User[]>([]);
  const [unbannablePlayers, setUnbannablePlayers]     = useState<User[]>([]);
  const [unadminablePlayers, setUnadminablePlayers]   = useState<User[]>([]);
  const [channelDetails, setChannelDetails]           = useState<Channel>(channel);
  const [password, setPassword]                       = useState('');
  
  // // console.log('isOwner', user!.nickname, isOwner);
  // // console.log('isAdmin', user!.nickname, isAdmin);
  // // console.log('isMember', user!.nickname, isMember);
  // // console.log('canJoin', user!.nickname, canJoin);

/*
** ********************************************************************************
** USE EFFECTS
** ********************************************************************************
*/

  useEffect (() => {
    try {
      setOwner(false);
      fetchSelectedChannel(channel.id)
        .then(channelDB => setChannelDetails(channelDB))
        .catch(error => throwAsyncError(error));

      fetchAdminAblePlayers(channel.id).then(playersDB => setAdminablePlayers(playersDB))
      .catch(error => throwAsyncError(error));

      fetchInvitablePlayers(channel.id).then(playersDB => setInvitablePlayers(playersDB))
      .catch(error => throwAsyncError(error));

      fetchBannablePlayers(channel.id).then(playersDB => setBannablePlayers(playersDB))
      .catch(error => throwAsyncError(error));

      fetchMutablePlayers(channel.id).then(playersDB => setMutablePlayers(playersDB))
      .catch(error => throwAsyncError(error));

      fetchKickablePlayers(channel.id).then(playersDB => setKickablePlayers(playersDB))
      .catch(error => throwAsyncError(error));

      fetchChannelBanned(channel.id).then(playersDB => setUnbannablePlayers(playersDB))
      .catch(error => throwAsyncError(error));

      fetchUnadminAblePlayers(channel.id).then(playersDB => setUnadminablePlayers(playersDB))
      .catch(error => throwAsyncError(error));

      if (channelDetails && channelDetails.owner && user && channelDetails.owner.id === user.id)
        setOwner(true);
    } catch (error) {
      throwAsyncError(error);
    }
  }, [channel, channelAdmins, channelMembers, channelInvited]);

/*
** ********************************************************************************
** EVENT LISTENERS
** ********************************************************************************
*/
  const handleInviteRequest = (player:string) => {
    // console.log('ChannelDetails handleInviteRequest');
    try {
      setDisplayInvite(false);
      chatSocket!.emit('inviteToChannel',
        { player:player, channelName:channel.name },
        (response:ChatResponse) => {
          if (!response.ok)
            throwAsyncError("Error sending DM request " + response.status + " " + response.statusText)
        });
    } catch (error) {
        throwAsyncError(error);
    }
    return true;
  }

  const handleJoinChannel = async () => {
    // console.log('Debut fonction handleJoinChannel');
    try {
      chatSocket!.emit('joinChannel',
        { channelName: channel.name, auto: true },
        (response:ChatResponse) => {
          if (!response.ok)
          throwAsyncError("Error joinChannel channel " + response.status + " " + response.statusText)
        }
      );
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for 0.5 second
      chatSocket!.emit('createMessage',
        {channelName: channel.name, message: user!.nickname + " has joined."},
        (response:ChatResponse) => {
          if (!response.ok)
          throwAsyncError("Error joinChannel channel " + response.status + " " + response.statusText)
        }
      );
    } catch (error) {
        throwAsyncError(error);
    }
  }

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setPassword(value);
  };

  const handleChannelType = (selectedChannelType: string) => {
    // console.log('ChannelDetails handleChannelType');
    try {
      setDisplayChannelType (false);
      if (selectedChannelType !== channel.type) {
      switch (selectedChannelType) {
        case 'PRIVATE':
          // console.log('Private channel type selected');
          chatSocket!.emit('setAsPrivateChannel',
            { channelName:channel.name },
            (response:ChatResponse) => {
              if (!response.ok)
              throwAsyncError("Error changing channel type " + response.status + " " + response.statusText)
            });
          break;
        case 'PROTECTED':
          // console.log('Protected channel type selected');
          chatSocket!.emit('setAsProtectedChannel',
          { channelName: channel.name, password: password },
          (response: ChatResponse) => {
            if (!response.ok) throwAsyncError("Error changing channel type " + response.status + " " + response.statusText);
          }
        );
          break;
        default://case 'PUBLIC'
          // console.log('Public channel type selected');
          chatSocket!.emit('resetAsPublicChannel',
            { channelName:channel.name },
            (response:ChatResponse) => {
              if (!response.ok)
              throwAsyncError("Error changing channel type " + response.status + " " + response.statusText)
            });
          break;
        }
      } else {
        if (channel.type === 'PROTECTED') {
          chatSocket!.emit('changeChannelPwd',
          { channelName: channel.name, password: password },
          (response: ChatResponse) => {
            if (!response.ok) throwAsyncError("Error changing channel type " + response.status + " " + response.statusText);
          }
        )};
      }
    } catch (error) {
        throwAsyncError(error);
    }
    return true;
  }

  const handleSetAsAdmin = (player:string) => {
    // console.log('ChannelDetails handleSetAsAdmin');
    try {
      setDisplaySetAsAdmin (false);
      chatSocket!.emit('setAsAdmin',
        { player:player, channelName:channel.name },
        (response:ChatResponse) => {
          if (!response.ok)
            throwAsyncError("Error setting player as administrator " + response.status + " " + response.statusText)
        });
    } catch (error) {
      throwAsyncError(error);
    }
    return true;
  }

  const handleBanUser = (player:string) => {
    // console.log('ChannelDetails handleBanUser');
    try {
      setDisplayBan (false);
      chatSocket!.emit('banUser',
        { player:player, channelName:channel.name },
        (response:ChatResponse) => {
          if (!response.ok)
            throwAsyncError("Error setting player as banned " + response.status + " " + response.statusText)
        });
    } catch (error) {
        throwAsyncError(error);
    }
    return true;
  }

  const handleMuteUser = (player:string) => {
    // console.log('ChannelDetails handleMuteUser');
    try {
      setDisplayMute (false);
      chatSocket!.emit('muteUser',
        { player:player, channelName:channel.name, muteDuration:2 },/* muteDuration: minutes*/
        (response:ChatResponse) => {
          if (!response.ok)
            throwAsyncError("Error muting player " + response.status + " " + response.statusText)
        });
    } catch (error) {
        throwAsyncError(error);
    }
    return true;
  }

  const handleKickUser = (player:string) => {
    // console.log('ChannelDetails handleKickUser');
    try {
      setDisplayKick (false);
      chatSocket!.emit('kickUser',
        { player:player, channelName:channel.name },
        (response:ChatResponse) => {
          if (!response.ok)
            throwAsyncError("Error kicking player " + response.status + " " + response.statusText)
        });
    } catch (error) {
        throwAsyncError(error);
    }
    return true;
  }

  const handleUnbanUser = (player:string) => {
    // console.log('ChannelDetails handleUnbanUser');
    try {
      setDisplayUnban (false);
      chatSocket!.emit('unbanUser',
        { player:player, channelName:channel.name },
        (response:ChatResponse) => {
          if (!response.ok)
            throwAsyncError("Error setting player as unbanned " + response.status + " " + response.statusText)
        });
    } catch (error) {
        throwAsyncError(error);
    }
    return true;
  }

  const handleUnsetAsAdmin = (player:string) => {
    // console.log('ChannelDetails handleUnsetAsAdmin');
    try {
      setDisplayUnsetAsAdmin (false);///////////////////////////////////////////////
      chatSocket!.emit('unsetAsAdmin',
        { player:player, channelName:channel.name },
        (response:ChatResponse) => {
          if (!response.ok)
            throwAsyncError("Error unsetting player as administrator " + response.status + " " + response.statusText)
        });
    } catch (error) {
      throwAsyncError(error);
    }
    return true;
  }

  const handleLeaveChannel = () => {
    // console.log('ChannelDetails handleLeaveChannel');
    try {
      chatSocket!.emit('leaveChannel',
        { channelName:channel.name },
        (response:ChatResponse) => {
          if (!response.ok)
            throwAsyncError("Error leaving channel " + response.status + " " + response.statusText)
        });
    } catch (error) {
        throwAsyncError(error);
    }
  }

  const handleDeleteChannel = () => {
    // console.log('ChannelDetails handleDeleteChannel');
    try {
      chatSocket!.emit('deleteChannel',
        { channelName:channel.name },
        (response:ChatResponse) => {
          if (!response.ok)
            throwAsyncError("Error deleting channel " + response.status + " " + response.statusText)
        });
    } catch (error) {
        throwAsyncError(error);
    }
  }

/*
** ********************************************************************************
** UI COMPONENT
** ********************************************************************************
*/
  return (
    <div className="ChannelDetails">
      <div className="ChannelDetails__header">
        <h1 className='ChannelDetails__title'>Channel details for {channelDetails.name}</h1>
        {isOwner &&
          <IoLogOutOutline className="ChannelDetailsIcon" title="Leave and delete channel" onClick={handleDeleteChannel}/>
        }
        {!isOwner && isMember &&
          <IoLogOutOutline className="ChannelDetailsIcon" title="Leave channel"  onClick={handleLeaveChannel}/>
        }
        {canJoin &&
          <IoLogInOutline className="ChannelDetailsIcon" title="Join channel" onClick={handleJoinChannel} />
        }
      </div>
      <div className="ChannelDetailsComps">
        <div className="ChannelInfos">
          <h2 className='channelDetails__h2'>Settings</h2>
          <p className='channelDetails__p'>
            Owner: {channelDetails.owner?.nickname}<br/>
            Type: {channelDetails.type.toLowerCase()}
            {isOwner && (
              <>
                <span className="ChannelTypeChangeIcon" onClick={() => setDisplayChannelType(true)}>
                  <MdCached title="Change Channel Type" className="ChannelDetailsIcon" />
                </span>
                {displayChannelType && (
                  <ChannelTypeDialog
                    display={displayChannelType}
                    setDisplay={setDisplayChannelType}
                    channel={channelDetails}
                    handleRequest={handleChannelType}
                    actionLabel="Change"
                    password={password}
                    handlePasswordChange={handlePasswordChange}
                  />
                )}
              </>
            )}
          </p>
        </div>
        <div className="ChannelAdms">
          <h2 className='channelDetails__h2'>Administrators</h2>
          <p className='channelDetails__p'>
            {channelAdmins.map((admin) => (
              <span key={admin.id}>{admin.nickname}<br/></span>
            ))}
            {user?.nickname === channelDetails.owner?.nickname && adminablePlayers.length !== 0 &&
              <span className="Live__icons" onClick={() => {setDisplaySetAsAdmin(true)}}>
                  <HiUserPlus title="Set a player as administrator" className="ChannelDetailsIcon"/>
              </span>
            }
            {displaySetAsAdmin && <SelectPlayerDialog
              title="Set a player as channel administrator"
              display={displaySetAsAdmin}
              setDisplay={setDisplaySetAsAdmin}
              actionLabel="OK"
              players={adminablePlayers}
              handleRequest={handleSetAsAdmin} ></SelectPlayerDialog>
            }
            {user?.nickname === channelDetails.owner?.nickname && unadminablePlayers.length !== 0 &&
              <span className="Live__icons" onClick={() => {setDisplayUnsetAsAdmin(true)}}>
                  <HiUserMinus title="Unset a player as administrator" className="ChannelDetailsIcon"/>
              </span>
            }
            {displayUnsetAsAdmin && <SelectPlayerDialog
              title="Unset a player as channel administrator"
              display={displayUnsetAsAdmin}
              setDisplay={setDisplayUnsetAsAdmin}
              actionLabel="OK"
              players={unadminablePlayers}
              handleRequest={handleUnsetAsAdmin} ></SelectPlayerDialog>
            }
          </p>
        </div>
        <div className="ChannelMembers">
          <h2 className='channelDetails__h2'>Members</h2>
            <p className='channelDetails__p'>
              {channelMembers.map((member) => (
                <span key={member.id}>{member.nickname}<br/></span>
              ))}
              {isAdmin && kickablePlayers.length !== 0 &&
                <span className="Live__icons" onClick={() => {setDisplayKick(true)}}>
                  <HiUserMinus title="Kick a player" className="ChannelDetailsIcon"/>
                </span>
              }
              {displayKick && <SelectPlayerDialog
                title="Kick a player"
                display={displayKick}
                setDisplay={setDisplayKick}
                actionLabel="OK"
                players={kickablePlayers}
                handleRequest={handleKickUser} ></SelectPlayerDialog>}
            </p>
        </div>
        <div className="ChannelBans">
          <h2 className='channelDetails__h2'>Banned</h2>
          <p className='channelDetails__p'>
            {channelBanned.length === 0 && <span>-<br/></span> }
            {channelBanned.length !== 0 && channelBanned.map((banned) => (
              <span key={banned.id}>{banned.nickname}<br/></span>
            ))}
            {isAdmin && bannablePlayers.length !== 0 &&
              <span className="Live__icons" onClick={() => {setDisplayBan(true)}}>
                <HiUserPlus title="Ban a player" className="ChannelDetailsIcon"/>
              </span>
            }
            {displayBan && <SelectPlayerDialog
              title="Ban a player"
              display={displayBan}
              setDisplay={setDisplayBan}
              actionLabel="OK"
              players={bannablePlayers}
              handleRequest={handleBanUser} ></SelectPlayerDialog>}

            {isAdmin && unbannablePlayers.length !== 0 &&
              <span className="Live__icons" onClick={() => {setDisplayUnban(true)}}>
                <HiUserMinus title="Unban a player" className="ChannelDetailsIcon"/>
              </span>
            }
            {displayUnban && <SelectPlayerDialog
                title="Unban a player"
                display={displayUnban}
                setDisplay={setDisplayUnban}
                actionLabel="OK"
                players={unbannablePlayers}
                handleRequest={handleUnbanUser} ></SelectPlayerDialog>}

          </p>
        </div>
        <div className="ChannelMuted">
          <h2 className='channelDetails__h2'>Muted</h2>
          <p className='channelDetails__p'>
            {channelMuted.length === 0 && <span>-<br/></span> }
            {channelMuted.length !== 0 && channelMuted.map((muted) => (
              <span key={muted.id}>{muted.nickname}<br/></span>
            ))}
            {isAdmin && mutablePlayers.length !== 0 &&
              <span className="Live__icons" onClick={() => {setDisplayMute(true)}}>
                <HiUserPlus title="Mute a player" className="ChannelDetailsIcon"/>
              </span>
            }
            {displayMute && <SelectPlayerDialog
              title="Mute a player"
              display={displayMute}
              setDisplay={setDisplayMute}
              actionLabel="OK"
              players={mutablePlayers}
              handleRequest={handleMuteUser} ></SelectPlayerDialog>}
          </p>
        </div>
        <div className="ChannelInvites">
          <h2 className='channelDetails__h2'>Invited players</h2>
          <p className='channelDetails__p'>
            {channelInvited.length === 0 && <span>-<br/></span> }
            {channelInvited.length !== 0 && channelInvited.map((invited) => (
              <span key={invited.id}>{invited.nickname}<br/></span>
            ))}
            {isAdmin && invitablePlayers.length !== 0 &&
              <span className="Live__icons" onClick={() => {setDisplayInvite(true)}}>
                <HiUserPlus title="Invite a player" className="ChannelDetailsIcon"/>
              </span>
            }
            {displayInvite && <SelectPlayerDialog
              title="Send an invitation to join"
              display={displayInvite}
              setDisplay={setDisplayInvite}
              actionLabel="Send"
              players={invitablePlayers}
              handleRequest={handleInviteRequest} ></SelectPlayerDialog>}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChannelDetailsPublic;
