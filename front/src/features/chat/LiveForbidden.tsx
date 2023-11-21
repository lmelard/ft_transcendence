/* 
** ********************************************************************************
** IMPORTS
** ********************************************************************************
*/
import './Live.css';
import './Chat.css';

function LiveForbidden() {

/* 
** ********************************************************************************
** UI COMPONENT
** ********************************************************************************
*/
  return (
    <div className='Live'>
      <div className='Messages'>
        ⛔ You are not allowed to access this channel
      </div>
    </div>
  );
}

export default LiveForbidden;
