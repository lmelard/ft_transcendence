import p5 from "p5";
import { User } from "../../../model/User";
import { Socket } from "socket.io-client";
import { UserDetails } from "../../../model/UserDetails";
import { GameDisplay } from "../../../model/GameDisplay";
import * as CONSTANTS from "../constants";
import { VarGame } from "../../../model/VarGame";

function handleDraw(p5: p5, gameDisplay: GameDisplay, varGame: VarGame, playerRName: string, playerLName: string, SpeedMode: boolean) {
  // fixed items
  if (SpeedMode) p5.background(0, 0, 139);
  else p5.background(0);
  p5.stroke(255);
  p5.strokeWeight(4);
  for (let i = 0; i < gameDisplay.windH; i += 20) {
    p5.line(gameDisplay.windW / 2, i, gameDisplay.windW / 2, i + 10);
  }

  // Scores
  p5.textFont("Arial", 4); // Use a pixelated font
  p5.fill(255);
  p5.textAlign(p5.CENTER, p5.TOP); // Centered text at the top
  p5.textSize(gameDisplay.windW / 20);
  p5.text(varGame.scoreL, gameDisplay.windW * (1 / 4), gameDisplay.windH / 8);
  p5.text(varGame.scoreR, gameDisplay.windW * (3 / 4), gameDisplay.windH / 8);

  // Drawing the player names
  p5.textSize(gameDisplay.windW / 15); // Slightly smaller text for player names
  p5.text(playerLName, gameDisplay.windW * (1 / 4), gameDisplay.windH / 50); // Below the left player's score
  p5.text(playerRName, gameDisplay.windW * (3 / 4), gameDisplay.windH / 50); // Below the right player's score

  //Mobile items
  p5.fill(255);
  p5.rect(gameDisplay.xPadL, varGame.yPadL, gameDisplay.padW, gameDisplay.padH);
  p5.rect(gameDisplay.xPadR, varGame.yPadR, gameDisplay.padW, gameDisplay.padH);
  p5.rect(varGame.xBall, varGame.yBall, gameDisplay.diam, gameDisplay.diam);
}

function handlePaddleCollision(
  varGame: VarGame,
  paddleSide: "left" | "right",
  gameDisplay: GameDisplay,
  applySpeedMode: boolean,
  setModeSpeed: (isSpeed: boolean) => void,
  gameSocket: Socket | null,
  room: string
) {
  const { padW, padH, windW, padOffset, diam } = gameDisplay;
  const paddleXPos = paddleSide === "left" ? padOffset : windW - padW - padOffset;
  const yPaddle = paddleSide === "left" ? varGame.yPadL : varGame.yPadR;
  const beyondPaddle = paddleSide === "left" ? varGame.xBall < diam / 2 : varGame.xBall + diam / 2 > windW;
  const collisionXCond = paddleSide === "left" ? varGame.xBall <= paddleXPos + padW : varGame.xBall >= paddleXPos;
  const speedFactor = paddleSide === "left" ? 1 : -1;

  if (collisionXCond && varGame.yBall >= yPaddle - padW && varGame.yBall <= yPaddle + padH) {
    // Collision with paddle detected
    const yMidPaddle = yPaddle + padH / 2;
    varGame.ySpeed = varGame.yBall < yMidPaddle ? -Math.abs(varGame.ySpeed) : Math.abs(varGame.ySpeed);
    varGame.xSpeed = Math.abs(varGame.xSpeed) * speedFactor;

    if (varGame.isSpeed) {
      varGame.ySpeed *= CONSTANTS.SPEED_INCREASE_FACTOR;
      varGame.xSpeed *= CONSTANTS.SPEED_INCREASE_FACTOR;
    }
  } else if (beyondPaddle) {
    // Ball is beyond the paddle
    handlePointScored(paddleSide === "right", varGame, gameDisplay);
    resetBallSpeed(varGame, gameDisplay, applySpeedMode, speedFactor);
    setModeSpeed(false);
    varGame.isSpeed = false;
    gameSocket?.emit("storeScore", {
      gameId: room,
      scoreR: varGame.scoreR,
      scoreL: varGame.scoreL,
      end: false,
    });
  }
}

function checkWallCollision(gameVars: VarGame, gameDisplay: GameDisplay) {
  const { diam, windH } = gameDisplay;
  if ((gameVars.ySpeed < 0 && gameVars.yBall < diam / 2) || (gameVars.ySpeed > 0 && gameVars.yBall > windH - diam / 2)) {
    gameVars.ySpeed *= -1;
  }
}

function calculateSpeedBasedOnWindowSize(gameDisplay: GameDisplay, applySpeedMode: boolean) {
  // Calculate base speeds as a fraction of the window dimensions
  const baseXSpeed = gameDisplay.windW * CONSTANTS.SPEED_X_FACTOR;
  const baseYSpeed = gameDisplay.windH * CONSTANTS.SPEED_Y_FACTOR;

  // Apply speed mode multiplier if needed
  const speedMultiplier = applySpeedMode ? CONSTANTS.SPEED_INCREASE_FACTOR : 1;

  return {
    xSpeed: baseXSpeed * speedMultiplier,
    ySpeed: baseYSpeed * speedMultiplier,
  };
}

