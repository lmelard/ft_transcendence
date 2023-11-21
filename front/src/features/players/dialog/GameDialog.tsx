import { FC, useContext } from "react";
import { GameMdl } from "../../../model/GameMdl";
import { Avatar, Button, Dialog, DialogActions, Box, DialogTitle, styled, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { UserContext } from "../../../App";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

interface GameDialogProps {
  games: GameMdl[];
  onClose: () => void;
}

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  // ... (existing styles)
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  '& > *': {
    padding: theme.spacing(0, 4),
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(7),
  height: theme.spacing(7),
  margin: theme.spacing(2, 1),
}));

const StyledScoreBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexGrow: 1,
  justifyContent: "space-around",
  alignItems: "center",
  padding: theme.spacing(1),
}));

const GameDialog: FC<GameDialogProps> = ({ games, onClose }) => {


  const { user } = useContext(UserContext);

  const matchRows = games.map((game) => {
    const winner = game.scoreR > game.scoreL ? game?.players[0].nickname : game?.players[1].nickname;
    const isWinner = winner === user?.nickname;
    const isWinnerPlayerOne = game.scoreR > game.scoreL;
    return (
      <StyledTableRow key={game.id}>
        <TableCell>
        <StyledAvatar src={game?.players[0].imageUrl} />
        </TableCell>
        <TableCell>
        <Typography variant="body2">{game?.players[0].nickname}</Typography>
        </TableCell>
        <TableCell>
        {isWinnerPlayerOne && <EmojiEventsIcon sx={{ color: "gold", ml: 2 }} />}
        </TableCell>
        <TableCell>
        <StyledScoreBox>
          <Typography variant="body2" sx={{ fontWeight: isWinner ? "bold" : "normal", color: isWinner ? "success.main" : "text.primary" }}>
            {game.scoreR} - {game.scoreL}
          </Typography>
        </StyledScoreBox>
        </TableCell>
        <TableCell>
        {!isWinnerPlayerOne && <EmojiEventsIcon sx={{ color: "gold", mr: 2 }} />}
        </TableCell>
        <TableCell>
        <Typography variant="body2">{game?.players[1].nickname}</Typography>
        </TableCell>
        <TableCell>
        <StyledAvatar src={game?.players[1].imageUrl} />
        </TableCell>
      </StyledTableRow>
    );
  });


  return (
    <Dialog open={true} onClose={onClose}>
      <DialogTitle style={{ textAlign: 'center' }}>Game Information</DialogTitle>
      <TableContainer sx={{ overflow: "auto", marginTop: 3.5, marginBottom: 3.5 }}>
        <Table sx={{ minWidth: 500 }} aria-label="customized table">
          <TableHead>
            <TableRow sx={{ alignItems: 'center' }}>
              <TableCell colSpan={3} sx={{ borderBottom: "none" }}>
                <Typography variant="subtitle1" color="textSecondary" sx={{ mx: 3 }}>
                  Game History
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{matchRows}</TableBody>
        </Table>
      </TableContainer>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GameDialog;