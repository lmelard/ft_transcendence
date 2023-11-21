import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import React, { useState } from 'react';
import { Channel } from '../../model/Channel'

interface Props {
  actionLabel: string;
  display: boolean;
  setDisplay: React.Dispatch<React.SetStateAction<boolean>>;
  channel: Channel;
  // handleRequest: (selectedChannelType: string) => void;
  handleRequest: (selectedChannelType: string, password?: string) => void;
  password: string;
  handlePasswordChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ChannelTypeDialog({ 
  display, 
  setDisplay, 
  channel, 
  handleRequest, 
  actionLabel, 
  password, 
  handlePasswordChange 
}: Props) {
  const [channelType, setChannelType] = useState(channel.type);

  const handleCancel = () => {
    setDisplay(false);
  };

  const isButtonDisabled = () => {
    if (!channelType
      || channelType !== 'PROTECTED' && channelType === channel.type
      || channelType === 'PROTECTED' && !password) {
      return true;
    }
    return false;
  };

  const handleChange = (event: SelectChangeEvent) => {
    setChannelType(event.target.value as string);
  };

  return (
    <Dialog open={display}>
    <DialogTitle>Change the channel type</DialogTitle>
    <DialogContent>
      <Box sx={{ minWidth: 120 }}>
        <FormControl fullWidth>
          <InputLabel id="channel-types-select-label">Select a channel type</InputLabel>
          <Select
            labelId="channel-types-select-label"
            id="channel-types-select"
            value={channelType}
            onChange={handleChange}
            placeholder="Select a channel type"
          >
              <MenuItem value='PUBLIC'>Public</MenuItem>
              <MenuItem value='PRIVATE'>Private</MenuItem>
              <MenuItem value='PROTECTED'>Protected</MenuItem>
            </Select>
          </FormControl>
        <Divider />
          {channelType === 'PROTECTED' && (
            <TextField 
              label="Password" 
              type="password" 
              value={password} 
              onChange={handlePasswordChange} 
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
      <Button onClick={handleCancel}>Cancel</Button>
      <Button disabled={isButtonDisabled()} onClick={() => handleRequest(channelType, password)}>
        {actionLabel}
      </Button>
      </DialogActions>
    </Dialog>
  );
}
