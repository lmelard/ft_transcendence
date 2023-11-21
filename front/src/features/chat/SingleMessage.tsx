/* 
** ********************************************************************************
** IMPORTS
** ********************************************************************************
*/
import './Live.css';
import './Chat.css';
import { Message } from '../../model/Message';

interface Props {
  message: Message;
}

function SingleMessage({ message}:Props) {
/* 
** ********************************************************************************
** VARIABLES
** ********************************************************************************
*/
  //console.log("Debut fonction SingleMessage:", message);
  const msgDate             = new Date(message.createAt);

/* 
** ********************************************************************************
** UI COMPONENT
** ********************************************************************************
*/
  return (
    <div className="SingleMessage">
      <div className="SingleMessage__left">
        <img className="avatar_img" src={message.avatar} alt="" />
      </div>
      <div className="SingleMessage__right">
        <span className="SingleMessage__author">{message.author}</span>
        <span className="SingleMessage__date"> at {msgDate.toDateString()} {msgDate.toLocaleTimeString()}</span><br/>
        {message.text}
      </div>
    </div>
  )
}

export default SingleMessage;
