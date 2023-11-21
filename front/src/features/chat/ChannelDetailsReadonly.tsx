/* 
** ********************************************************************************
** IMPORTS
** ********************************************************************************
*/
import './ChannelDetails.css';
import './Chat.css';
import { Channel } from '../../model/Channel';
import { User } from '../../model/User';
import { useEffect, useState } from 'react';
import { useThrowAsyncError } from '../../utils/useThrowAsyncError';
import { fetchSelectedChannel } from './fetchData';

interface Props {
  channel: Channel;
  channelAdmins: User[];
  channelMembers: User[];
  channelInvited: User[];
  channelBanned: User[];
  channelMuted: User[];
}

function ChannelDetailsReadonly({channel, channelAdmins, channelMembers, channelInvited, channelBanned, channelMuted}:Props) {
/* 
** ********************************************************************************
** VARIABLES
** ********************************************************************************
*/  
  //console.log("Debut fonction ChannelDetailsReadonly:", channel.name);
  const throwAsyncError                           = useThrowAsyncError();
  const [channelDetails, setChannelDetails]       = useState<Channel>(channel);

/* 
** ********************************************************************************
** USE EFFECTS
** ********************************************************************************
*/  

  useEffect (() => {
    try {
      fetchSelectedChannel(channel.id)
        .then(channelDB => setChannelDetails(channelDB))
        .catch(error => throwAsyncError(error));
    } catch (error) {
      throwAsyncError(error);
    }
  }, [channel, channelAdmins, channelMembers, channelInvited]);

/* 
** ********************************************************************************
** UI COMPONENT
** ********************************************************************************
*/
  return (
    <div className="ChannelDetails">
      <div className="ChannelDetails__header">
        <h1 className='ChannelDetails__title'>Channel details for {channelDetails.name}</h1>
      </div>
      <div className="ChannelDetailsComps">
        <div className="ChannelInfos">
          <h2 className='channelDetails__h2'>Settings</h2>
          <p className='channelDetails__p'>
            Owner: {channelDetails.owner?.nickname}<br/>
            Type: {channelDetails.type.toLowerCase()}
          </p>
        </div>
        <div className="ChannelAdms">
          <h2 className='channelDetails__h2'>Administrators</h2>
          <p className='channelDetails__p'>
            {channelAdmins.map((admin) => (
              <span key={admin.id}>{admin.nickname}<br/></span>
            ))}
          </p>
        </div>
        <div className="ChannelMembers">
          <h2 className='channelDetails__h2'>Members</h2>
            <p className='channelDetails__p'>
              {channelMembers.map((member) => (
                <span key={member.id}>{member.nickname}<br/></span>
              ))}
            </p>
        </div>
        <div className="ChannelBans">
          <h2 className='channelDetails__h2'>Banned</h2>
          <p className='channelDetails__p'>
            {channelBanned.length === 0 && <span>-<br/></span> }
            {channelBanned.length !== 0 && channelBanned.map((banned) => (
              <span key={banned.id}>{banned.nickname}<br/></span>
            ))}
          </p>
        </div>
        <div className="ChannelMuted">
          <h2 className='channelDetails__h2'>Muted</h2>
          <p className='channelDetails__p'>
            {channelMuted.length === 0 && <span>-<br/></span> }
            {channelMuted.length !== 0 && channelMuted.map((muted) => (
              <span key={muted.id}>{muted.nickname}<br/></span>
            ))}
          </p>
        </div>
        <div className="ChannelInvites">
          <h2 className='channelDetails__h2'>Invited players</h2>
          <p className='channelDetails__p'>
            {channelInvited.length === 0 && <span>-<br/></span> }
            {channelInvited.length !== 0 && channelInvited.map((invited) => (
              <span key={invited.id}>{invited.nickname}<br/></span>
            ))}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChannelDetailsReadonly;
