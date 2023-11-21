/* 
** ********************************************************************************
** IMPORTS
** ********************************************************************************
*/
import './Chat.css';
import { Channel } from '../../model/Channel';
import { HiOutlineUsers, HiOutlineUserGroup, HiOutlineLockClosed, HiOutlineEyeSlash } from "react-icons/hi2";

interface Props {
  channel: Channel;
  isSelected:boolean;
  hasUnreadMessage:boolean;
  handleSelectedChannel: (channelDetails: Channel)=>{};
}

function SingleChannel({ channel, isSelected, hasUnreadMessage, handleSelectedChannel}:Props) {
/* 
** ********************************************************************************
** VARIABLES
** ********************************************************************************
*/
  //console.log("Debut fonction SingleChannel:", channel.name);
  const channelIconTypes: Record<string, JSX.Element> = {
    "PUBLIC": <HiOutlineUserGroup className="channelListItem__icon"/>,
    "DM": <HiOutlineUsers className="channelListItem__icon"/>,       
    "PROTECTED": <HiOutlineLockClosed className="channelListItem__icon"/>,
    "PRIVATE": <HiOutlineEyeSlash className="channelListItem__icon"/>,
  }
  
/* 
** ********************************************************************************
** UI COMPONENT
** ********************************************************************************
*/
  return (
    <div className={isSelected ? "channelListItem__selected" : "channelListItem__normal"}
          onClick={() => handleSelectedChannel(channel)}>
      {channelIconTypes[channel.type]}
      {channel.type === 'DM' ? " " + channel.label : " " + channel.name}
      {hasUnreadMessage && <span> ✨</span>}
    </div>
  )
}

export default SingleChannel;
