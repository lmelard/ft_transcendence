/*
** ********************************************************************************
** IMPORTS
** ********************************************************************************
*/
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl } from "@mui/material";
import { Channel } from "../../model/Channel";
import { useContext, useRef, useState } from "react";
import { useThrowAsyncError } from "../../utils/useThrowAsyncError";
import { UserContext } from "../../App";
import { ChatResponse } from "../../model/ChatResponse";
import ErrorMessageDialog from "../../common/dialog/ErrorMessageDialog";


interface Props {
	displayChatPassword: boolean;
	setDisplayChatPassword: React.Dispatch<React.SetStateAction<boolean>>;
	channel: Channel;
}

export default function ChatPasswordDialog({
	displayChatPassword,
	setDisplayChatPassword,
	channel,
}: Props) {
/*
** ********************************************************************************
** VARIABLES
** ********************************************************************************
*/
	console.log('ChatPasswordDialog');
	const {user, chatSocket}     						= useContext(UserContext);
	const throwAsyncError                               = useThrowAsyncError();
	const [password, setPassword]						= useState('');
	const [errorPwdMsg, setErrorPwdMsg]               	= useState("");
	const [displayErrorPwdMsgDialog, setDisplayErrorPwdMsgDialog] = useState(false);

/*
** ********************************************************************************
** EVENT LISTENERS
** ********************************************************************************
*/
	const handleCancel = () => {
		setDisplayChatPassword(false);
	};

	const pwdRef = useRef<HTMLInputElement>(null); // Ref pour le pwd
	const handlePasswordSubmit = (event: React.FormEvent) => {
	  console.log("Debut fonction handlePasswordSubmit for user", user);
	  event.preventDefault();
	  try {
		  const password = pwdRef.current?.value;
		  console.log('password content', password);
		  chatSocket!.emit('joinChannel',
		    { channelName: channel.name, password: password},
			(response:ChatResponse) => {
			  if (!response.ok) {
				console.log("Error joinChannel channel " + response.status + " " + response.statusText);
				if (response.status === 401) {
					console.log('/////// Password Message Error', response.statusText)
					setErrorPwdMsg(response.statusText);
					setDisplayErrorPwdMsgDialog(true);
				} else
				  throwAsyncError("Error joinChannel channel " + response.status + " " + response.statusText)
			  }
			})
	  } catch (error) {
		  throwAsyncError(error);
	  }
	}

/*
** ********************************************************************************
** FUNCTIONS
** ********************************************************************************
*/

	function isPasswordEmpty(){
		return  password.length === 0
  	}

	function updatePassword(){
		if (pwdRef.current){
			const value = pwdRef.current?.value;
			setPassword(value);
		}
	}


/*
** ********************************************************************************
** UI COMPONENT
** ********************************************************************************
*/
	return (
		<>
		<Dialog open={displayChatPassword}>
			  <DialogTitle>Enter channel password</DialogTitle>
				<DialogContent>
				  <Box sx={{ minWidth: 120 }}>
					<FormControl fullWidth>
						<input
							id ="password"
							ref={pwdRef}
							type="password"
							placeholder="Enter password"
							onChange={updatePassword}
						/>
					</FormControl>
				  </Box>
				  <DialogActions>
					<Button onClick={handleCancel}>Cancel</Button>
					<Button onClick={handlePasswordSubmit} disabled={isPasswordEmpty()}>OK</Button>
				  </DialogActions>
				</DialogContent>
			</Dialog>
		{displayErrorPwdMsgDialog &&
		<ErrorMessageDialog
			displayErrorMessageDialog={displayErrorPwdMsgDialog}
			setDisplayErrorMessageDialog={setDisplayErrorPwdMsgDialog}
			errorMessage={errorPwdMsg}
		/>
		}
		</>
	);
}
