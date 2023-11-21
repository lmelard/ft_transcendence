/*
** ********************************************************************************
** IMPORTS
** ********************************************************************************
*/
import './ChannelDetails.css';
import './Chat.css';
import { Channel } from '../../model/Channel';
import { User } from '../../model/User';

interface Props {
  channel: Channel;
  channelAdmins: User[];
  channelMembers: User[];
  channelInvited: User[];
}

function ChannelDetailsDM({channel, channelMembers, channelInvited}:Props) {
  // console.log("Debut fonction ChannelDetails:", channel.name);

/*
** ********************************************************************************
** UI COMPONENT
** ********************************************************************************
*/
  return (
    <div className="ChannelDetails">
      <h1 className='ChannelDetails__title'>DM with {channel.label}</h1>
      <div className="ChannelDetailsComps">
        <div className="ChannelMembers">
          <h2 className='channelDetails__h2'>Members</h2>
            <p className='channelDetails__p'>
              {channelMembers.map((member) => (
                <span key={member.id}>{member.nickname}<br/></span>
              ))}
            </p>
        </div>
        {channelInvited.length !== 0 && <div className="ChannelInvites">
          <h2 className='channelDetails__h2'>Invited players</h2>
          <p className='channelDetails__p'>
            {channelInvited.map((invited) => (
              <span key={invited.id}>{invited.nickname}<br/></span>
            ))}
          </p>
        </div>}
      </div>
    </div>
  );
}

export default ChannelDetailsDM;
