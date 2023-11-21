/* 
** ********************************************************************************
** IMPORTS
** ********************************************************************************
*/
import './Live.css';
import './Chat.css';
import { useState } from 'react';
import { Channel } from '../../model/Channel';
import ChatPasswordDialog from './ChatPasswordDialog';
import { AiTwotoneLock } from "react-icons/ai";

interface Props {
  channel: Channel;
}

function LiveRestrictedArea({channel}:Props) {
/* 
** ********************************************************************************
** VARIABLES
** ********************************************************************************
*/
  //console.log("Debut fonction Live:", channel.name);
	const [displayChatPassword, setDisplayChatPassword] = useState(false);

/* 
** ********************************************************************************
** UI COMPONENT
** ********************************************************************************
*/
  return (
    <div className='Live'>
      <div className='Messages'>
        <span>
          You are invited to join this channel
          <AiTwotoneLock
            title="Accept"
            className="Live__invitIcons"
            onClick={() => setDisplayChatPassword(true)}
          />
        </span>
        {displayChatPassword &&
          <ChatPasswordDialog
            displayChatPassword={displayChatPassword}
            setDisplayChatPassword={setDisplayChatPassword}
            channel={channel}
          />
        }
      </div>
    </div>
  );
}

export default LiveRestrictedArea;
