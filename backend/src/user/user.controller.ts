import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { ForbiddenException, HttpCode, InternalServerErrorException, Redirect, Res } from '@nestjs/common';
import { AuthDtoSignIn, AuthDtoSignUp, DtoUpdateUserInfo, DtoUrl } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetUser } from './decorator/get-user.decorator';
import { Prisma, User } from '@prisma/client';
import { JwtAuthGuard } from './guard';
import axios from 'axios';
import fetch from 'node-fetch';
import { UserService } from './user.service';
import { UserGateway } from './user.gateway';
import { Response, Request } from 'express';
import { resolveObjectURL } from 'buffer';
import * as argon from 'argon2';
import { toDataURL } from 'qrcode';
import { authenticator } from 'otplib';

@Controller('user')
export class UserController {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private userGateway: UserGateway
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@GetUser() user: User) {
    if (user) {
      return user;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('userById')
  getUserById(@Body() user: User) {
    if (user) {
      return this.userService.getUserInfobyId(user.id)
    }
    return null;
  }

  @UseGuards(JwtAuthGuard)
  @Get('updateFirstCon')
  async getfirstCon(@GetUser() user: User) {
    return await this.prisma.user.update({
      where: { id: user.id },
      data: { firstCon: false },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('all')
  async getAll(@GetUser() user: User) {
    const users = await this.prisma.user.findMany({
      where: {
        NOT: [{ id: user.id }, { nickname: '__defaultUser__' }],
      },
    });

    return users;
  }

  @UseGuards(JwtAuthGuard)
  @Get('leaderBoard')
  async leaderBoard(@GetUser() user: User) {
    const usersWithFinishedGames = await this.prisma.user.findMany({
      where: {
        NOT: [{ nickname: '__defaultUser__' }],
        playerOf: {
          some: {
            status: 'ENDED',
          },
        },
      },
      orderBy: { // determine comment les resultats doivent etre tries
        winnerOf: {
          _count: 'desc', // tri par ordre decroissant
        },
      },
      include: {
        _count: { // en plus du tri ajoute le comptage de parties gagnees dans le resultat
          select: {
            winnerOf: true, // Compte le nombre de fois que l'utilisateur est le gagnant
            playerOf: true, // // Compte le nombre de fois que l'utilisateur est le gagnant
          },
        },
      },
    });

    const sortedUsersWithFinishedGames = usersWithFinishedGames
      .map((user) => ({
        ...user, // copie toutes les proprietes de l'objet user
        winCount: user._count.winnerOf, // Ajoutez le nombre de victoires comme une propriété pour chaque utilisateur
        lossCount: user._count.playerOf - user._count.winnerOf,
        winRatio: user._count.winnerOf / user._count.playerOf,
      }))
      .sort((a, b) => {
        if (b.winCount !== a.winCount) {
          return b.winCount - a.winCount;
        }
        return b.winRatio - a.winRatio; // Si le nombre de victoires est égal, triez par le meilleur ratio de victoire
      });

      const usersWithoutFinishedGames = await this.prisma.user.findMany({
        where: {
          NOT: [{ nickname: '__defaultUser__' }],
          playerOf: {
            none: {
              status: 'ENDED',
            },
          },
        },
        include: {
          _count: {
            select: {
              playerOf: true,
            },
          },
        },
      });

      return {
        usersWithFinishedGames: sortedUsersWithFinishedGames,
        usersWithoutFinishedGames: usersWithoutFinishedGames
      }
  }

  @UseGuards(JwtAuthGuard)
  @Get('getUserGames')
  async getUserGames(@GetUser() user: User) {
    const users = await this.prisma.user.findMany({
      where: {
        NOT: [{ nickname: '__defaultUser__' }],
      },
      orderBy: {
        // determine comment les resultats doivent etre tries
        winnerOf: {
          _count: 'desc', // tri par ordre decroissant
        },
      },
      include: {
        // en plus du tri ajoute le comptage de parties gagnees dans le resultat
        _count: {
          select: {
            winnerOf: true, // Compte le nombre de fois que l'utilisateur est le gagnant
            playerOf: true,
          },
        },
      },
    });

    return users
      .map((user) => ({
        ...user, // copie toutes les proprietes de l'objet user
        winCount: user._count.winnerOf, // Ajoutez le nombre de victoires comme une propriété pour chaque utilisateur
        lossCount: user._count.playerOf - user._count.winnerOf,
        winRatio: user._count.winnerOf / user._count.playerOf,
      }))
      .sort((a, b) => {
        if (b.winCount !== a.winCount) {
          return b.winCount - a.winCount;
        }
        return b.winRatio - a.winRatio; // Si le nombre de victoires est égal, triez par le meilleur ratio de victoire
      });
  }

  @UseGuards(JwtAuthGuard)
  @Get('allFriends')
  async getAllFriends(@GetUser() user: User) {
    const friendsWithNicknameAndLogInfo = await this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        friends: {
          select: {
            nickname: true,
            imageUrl: true,
            id: true,
          },
        },
      },
    });
    return friendsWithNicknameAndLogInfo;
  }

  @UseGuards(JwtAuthGuard)
  @Get('isPlaying')
  async userIsPlaying(@GetUser() user: User): Promise<boolean> {
    const userStatus = await this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        isPlaying: true, // Select only the isPlaying field
      },
    });
    if (!userStatus?.isPlaying)
      return false
    else 
      return true
  }

  @UseGuards(JwtAuthGuard)
  @Get('userFriendRequests')
  async getFriendRequests(@GetUser() user: User) {
    const userFriendRequests = await this.prisma.friendRequests.findMany({
      where: {
        OR: [{ user1: user.nickname }, { user2: user.nickname }],
      },
    });
    return userFriendRequests;
  }

  @UseGuards(JwtAuthGuard)
  @Get('blockedPlayers')
  async getBlockedPlayers(@GetUser() user: User) {
    const blockedPlayers = await this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        blocked: {
          select: {
            nickname: true,
            imageUrl: true,
            id: true,
          },
        },
      },
    });
    return blockedPlayers;
  }

  @UseGuards(JwtAuthGuard)
  @Post('updateUser')
  async updateUser(@Body() user: User) {
    const user_db = await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: user,
    });
    return user_db;
  }

  @Post('signup')
  async signup(@Body() data: AuthDtoSignUp) {
    try {
      const userCreated = await this.userService.createUser(data);

      if (userCreated) {
        this.userGateway.playersStatusUpdate();
      }
      return userCreated;
    } catch (error) {
      throw error;
    }
  }

  @Post('signin')
  async signin(@Body() dto: AuthDtoSignIn, @Res() res) {
    try {
      let userConnected = await this.userService.signin(dto);
      if (userConnected) {
        this.userGateway.playersStatusUpdate();
      }
      res.cookie('jwt', userConnected.access_token, { httpOnly: false, secure: false });
      return res.status(200).send({ ok: true });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        return res.status(401).send({ error: error.message });
      }
      return res.status(500).send({ error: 'Something went wrong' });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('setOnline')
  async login(@GetUser() user: User, @Res() res) {
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { online: true, is2FAPassed: true },
    });
    this.userGateway.playersStatusUpdate();
    return res.status(200).send({ ok: true, user: updatedUser });
  }

  @UseGuards(JwtAuthGuard)
  @Get('logout')
  async logout(@GetUser() user: User, @Res() res: Response) {
    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { online: false, lastOffline: new Date(), isPlaying: false, is2FAPassed: false },
      });
      this.userGateway.playersStatusUpdate();
      res.clearCookie('jwt', { httpOnly: false, secure: false });
      return res.status(200).send({ ok: true });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('generate2FA')
  async generateQrCode(@GetUser() user: User) {
    const { otpAuthUrl } = await this.userService.generate2FAuthSecret(user);
    return toDataURL(otpAuthUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify2FA')
  @HttpCode(200)
  async verify2FAuth(@GetUser() user: User, @Body() data: any, @Res() res: Response) {
    // Validate the 2FA code
    const isCodeValid = authenticator.verify({ token: data.token, secret: user.twoFAuthSecret });

    if (!isCodeValid) {
      throw new ForbiddenException('Invalid 2FA code');
    }
    // Update is2FAuthEnabled to true
    await this.userService.updateTwoFAuth(user, true);

    return res.status(200).send({ ok: true });
  }

  @UseGuards(JwtAuthGuard)
  @Post('turnOff2FA')
  async turnOff2FA(@GetUser() user: User): Promise<void> {
    // Update is2FAuthEnabled to false
    await this.userService.updateTwoFAuth(user, false);
  }

  @UseGuards(JwtAuthGuard)
  @Get('closingWindow')
  async closingWindow(@GetUser() user: User, @Res() res: Response) {
    if (!user.is2FAuthEnabled && user.twoFAuthSecret) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          twoFAuthSecret: '',
          is2FAuthEnabled: false,
        },
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        online: false,
        lastOffline: new Date(),
      },
    });
    this.userGateway.playersStatusUpdate();
    return res.status(200).send({ ok: true });
  }

  @UseGuards(JwtAuthGuard)
  @Post('changeSettings')
  async changeSettings(@GetUser() user: User, @Body() body: DtoUpdateUserInfo) {
    console.log('BODY received in changeSettings', body.fullName);
    console.log('USER received in changeSettings', user);
    try {
      const user_db = await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          fullName: body.fullName,
          email: body.email,
          nickname: body.nickname,
        },
      });
      console.log('userdb: ', user_db);
      this.userGateway.playersStatusUpdate();
      return user_db;
    } catch (error) {
      console.log('ERROR changing SETTINGS', error);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('updatePassword')
  async updatePassword(@GetUser() user: User, @Body() newPassword: any) {
    console.log('ENTER UPDATE PASSWORD');
    console.log('New password', newPassword.newPassword);
    if (newPassword) {
      try {
        const user_db = await this.prisma.user.update({
          where: { id: user.id },
          data: { hash: await argon.hash(newPassword.newPassword) },
        });
        console.log('userdb: ', user_db);
        this.userGateway.playersStatusUpdate(); // pas tres utile je pense
        return user_db;
      } catch (error) {
        console.log('error changing password', error);
        throw new UnauthorizedException('error updating password');
      }
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('updateAvatar')
  async updateAvatar(@GetUser() user: User, @Body() body: DtoUrl) {
    console.log('ENTER UPDATE AVATAR');
    console.log('body', body.imageUrl);
    try {
      const user_db = await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          imageUrl: body.imageUrl,
        },
      });
      console.log('userdb: ', user_db);
      this.userGateway.playersStatusUpdate();
      return user_db;
    } catch (error) {
      console.log('ERROR changing SETTINGS', error);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkCurrentPassword')
  async checkCurrentPassword(@Body() currentPassword: any, @GetUser() user: User, @Res() res: Response) {
    console.log('ENTER CHECK CURRENT PASSWORD');
    console.log('USER', user);
    console.log('currentpassword', currentPassword.currentPassword);
    try {
      await this.userService.checkCurrentPassword(currentPassword.currentPassword, user);
    } catch (error) {
      console.log('catching error');
      throw new UnauthorizedException('Incorrect password');
    }
    return res.status(200).send({ ok: true });
  }

  @Get('42')
  @Redirect('https://api.intra.42.fr/oauth/authorize', 302)
  async redirectToAuth(@Req() req) {
    const clientId = process.env.ID42; // Remplacez par votre client ID
    const redirectUri = process.env.BACK_URL + '/user/42/callback'; // Remplacez par votre URL de callback
    const scope = 'public';
    return {
      statusCode: 302,
      url: `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`,
    };
  }

  // Endpoint de redirection après l'authentification 42
  @Get('42/callback')
  @HttpCode(200)
  async callback(@Req() req, @Res() res) {
    const { code } = req.query;
    const clientId = process.env.ID42;
    const clientSecret = process.env.SECRET42;
    const redirectUri = process.env.BACK_URL + '/user/42/callback';

    try {
      const response = await axios.post('https://api.intra.42.fr/oauth/token', {
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      });

      const accessToken = response.data.access_token;
      console.log('accesstoken', accessToken); //

      const user42profile: any = await (
        await fetch('https://api.intra.42.fr/v2/me/', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      ).json();

      //TO-DO add user full name
      console.log('42FULLNAME', user42profile.usual_full_name);
      console.log('42EMAIL', user42profile.email);
      console.log('42NICKNAME', user42profile.login);

      let userDB = await this.prisma.user.findFirst({
        where: {
          email: user42profile.email,
        },
      });
      console.log('email42 matches an existing user ? ', userDB);
      if (!userDB) {
        console.log('No -> creating a new user');
        let data = {
          login42: user42profile.login,
          imageUrl: user42profile.image.link,
          email: user42profile.email,
          nickname: user42profile.login,
          fullName: user42profile.usual_full_name,
          password: null,
        };
        userDB = await this.userService.createUser(data);
        if (userDB) {
          this.userGateway.playersStatusUpdate();
        }
      }

      await this.prisma.user.update({
        where: { id: userDB.id },
        data: {
          login42: true,
        },
      });

      const token = await this.userService.signToken(userDB.id);
      console.log('token', token); //

      res.cookie('jwt', token.access_token, { httpOnly: false, secure: false });
      this.userGateway.playersStatusUpdate();
      res.redirect(`${process.env.FRONT_URL}`);
    } catch (error) {
      res.cookie('error', error, { httpOnly: false, secure: false });
      res.redirect(`${process.env.FRONT_URL}`);
    }
  }
}
