import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../App";
import {
  Avatar,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Container,
  Typography,
  TableCell,
  styled,
  Box,
  Grid,
  Button,
} from "@mui/material";
import SettingsDialog from "../header/dialogs/SettingsDialog";
import { GameMdl } from "../../model/GameMdl";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import { UserDetails } from "../../model/UserDetails";

const StyledTableHeadCell = styled(TableCell)(() => ({
  backgroundColor: '#366873', // Couleur de fond de l'en-tête
  color: 'white', // Couleur du texte
  
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%', // Make sure it takes the full height of the cell
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  '& > *': {
    padding: theme.spacing(0, 4),
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
  },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(7),
  height: theme.spacing(7),
  // margin: theme.spacing(2, 1),
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  width: '16.66%', // Equal width for each cell
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(1), // Adjust padding as needed
  textAlign: 'center',
  border: 'none',

}));

const StyledScoreBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexGrow: 1,
  justifyContent: "space-around",
  alignItems: "center",
  padding: theme.spacing(1),
}));


const createData = (game: GameMdl) => {
  if (game && game.players && game.players.length === 2) {
    const winnerNickname = game.winnerId === game?.players[0].id ? game?.players[0].nickname : game?.players[1].nickname;
    const winner = winnerNickname === game?.players[0].nickname ? game?.players[0] : game?.players[1];
    const loser = winner.nickname === game?.players[0].nickname ? game?.players[1] : game?.players[0];
    const score = game.scoreR < game.scoreL ? game.scoreR + " - " + game.scoreL : game.scoreL + " - " + game.scoreR;

    return {
      winner: winnerNickname,
      avatarLoser: loser.imageUrl,
      avatarWinner: winner.imageUrl,
      nameLoser: loser.fullName,
      nameWinner: winner.nickname,
      score: score,
    };
  } else {
    return null;
  }
};

