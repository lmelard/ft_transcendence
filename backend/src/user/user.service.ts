import { ConflictException, Injectable } from '@nestjs/common';
import { CustomJwtService } from 'src/user/strategy';
import { PrismaService } from 'src/prisma/prisma.service';

import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthDtoSignIn } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { authenticator } from 'otplib';

@Injectable()
export class UserService {
  private readonly defaultImageUrl =
    'https://res.cloudinary.com/drmpknxzb/image/upload/v1696507058/cmsytd8ax8qbxqhzxdzo.png';

  constructor(
    private prisma: PrismaService,
    private customJwtService: CustomJwtService,
    private customjwt: JwtService,
    private config: ConfigService
  ) {}

  /* **************
   ** Public method*
   ** *************/

  getUserFromToken(JwtToken: string | string[]) {
    return this.customJwtService.decodeJwtToken(Array.isArray(JwtToken) ? JwtToken[0] : JwtToken);
  }

  async blockUser(user: User, blockedUser: User): Promise<User[]> {
    await this.prisma.user.update({
      where: { nickname: user.nickname },
      data: {
        blocked: {
          connect: {
            nickname: blockedUser.nickname,
          },
        },
      },
      include: { blocked: true },
    });

    const blockedUsers = await this.prisma.user.findMany({
      where: { nickname: user.nickname },
      include: {
        blocked: {
          orderBy: { nickname: 'asc' },
        },
      },
    });

    return blockedUsers || [];
  }

  async unblockUser(user: User, blockedUser: User): Promise<User[]> {
    await this.prisma.user.update({
      where: { nickname: user.nickname },
      data: {
        blocked: {
          disconnect: {
            nickname: blockedUser.nickname,
          },
        },
      },
      include: { blocked: true },
    });

    const blockedUsers = await this.prisma.user.findMany({
      where: { nickname: user.nickname },
      include: {
        blocked: {
          orderBy: { nickname: 'asc' },
        },
      },
    });

    return blockedUsers || [];
  }

  async connectUsersAsFriends(userNickname: string, friendNickname: string) {
    await this.prisma.user.update({
      where: { nickname: friendNickname },
      data: {
        friends: {
          connect: {
            nickname: userNickname,
          },
        },
      },
      include: { friends: true },
    });

    const friends = await this.prisma.user.update({
      where: { nickname: userNickname },
      data: {
        friends: {
          connect: {
            nickname: friendNickname,
          },
        },
      },
      include: { friends: true },
    });

    return friends;
  }

  async removeUsersAsFriends(userId: string, friendId: string) {
    await this.prisma.user.update({
      where: { id: friendId },
      data: {
        friends: {
          disconnect: {
            id: userId,
          },
        },
      },
    });

    const friends = await this.prisma.user.update({
      where: { id: userId },
      data: {
        friends: {
          disconnect: {
            id: friendId,
          },
        },
      },
      include: { friends: true },
    });

    return friends;
  }

  async createUser(userData: any) {
    let hash: string;
    if (userData.password) hash = await argon.hash(userData.password);
    try {
      return await this.prisma.user.create({
        data: {
          email: userData.email,
          nickname: userData.nickname,
          fullName: userData.fullName,
          imageUrl: userData.imageUrl || this.defaultImageUrl,
          hash,
          memberOf: {
            connect: { name: 'ALL' },
          },
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        const meta = error.meta as any;
        throw new ConflictException(`A user with that ${meta.target} already exists.`);
      }
      throw error;
    }
  }

  async signin(dto: AuthDtoSignIn) {
    const user = await this.findUserByEmail(dto.email);
    await this.checkCurrentPassword(dto.password, user);
    return this.signToken(user.id);
  }

  async checkCurrentPassword(currentPassword: string, user: User): Promise<void> {
    const pwdMatches = await argon.verify(user.hash, currentPassword);
    if (!pwdMatches) throw new UnauthorizedException('Incorrect password');
  }

  async signToken(userId: string): Promise<{ access_token: string }> {
    const payload = { sub: userId };
    const secret = this.config.get('JWT_SECRET');
    const token = await this.customjwt.signAsync(payload, { expiresIn: '1000m', secret });
    return { access_token: token };
  }

  async findAllUsersExceptDefault(): Promise<User[]> {
    return await this.prisma.user.findMany({
      where: {
        NOT: [{ nickname: '__defaultUser__' }],
      },
    });
  }

  async retrieveUserFriends(userId: string) {
    const userWithFriends = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        friends: {
          select: {
            nickname: true,
            online: true,
            imageUrl: true,
            id: true,
          },
        },
      },
    });

    return userWithFriends.friends;
  }

  async getUserInfobyId(userId: string) {
    return await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  async getUserGamesbyId(userId: string) {
    const userWithFinishedGames = await this.prisma.game.findMany({
      where: {
        players: {
          some: {
            id: userId,
          },
        },
        status: 'ENDED', // Filtrer pour obtenir uniquement les parties terminées
      },
      include: {
        players: true, // Inclure les informations sur les joueurs pour chaque partie
      },
    });

    return userWithFinishedGames;
  }

  public async generate2FAuthSecret(user: User) {
    const secret = authenticator.generateSecret();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFAuthSecret: secret },
    });
    const otpAuthUrl = authenticator.keyuri(user.email, process.env.TWO_FACTOR_AUTHENTICATION_APP_NAME, secret);
    return { secret, otpAuthUrl };
  }

  public async updateTwoFAuth(user: User, enabled: boolean) {
    await this.prisma.user.update({
      where: { email: user.email },
      data: { is2FAuthEnabled: enabled },
    });
  }

  /* ****************
   ** Private method*
   ** **************/

  private async findUserByEmail(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
