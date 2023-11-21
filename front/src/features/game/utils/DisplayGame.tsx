import React from "react";
import { Typography, Box, Button, Container } from "@mui/material";
import "./DisplayGame.css";

interface IEndGameProps {
  playerName: string;
  handleJoinGame: () => void;
}

const GameMessage: React.FC<{ player: string; message: string; subMessage: string; handleJoinGame: () => void }> = ({
  player,
  message,
  subMessage,
  handleJoinGame,
}) => (
  <Container maxWidth="sm">
    <Box textAlign="center" p={4}>
      <Typography variant="h4" gutterBottom>
        {message}
      </Typography>
      <Typography variant="h5" gutterBottom>
        {player}
      </Typography>
      <Typography variant="subtitle1">{subMessage}</Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={handleJoinGame}
        style={{
          marginTop: "20px",
        }}
      >
        Join Game
      </Button>
    </Box>
  </Container>
);

const EndGame: React.FC<IEndGameProps> = ({ playerName, handleJoinGame }) => (
  <GameMessage
    player={playerName}
    message="Congratulations 🏆"
    subMessage="Do you want to play another game? Press P to start. W/S to move on the left side and UP/DOWN arrow on the right side of the screen. Special power for Expert by pressing B"
    handleJoinGame={handleJoinGame}
  />
);

const StartGame: React.FC<IEndGameProps> = ({ playerName, handleJoinGame }) => (
  <GameMessage
    player={playerName}
    message="Welcome to the Game 🚀"
    subMessage="Choose your game mode to start playing. Press P to start. W/S to move on the left side and UP/DOWN arrow on the right side of the screen. Special power for Expert by pressing B"
    handleJoinGame={handleJoinGame}
  />
);

// You would only export one default from a module. If these components are in the same file,
// remove the 'export default' from the two that are not being exported, or place them in separate files.
export { EndGame, StartGame, GameMessage };
