import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { Box, DialogContentText, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { useState } from 'react';
import { User } from '../../model/User';

interface Props {
  title:string;
  actionLabel:string;
  display: boolean;
  setDisplay: React.Dispatch<React.SetStateAction<boolean>>;
  players: User[];
  handleRequest: (selectedPlayer:string)=> void;
}

export default function SelectPlayerDialog({title, display, setDisplay, players, handleRequest, actionLabel}: Props) {
  const [player, setPlayer] = useState('');
  const [enableValidate, setEnableValidate] = useState(false);

  const handleCancel = () => {
    setDisplay(false);
  };

  const handleChange = (event: SelectChangeEvent) => {
    setPlayer(event.target.value as string);
    setEnableValidate(true);
  };

  return (
    <Dialog open={display}>
      <DialogTitle>{title}</DialogTitle>
        { players.length !== 0 ? (  /* check if there is other players */
        <DialogContent>
          <Box sx={{ minWidth: 120 }}>
            <FormControl fullWidth>
              <InputLabel id="players-select-label">Select a player</InputLabel>
              <Select
                labelId="players-select-label"
                id="players-select"
                value={player}
                onChange={handleChange}
                placeholder='Select a player'
              >
              {players.map((playerMenuItem) => (
                <MenuItem  key={playerMenuItem.id} value={playerMenuItem.nickname}>
                  {playerMenuItem.nickname}
                </MenuItem>
              ))}
              </Select>
            </FormControl>
          </Box>
          <DialogActions>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button onClick={() => handleRequest(player)} disabled={!enableValidate} >{actionLabel}</Button> 
          </DialogActions>
        </DialogContent>
        ) : (                       /* if not, display message */
        <DialogContent>
          <DialogContentText>
            Sorry, no eligible Crazzy Pong players for the moment: <br/>
            please try again in a few moment...
          </DialogContentText>
          <DialogActions>
            <Button onClick={handleCancel}>OK</Button>
          </DialogActions>
        </DialogContent>
        )}
    </Dialog>
  );
}