function Profile() {
  // console.log("debut Profile");
  const { user, chatSocket, friendsList } = useContext(UserContext);
  const [openSettings, setOpenSettings] = useState<boolean>(false);
  const [selectedGames, setSelectedGames] = useState<GameMdl[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [displayEditProfile, setDisplayEditProfile] = useState<boolean>(false);
  const { userId } = useParams();

  const location = useLocation();

  useEffect(() => {
    // console.log("LAAAAAAAAAAAAAAaa");
    if (userId) {
      chatSocket?.emit("getUserInfo", { userInfo: userId });
      setDisplayEditProfile(false);
    } else {
      chatSocket?.emit("getUserInfo", { userInfo: user!.id });
      setDisplayEditProfile(true);
    }
    chatSocket?.on("getUserInfo", onGetUserInfo);
  }, [location]);

  function onGetUserInfo(data: any) {
    // console.log("data user info", data.userinfo);
    // console.log("data game info", data.gamesInfo);
    if (data.gamesInfo) {
      // console.log("enter if");
      setSelectedGames(data.gamesInfo);
    } else {
      // console.log("enterelse");
      setSelectedGames([]);
    }
    setSelectedUser(data.userinfo);
    // console.log("userSlected", selectedUser);
    // console.log("selectedgames", selectedGames);
  }

  // chaque fois que users change, le composant sera rendu à nouveau et leaderboardRows sera recalculé
  const rows = selectedGames.map((selectedGame) => createData(selectedGame));

  const matchRows = selectedGames.map((game, index) => {
    const winnerNickname = game.winnerId === game?.players[0].id ? game?.players[0].nickname : game?.players[1].nickname;
    const winner = winnerNickname === game?.players[0].nickname ? game?.players[0] : game?.players[1];
    const loser = winner.nickname === game?.players[0].nickname ? game?.players[1] : game?.players[0];
    const score = game.scoreR < game.scoreL ? game.scoreR + " - " + game.scoreL : game.scoreL + " - " + game.scoreR;
    return (
      <StyledTableRow key={game.id}>
        <TableCell sx={{border: 'none'}}>
          #{index + 1} {/* Display the game index, adding 1 because index starts at 0 */}
        </TableCell>
        <StyledTableCell>
             <StyledAvatar src={loser.imageUrl} />
        </StyledTableCell>
        <StyledTableCell>
          <Typography variant="body2">{loser.nickname}</Typography>
        </StyledTableCell>
        <StyledTableCell>
        <StyledScoreBox>
          <Typography variant="body2" >
            {score}
          </Typography>
        </StyledScoreBox>
        </StyledTableCell>
        <StyledTableCell>
          <EmojiEventsIcon sx={{ color: "gold", mr: 0.5 }} />
         <Typography variant="body2">{winner.nickname}</Typography>
        </StyledTableCell>
        <StyledTableCell >
          <StyledAvatar src={winner.imageUrl} />
        </StyledTableCell>
      </StyledTableRow>
    );
  });

  function getNumberOfGames() {
    let gamesNbr: number = 0;
    if (matchRows) {
      gamesNbr = matchRows.length;
    }
    return gamesNbr;
  }

  function getNumberOfVictories() {
    let victories: number = 0;
    if (rows && selectedUser) {
      rows.forEach((row) => {
        if (row!.winner === selectedUser.nickname) {
          victories++;
        }
      });
    }
    return victories;
  }

  function getNumberOfFriends() {
    let friendsNbr: number = 0;
    if (friendsList) {
      friendsNbr = friendsList.length;
    }
    return friendsNbr;
  }

  return (
    // <ThemeProvider theme={theme}>
    <Paper
    elevation={3} // Mettez elevation à 0 pour supprimer l'ombre par défaut
    sx={{
      marginTop: 2,
      marginBottom: 2,
      marginLeft: 2,
      overflowY: "auto",
      overflowX: "auto",
      borderRadius: 1,
      height: "calc(100vh - 120px)",
      bgcolor: 'background.default',
      display: 'flex',
      flexDirection: 'column',
      // boxShadow: 'none', // Supprime l'ombre
      border: `1px solid #366873` // Ajoute une bordure de couleur #366873
    }}
    >
      <Container className="Leaderboard" component="main" maxWidth={false}>
      <Typography className="PlayerList__title" sx={{color:'#015958', fontWeight:'bold', fontSize: '13px'}}>
          Profile
        </Typography>
        <Container component="main" maxWidth="xs">
          {" "}
          {/* Max width for small devices */}
          <Box
            sx={{
              my: 4, // Margin for the Y-axis
              mx: 2, // Margin for the X-axis
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Avatar
              sx={{ mb: 2, width: 100, height: 100, '&:after': {border: `4px solid ` }}} // Larger avatar size
              alt="User Avatar"
              src={selectedUser?.imageUrl}
              
            />
            <Typography variant="h5" component="h1">
              {selectedUser?.fullName}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" sx={{color: 'black'}}>
              {selectedUser?.nickname} | {selectedUser?.email}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{color: 'black'}}>
              Created on {selectedUser?.createAt ? new Date(selectedUser?.createAt).toLocaleDateString() : "unknown"}
            </Typography>
            <Grid container spacing={2} sx={{ width: "100%", mt: 1 }}>
              <Grid item xs={12}>
                {displayEditProfile && <Button onClick={() => setOpenSettings(true)} variant="outlined" fullWidth
                sx={{
                  mt: 1,
                  color: '#366873', // texte blanc
                  borderColor: '#366873', // couleur de bordure personnalisée
                  backgroundColor: 'transparent', // fond transparent
                  '&:hover': {
                    borderColor: '#2d5559', // couleur de bordure au survol
                    backgroundColor: '#366873', // couleur de fond au survol
                  },
                }}
                >
                  Edit Profile
                </Button>}
                {openSettings && <SettingsDialog display={openSettings} setDisplay={setOpenSettings}></SettingsDialog>}
              </Grid>
            </Grid>
            <Box display="flex" justifyContent="space-around" width="100%" my={2}>
              <Typography variant="body2">
                <b>{getNumberOfGames()}</b> Games played
              </Typography>
              <Typography variant="body2">
                <b>{getNumberOfVictories()}</b> Victories
              </Typography>
              <Typography variant="body2">
                <b>{getNumberOfFriends()}</b> Friends
              </Typography>
              {user?.expert && (
                <Typography variant="body2">
                  <MilitaryTechIcon style={{ color: "gold" }}></MilitaryTechIcon>Expert
                </Typography>
              )}
            </Box>
          </Box>
        </Container>
        <TableContainer component={Paper} sx={{ overflow: "auto", marginTop: 3.5, marginBottom: 3.5 }}>
          <Table sx={{ minWidth: 500 }} aria-label="customized table">
            <TableHead>
              <TableRow>
                <StyledTableHeadCell colSpan={6}>
                  {" "}
                  {/* Assurez-vous que colSpan correspond au nombre total de colonnes de votre tableau */}
                  <Typography variant="subtitle1"sx={{ mx: 3 }}>
                    Game History
                  </Typography>
                </StyledTableHeadCell>
              </TableRow>
            </TableHead>
            {/* <TableBody>{matchRows}</TableBody> */}
            <TableBody>
              {selectedGames && selectedGames.length > 0 ? (
                matchRows
              ) : (
                <StyledTableRow>
                  <TableCell colSpan={7}>
                    <Typography variant="body2" sx={{ my: 3.5 }}>
                      No Game for now !
                    </Typography>
                  </TableCell>
                </StyledTableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Paper>
    // </ThemeProvider>
  );
}

export default Profile;
