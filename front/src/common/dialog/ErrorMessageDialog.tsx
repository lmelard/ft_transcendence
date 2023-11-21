/* 
** ********************************************************************************
** IMPORTS
** ********************************************************************************
*/
import {  Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

interface Props {
	displayErrorMessageDialog: boolean;
	setDisplayErrorMessageDialog: React.Dispatch<React.SetStateAction<boolean>>;
	errorMessage: string;
}

export default function ErrorMessageDialog({ 
	displayErrorMessageDialog,
	setDisplayErrorMessageDialog,
	errorMessage,
}: Props) {

/* 
** ********************************************************************************
** EVENT LISTENERS
** ********************************************************************************
*/  
	const handleOK = () => {
		setDisplayErrorMessageDialog(false);
	};

/* 
** ********************************************************************************
** UI COMPONENT
** ********************************************************************************
*/
	return (
		<Dialog open={displayErrorMessageDialog}>
			<DialogTitle>Crazzy Pong says: oups...</DialogTitle>
			<DialogContent>
				<DialogContentText>{errorMessage}</DialogContentText>
				<DialogActions>
					<Button onClick={handleOK}>OK</Button>
				</DialogActions>
			</DialogContent>
			</Dialog>
	);
}
