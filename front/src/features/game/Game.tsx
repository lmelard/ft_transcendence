import { P5CanvasInstance, ReactP5Wrapper } from "@p5-wrapper/react";
import { useContext, useEffect, useRef, useState } from "react";
import GameService from "./utils/utilsGame";
import { UserContext } from "../../App";
import { User } from "../../model/User";
import { GameMdl } from "../../model/GameMdl";
import { UserDetails } from "../../model/UserDetails";
import { Socket, io } from "socket.io-client";
import { DefaultEventsMap } from "@socket.io/component-emitter";
import * as CONSTANTS from "./constants";
import { GameDisplay } from "../../model/GameDisplay";
import { VarGame } from "../../model/VarGame";
import { GameMessage } from "./utils/DisplayGame";
import { GameResponse } from "../../model/GameResponse";
import { Box, Container, Typography } from "@mui/material";
import baseURL from "../../utils/baseURL";
import { Cookies } from "react-cookie";
import axiosInstance from "../../utils/axiosInstance";

function Game() {

  const cookies = new Cookies();

  const { user, gameSocket, setGameSocket } = useContext(UserContext);
  const [room, setRoom] = useState<string>("");
  const [hostPlayerR, setHostPlayer] = useState<User | null>(null);
  const [joinPlayerL, setJoinPlayer] = useState<User | null>(null);
  const [modeSpeed, setModeSpeed] = useState<boolean>(false);
  const [gameStatus, setGameStatus] = useState<string>("");
  const [gameDisplay, setGameDisplay] = useState<GameDisplay | null>(null);
  const [varGame, setVarGame] = useState<VarGame | null>(null);
  const [idlePlayer, setIdlePlayer] = useState<string>("another player to connect");
  const [gameInvitationError, setGameInvitationError] = useState<string>("");
  const [winner, setWinner] = useState<string>("");

  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameContainerHeightRef = useRef<HTMLDivElement>(null);

  const updateGameDisplay = () => {
    const windW = gameContainerRef.current!.clientWidth;
    const windH =
      gameContainerHeightRef.current!.clientHeight - 80 < (3 * windW) / 5 ? gameContainerHeightRef.current!.clientHeight / 2 : (3 * windW) / 5;
    const padW = windW * 0.0167;
    const padH = windH * 0.2;
    const diam = windW * 0.0125;
    const padOffset = windW * 0.0167;
    const xPadL = padOffset;
    const xPadR = windW - padOffset - padW;
    const leftSXpos = xPadL + padW + diam / 2;
    const leftSYpos = windH / 2 + 0.5 * padH - diam / 2;
    const paddleStep = windH / 15;
    setGameDisplay({
      windW,
      windH,
      padW,
      padH,
      diam,
      padOffset,
      xPadL,
      xPadR,
      leftSXpos,
      leftSYpos,
      paddleStep,
    });
  };

  const gameSocketRef = useRef<Socket | null>(null);

  useEffect(() => {
    async function checkUserInGame() {
      try {
        const response = await axiosInstance.get("/user/isPlaying");
        // Do something with the response
        if (response.data) setGameStatus("PAUSE");
      } catch (error) {
        console.error("Error checking if user is in game", error);
        // Handle error
      }
    }

    checkUserInGame();
  }, []);

  useEffect(() => {
    // Fonction qui sera appelée lors du redimensionnement de la fenêtre
    const handleResize = () => {
      updateGameDisplay();
    };
  
    // Ajouter l'écouteur d'événements pour le redimensionnement
    window.addEventListener('resize', handleResize);
  
    // Appeler une première fois pour définir la taille initiale
    updateGameDisplay();
  
    // Nettoyer l'écouteur d'événements lors du démontage du composant
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Les dépendances vides assurent que l'effet s'exécute une seule fois
  

  useEffect(() => {
    // Call it initially to set the initial sizes
    updateGameDisplay();

    const socket = io(baseURL + "/game", {
      forceNew: true,
      query: { tokenJwt: cookies.get("jwt") },
    });
    setGameSocket(socket);

    gameSocketRef.current = socket;
    return () => {
        if (gameSocketRef.current) {
          gameSocketRef.current.disconnect();
        }
    };
  }, []);

  useEffect(() => {
    if (gameDisplay) {
      // Check if gameDisplay has been set
      const newVarGame = {
        yBall: gameDisplay!.windH / 2,
        xBall: gameDisplay!.windW / 2 - gameDisplay.diam / 2,
        xSpeed: gameDisplay!.windW * CONSTANTS.SPEED_X_FACTOR,
        ySpeed: gameDisplay!.windH * CONSTANTS.SPEED_Y_FACTOR,
        scoreL: varGame ? varGame.scoreL : 0,
        scoreR: varGame ? varGame.scoreR : 0,
        yPadL: gameDisplay!.windH / 2,
        yPadR: gameDisplay!.windH / 2,
        isSpeed: varGame ? varGame.isSpeed : false,
      };

      setVarGame(newVarGame); // Now you can safely set varGame
    }
  }, [gameDisplay]);

  useGameSocketEvents(
    gameSocket,
    setRoom,
    setGameStatus,
    setHostPlayer,
    setJoinPlayer,
    user,
    varGame!,
    gameDisplay!,
    setModeSpeed,
    setIdlePlayer,
  );

  function sketch(p5: P5CanvasInstance) {
    p5.setup = () => p5.createCanvas(gameDisplay!.windW, gameDisplay!.windH);

    p5.windowResized = () => {
      updateGameDisplay();
      p5.resizeCanvas(gameDisplay!.windW, gameDisplay!.windH);
    };

    p5.keyPressed = () => {
      const e = { code: p5.key };
      if (user && gameDisplay && varGame) {
        if (e.code === CONSTANTS.UP_ARROW) {
          if (user!.nickname === hostPlayerR!.nickname) {
            GameService.movePaddle(varGame.yPadR - gameDisplay.paddleStep, gameSocket, user, varGame, room, gameDisplay, true);
          }
        } else if (e.code === CONSTANTS.DOWN_ARROW) {
          if (user!.nickname === hostPlayerR!.nickname) {
            GameService.movePaddle(varGame.yPadR + gameDisplay.paddleStep, gameSocket, user, varGame, room, gameDisplay, true);
          }
        } else if (e.code === CONSTANTS.S_KEY) {
          if (user!.nickname === joinPlayerL!.nickname) {
            GameService.movePaddle(varGame.yPadL + gameDisplay.paddleStep, gameSocket, user, varGame, room, gameDisplay, false);
          }
        } else if (e.code === CONSTANTS.W_KEY) {
          if (user!.nickname === joinPlayerL!.nickname) {
            GameService.movePaddle(varGame.yPadL - gameDisplay.paddleStep, gameSocket, user, varGame, room, gameDisplay, false);
          }
        } else if (e.code === CONSTANTS.B_KEY) {
          GameService.handlePowerUp(gameSocket, user, varGame, room, setModeSpeed, gameDisplay);
        }
      }
    };

    p5.draw = () => {
      GameService.handleDraw(p5, gameDisplay!, varGame!, hostPlayerR!.nickname, joinPlayerL!.nickname, modeSpeed);
      GameService.checkCollision(gameDisplay!, varGame!, modeSpeed, setModeSpeed, gameSocket, room);
      GameService.calculation(user!, gameDisplay!, varGame!, hostPlayerR!, joinPlayerL!, gameSocket, room, setGameStatus, setWinner);
    };
  }

  async function handleJoinGame() {
    gameSocket?.emit("joinGame", { roomId: room }, (response: GameResponse) => {
      if (!response.ok) {
        setGameInvitationError(response.statusText);
        setGameStatus("ERROR");
      }
    });
  }

  const renderGameStatus = () => {
    switch (gameStatus) {
      case "LIVE":
        return <ReactP5Wrapper sketch={sketch} gameDisplay={gameDisplay} />;
      case "PAUSE":
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">Waiting for {idlePlayer}...</Typography>
          </Box>
          );
      case "ENDED":
        return <GameMessage player={winner} message={CONSTANTS.MSG_END} subMessage={CONSTANTS.SUBMSG_END} handleJoinGame={handleJoinGame} />;
      case "ERROR":
        return gameInvitationError && <div style={{ color: "red" }}>{gameInvitationError}</div>;
      default:
        return (
          <Box sx={{ textAlign: "center" }}>
            <GameMessage player={user!.fullName} message={CONSTANTS.MSG_START} subMessage={CONSTANTS.SUBMSG_START} handleJoinGame={handleJoinGame} />
            {/* <img src="https://www.primarygames.com/arcade/classic/pongclassic/logo200.png" alt="Pong Logo" style={{ maxWidth: '100%', height: 'auto' }} /> */}
            <img
              src="https://www.hiig.de/wp-content/uploads/2014/11/Pong1-1200x900.jpg"
              alt="Pong Logo"
              style={{ maxWidth: "50%", height: "auto" }}
            />
          </Box>
        );
    }
  };

  return (
    <>
      <Box
        sx={{ marginTop: 2, marginLeft: 2, borderRadius: 1, border: `1px solid #366873`, height: "calc(100vh - 120px)", overflowY: "auto" }}
        ref={gameContainerHeightRef}
      >
        <Container component="main" maxWidth={false}>
          <Typography className="PlayerList__title" sx={{ color: "#015958", fontWeight: "bold", fontSize: "13px" }}>
            Game
          </Typography>
          <div ref={gameContainerRef}>{renderGameStatus()}</div>
        </Container>
      </Box>
    </>
  );
}

function useGameSocketEvents(
  gameSocket: Socket<DefaultEventsMap, DefaultEventsMap> | null,
  setRoom: (room: string) => void,
  setGameStatus: (status: string) => void,
  setHostPlayer: (player: User | null) => void,
  setJoinPlayer: (player: User | null) => void,
  user: UserDetails | null,
  varGame: VarGame,
  gameDisplay: GameDisplay,
  setModeSpeed: (isSpeed: boolean) => void,
  setIdlePlayer: (idlePlayer: string) => void
) {
  // useEffect(() => {
  //   if (!gameSocket) return;

  // }, []);

  useEffect(() => {
    if (!gameSocket) return;
    const onJoinedGame = (game: GameMdl) => {
      if (game.error) {
        return;
      }
      setGameStatus(game.status);
      setRoom(game.id);
      varGame.scoreL = game.scoreL;
      varGame.scoreR = game.scoreR;
      setIdlePlayer("another player to connect");

      if (game.owner) setHostPlayer(game.owner);
      if (game.players![0] && game.players![1]) setJoinPlayer(game.players![1].id === game.owner.id ? game.players![0] : game.players![1]);
    };

    const onOpponentDisconnected = (game: GameMdl) => {
      setIdlePlayer("waiting for your opponent to reconnect");
      setGameStatus(game.status);
    };

    const onMove = (data: any) => {
      if (data.user!.id !== user!.id) {
        varGame.yBall = data.yBall * gameDisplay!.windH;
        varGame.xBall = data.xBall * gameDisplay!.windW;
        varGame.yPadR = data.yPadR * gameDisplay!.windH;
        varGame.yPadL = data.yPadL * gameDisplay!.windH;
        varGame.scoreL = data.scoreL;
        varGame.scoreR = data.scoreR;
        varGame.isSpeed = data.isSpeed;
      }
    };

    const setInvitedPlayer = (data: string) => {
      setIdlePlayer(data);
      setGameStatus("PAUSE");
    };

    const onUpdateMode = () => {
      setModeSpeed(true);
      varGame.isSpeed = true;
    };

    gameSocket.on("joinedGame", onJoinedGame);
    gameSocket.on("opponentDisconnected", onOpponentDisconnected);
    gameSocket.on("move", onMove);
    gameSocket.on("invitedPlayer", setInvitedPlayer);
    gameSocket.on("updateMode", onUpdateMode);
    //gameSocket.on("getScore", onGetScore);

    return () => {
      gameSocket.off("joinedGame", onJoinedGame);
      gameSocket.off("opponentDisconnected", onOpponentDisconnected);
      gameSocket.off("move", onMove);
      gameSocket.off("invitedPlayer", setInvitedPlayer);
      gameSocket.off("updateMode", onUpdateMode);
      //gameSocket.off("getScore", onGetScore);
    };
  }, [gameSocket, varGame]);
}

export default Game;
