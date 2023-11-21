import { useEffect, useState } from "react";
import { Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, styled, Container, Typography } from "@mui/material";
import { tableCellClasses } from "@mui/material/TableCell";
import { UserDetails } from "../../model/UserDetails";
import baseURL, { frontURL } from "../../utils/baseURL";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import "./Leaderboard.css";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: '#366873', // Votre couleur personnalisée
    color: theme.palette.common.white, // Couleur du texte
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

const createData = (user: UserDetails, rank: number) => {
  const percentageRatio = parseFloat((user.winRatio * 100).toFixed(2));
  return {
    avatar: user.imageUrl,
    rank,
    name: user.fullName,
    nickname: user.nickname,
    wins: user.winCount,
    losses: user.lossCount,
    ratio: percentageRatio,
  };
};

function Leaderboard() {
  const [users, setUsers] = useState<UserDetails[]>([]);
  const [usersWithoutFinishedGames, setUsersWithoutFinishedGames] = useState<UserDetails[]>([]);

  function getAvatarStyle(rank: number) {
    switch (rank) {
      case 1:
        return { border: "2px solid gold" };
      case 2:
        return { border: "2px solid silver" };
      case 3:
        return { border: "2px solid #cd7f32" };
      default:
        return {};
    }
  }

  async function getAllUsersFromBack() {
    await fetch(baseURL + "/user/leaderboard", {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        "Access-Control-Allow-Origin": frontURL,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          throw new Error(data.message);
        }
        // console.log("DATA FROM BACK", data);
        setUsers(data.usersWithFinishedGames);
        setUsersWithoutFinishedGames(data.usersWithoutFinishedGames)
        // console.log("DATA USER WITH FINISHED GAMES", users);
        // console.log("DATA USER WITHOUT FINISHED GAMES", usersWithoutFinishedGames);
      })
      .catch((error) => {
        //console.log("Error loging in: ", error);
        throw error;
      });
  }

  useEffect(() => {
    getAllUsersFromBack();
  }, []);

  // chaque fois que users change, le composant sera rendu à nouveau et leaderboardRows sera recalculé
  //let rows = users.map((user, index) => createData(user, index + 1));

  return (
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
        {" "}
        {/** maxWidth false pour que ca soit fully responsive */}
        <Typography className="PlayerList__title" sx={{color:'#015958', fontWeight:'bold', fontSize: '13px'}}>
          Leaderboard
        </Typography>
        <TableContainer component={Paper} sx={{ overflow: "auto", marginTop: 3.5, marginBottom: 3.5 }}>
          <Table stickyHeader sx={{ minWidth: 500 }} aria-label="customized table">
            <TableHead>
              <TableRow>
                <StyledTableCell></StyledTableCell>
                <StyledTableCell align="right">Rank</StyledTableCell>
                <StyledTableCell align="right">Name</StyledTableCell>
                <StyledTableCell align="right">Nickname</StyledTableCell>
                <StyledTableCell align="right">Wins</StyledTableCell>
                <StyledTableCell align="right">Losses</StyledTableCell>
                <StyledTableCell align="right">Ratio</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => {
                const row = createData(user, users.indexOf(user) + 1);
                return (
                  <StyledTableRow key={user.id}>
                    <StyledTableCell component="th" scope="row">
                      <Avatar alt="Player avatar" src={row.avatar} style={getAvatarStyle(row.rank)}></Avatar>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      {row.rank === 1 && <EmojiEventsIcon style={{ color: "gold", marginRight: "5px" }} />}
                      {row.rank === 2 && <EmojiEventsIcon style={{ color: "silver", marginRight: "5px" }} />}
                      {row.rank === 3 && <EmojiEventsIcon style={{ color: "#cd7f32", marginRight: "5px" }} />}
                      {row.rank}
                    </StyledTableCell>
                    <StyledTableCell align="right">{row.name}</StyledTableCell>
                    <StyledTableCell align="right">{row.nickname}</StyledTableCell>
                    <StyledTableCell align="right">{row.wins}</StyledTableCell>
                    <StyledTableCell align="right">{row.losses}</StyledTableCell>
                    <StyledTableCell align="right">{row.ratio}%</StyledTableCell>
                  </StyledTableRow>
                );
              })}
              {usersWithoutFinishedGames.map((user) => {
                const rowWithout = createData(user, usersWithoutFinishedGames.indexOf(user) + 1);
                return (
                  <StyledTableRow key={user.id}>
                    <StyledTableCell component="th" scope="row">
                      <Avatar alt="Player avatar" src={rowWithout.avatar} ></Avatar>
                    </StyledTableCell>
                    <StyledTableCell align="right">-</StyledTableCell>
                    <StyledTableCell align="right">{rowWithout.name}</StyledTableCell>
                    <StyledTableCell align="right">{rowWithout.nickname}</StyledTableCell>
                    <StyledTableCell align="right">-</StyledTableCell>
                    <StyledTableCell align="right">-</StyledTableCell>
                    <StyledTableCell align="right">-</StyledTableCell>
                  </StyledTableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Paper>
  );
}

export default Leaderboard;
