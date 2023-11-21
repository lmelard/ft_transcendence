import { Injectable } from '@nestjs/common';
import { Game, User } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserGateway } from 'src/user/user.gateway';

@Injectable()
export class GameService {
  constructor(
    private prisma: PrismaService,
    private userGateway: UserGateway
  ) {}

  async createGame(user: User, positionGame: number, modeSpeed: boolean, type: string): Promise<Game> {
    try {
      const game = await this.prisma.game.create({
        data: {
          name: randomUUID(),
          owner: { connect: { id: user.id } }, // Connect the user to the channel
          players: { connect: [{ id: user.id }] }, // Connect the user to the channel
          position: positionGame,
          mode: modeSpeed ? 'SPEED' : 'CLASSIC',
          type: type,
        },
        include: { players: true, owner: true },
      });
      return game;
    } catch (error) {
      throw error;
    }
  }

  async addUsertoGame(user: User, gameId: string) {
    try {
      const checkGame = await this.prisma.game.findUnique({
        where: { id: gameId },
        include: { owner: true, players: true },
      });

      if (checkGame.players[0] && checkGame.players[0].isPlaying) {
        const updatedGame = await this.prisma.game.update({
          where: { id: gameId },
          data: {
            players: { connect: { id: user.id } },
            full: true,
            status: 'LIVE',
          },
          include: { owner: true, players: true },
        });
        return updatedGame;
      } else {
        const updatedGame = await this.prisma.game.update({
          where: { id: gameId },
          data: {
            players: { connect: { id: user.id } },
            full: true,
            status: 'PAUSE',
          },
          include: { owner: true, players: true },
        });
        return updatedGame;
      }



    } catch (error) {
      throw error;
    }
  }

  async storeScore(gameId: string, scoreR: number, scoreL: number, winner: User, end: boolean) {
    try {
      console.log('WINNER', winner)
      if (gameId && end) {
        const updatedGame = await this.prisma.game.update({
          where: { id: gameId },
          data: {
            scoreR: scoreR,
            scoreL: scoreL,
            winner: { connect: { id: winner.id } },
            status: 'ENDED',
            
          },
          include: {
            players: true,
          },
        });
        this.removeUserPlaying(updatedGame.players[0]);
        this.removeUserPlaying(updatedGame.players[1]);
        if (winner) {
          const winnerDetail = await this.prisma.user.findUnique({
            where: { id: winner.id },
            include: { winnerOf: true },
          });

          await this.prisma.user.update({
            where: { id: winnerDetail.id },
            data: {
              expert: winnerDetail.winnerOf.length > 0 ? true : false,
            },
          });
        }
        return updatedGame;
      }
      if (gameId && !end) {
        console.log('HEREEEEE GAME SCOREEEEE', scoreL, scoreR)
        const updatedGame2 = await this.prisma.game.update({
          where: { id: gameId },
          data: {
            scoreR: scoreR,
            scoreL: scoreL,
          },
        });
        return updatedGame2;
      }
    } catch (error) {
      console.error('Error updating game:', error);
      // You can add additional error handling or rethrow the error if needed.
      throw error;
    }
  }

  async updateUserPlaying(user: User, playing : boolean) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isPlaying: playing,
      },
    });
    this.userGateway.playersStatusUpdate();
  }

  async removeUserPlaying(user: User) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isPlaying: false,
      },
    });
    this.userGateway.playersStatusUpdate();
  }

  async getLowestPositionGame() {
    return await this.prisma.game.findFirst({
      where: { full: false, type: 'PUBLIC' },
      // orderBy: { position: 'asc' },
      include: { players: true },
    });
  }

  async getNextPosition() {
    const largestPosition = await this.prisma.game.findFirst({
      select: { position: true },
      orderBy: { position: 'desc' },
    });
    return largestPosition ? largestPosition.position + 1 : 1;
  }

  async getUserGames(userId: string) {
    // Retrieve the game that the user is a part of where the status is 'PAUSE'
    // and include the players in the result to access their statuses.
    return await this.prisma.user
      .findUnique({
        where: { id: userId },
        select: {
          playerOf: {
            where: { status: 'PAUSE' },
            include: {
              players: true, // Include players to access their 'isPlaying' and 'online' status
            },
            take: 1,
          },
        },
      })
      .then((userDB) => userDB?.playerOf[0]);
  }

  async updateGameStatus(gameId: string, gameStatus: string) {
    const updatedGame = await this.prisma.game.update({
      where: { id: gameId },
      data: { status: gameStatus },
      include: { players: true, owner:true },
    });

    return updatedGame;
  }

  async getActiveGames(userId: string) {
    return await this.prisma.user
      .findUnique({
        where: { id: userId },
        select: { playerOf: { where: { status: 'LIVE' }, take: 1 } },
      })
      .then((userDB) => userDB?.playerOf[0]); // Immediately access the first game.
  }

  async pauseGame(gameId: string) {
    return await this.prisma.game.update({
      where: { id: gameId },
      data: { status: 'PAUSE' },
    });
  }

  async updatePlaying(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isPlaying: true },
    });
  }

  async isUserInLiveGame(userId: string): Promise<boolean> {
    // Find the first game where the user is a player and the game is LIVE
    const liveGame = await this.prisma.game.findFirst({
      where: {
        players: { some: { id: userId } },
        status: 'LIVE',
      },
    });

    // If a game is found, the user is in a LIVE game
    return liveGame != null;
  }

  async isUserPlaying(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        isPlaying: true, // Select only the isPlaying field
      },
    });

    // If user is not found, we consider them as not playing
    // Otherwise, return the value of isPlaying
    return user ? user.isPlaying : false;
  }
}