function resetBallSpeed(gameVars: VarGame, gameDisplay: GameDisplay, applySpeedMode: boolean, speedFactor: number) {
  const { xSpeed, ySpeed } = calculateSpeedBasedOnWindowSize(gameDisplay, applySpeedMode);
  gameVars.ySpeed = ySpeed;
  gameVars.xSpeed = xSpeed * speedFactor;
}

function checkCollision(
  gameDisplay: GameDisplay,
  gameVars: VarGame,
  modeSpeed: boolean,
  setModeSpeed: (isSpeed: boolean) => void,
  gameSocket: Socket | null,
  room: string
) {
  handlePaddleCollision(gameVars, "left", gameDisplay, modeSpeed, setModeSpeed, gameSocket, room);
  handlePaddleCollision(gameVars, "right", gameDisplay, modeSpeed, setModeSpeed, gameSocket, room);
  checkWallCollision(gameVars, gameDisplay);
}

async function calculation(
  user: UserDetails,
  gameDisplay: GameDisplay,
  varGame: VarGame,
  hostPlayerR: User,
  joinPlayerL: User,
  gameSocket: Socket | null,
  room: string,
  setGameStatus: (status: string) => void,
  setWinner: (status: string) => void
) {
  if (user!.nickname === hostPlayerR!.nickname) {
    varGame.xBall = varGame.xBall + varGame.xSpeed;
    varGame.yBall = varGame.yBall + varGame.ySpeed;
  }

  if (varGame.scoreL === 11 || varGame.scoreR === 11) {
    gameSocket?.emit("storeScore", {
      gameId: room,
      scoreR: varGame.scoreR,
      scoreL: varGame.scoreL,
      winner: varGame.scoreL === 11 ? joinPlayerL : hostPlayerR,
      end: true,
    });
    setGameStatus("ENDED");
    setWinner(varGame.scoreL === 11 ? joinPlayerL.fullName : hostPlayerR.fullName);
    varGame.scoreL = 0;
    varGame.scoreR = 0;
    varGame.yPadL = gameDisplay!.windH / 2;
    varGame.yPadR = gameDisplay!.windH / 2;
  }

  if (user!.nickname === hostPlayerR!.nickname) emitMove(gameSocket, varGame, user, room, gameDisplay!);
}

function handlePointScored(hitRight: boolean, varG: VarGame, gameDisplay: GameDisplay) {
  if (hitRight) {
    varG.scoreL += 1;
  } else {
    varG.scoreR += 1;
  }
  // varG.xBall = varG.leftS ? dispVal.xPadL + dispVal.padW + dispVal.diam / 2 : dispVal.xPadR - dispVal.padW;
  // varG.yBall = varG.leftS ? varG.yPadL + 0.5 * dispVal.padH - dispVal.diam / 2 : varG.yPadR + 0.5 * dispVal.padH - dispVal.diam / 2;
  varG.xBall = gameDisplay.windW / 2 - gameDisplay.diam / 2;
  const numb = Math.random();
  if (numb % 2) {
    varG.yBall = gameDisplay.windH;
  } else {
    varG.yBall = 0;
  }
}

function emitMove(gSock: Socket | null, varG: VarGame, user: UserDetails | null, room: string, gameDisplay: GameDisplay) {
  gSock?.emit("move", {
    room: room,
    yBall: varG.yBall / gameDisplay.windH,
    xBall: varG.xBall / gameDisplay.windW,
    ySpeed: varG.ySpeed / gameDisplay.windH,
    xSpeed: varG.xBall / gameDisplay.windW,
    yPadR: varG.yPadR / gameDisplay.windH,
    yPadL: varG.yPadL / gameDisplay.windH,
    scoreL: varG.scoreL,
    scoreR: varG.scoreR,
    user: user,
    isSpeed: varG.isSpeed,
  });
}

function movePaddle(
  newY: number,
  gSock: Socket | null,
  user: UserDetails | null,
  varG: VarGame,
  room: string,
  gameDisplay: GameDisplay,
  right: boolean
) {
  if (newY >= -gameDisplay.padH / 2 && newY <= gameDisplay.windH) {
    if (right) {
      varG.yPadR = newY;
    } else {
      varG.yPadL = newY;
    }
    emitMove(gSock, varG, user, room, gameDisplay);
  }
}

function handlePowerUp(
  gameSocket: Socket | null,
  user: UserDetails | null,
  varGame: VarGame,
  room: string,
  setModeSpeed: (isSpeed: boolean) => void,
  gameDisplay: GameDisplay
) {
  setModeSpeed(true);
  varGame.isSpeed = true;
  gameSocket?.emit("startPowerUp", { roomId: room });
  emitMove(gameSocket, varGame, user, room, gameDisplay);
}

const GameService = {
  handleDraw,
  checkCollision,
  emitMove,
  calculation,
  movePaddle,
  handlePowerUp,
};

export default GameService;
