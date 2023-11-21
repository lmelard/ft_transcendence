import { Request } from 'express';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as jwt from 'jsonwebtoken'; // Import jsonwebtoken library
import { User } from '@prisma/client';
import { Response } from '@nestjs/common';

@Injectable()
export class CustomJwtService {
  
  constructor(private prisma: PrismaService) {}
  
  private readonly secretKey = process.env.JWT_SECRET;
  async generateJwtToken(user: User, @Response() res: any) {
    const payload = { sub: user.id }; // Customize the payload as needed
    const token = jwt.sign(payload, this.secretKey);

    // Set the cookie
    res.cookie('access_token', token, { httpOnly: false, secure: false, sameSite: false }).send({});
    console.log('tokennnn', token);
    return res;
  }

  async decodeJwtToken(token: string) {
    try {
      const decoded = jwt.verify(token, this.secretKey);

      const user = await this.prisma.user.findUnique({
        where: {
          id: decoded.sub as string,
        },
      });
      return user;
    } catch (error) {
      console.error('Error decoding JWT token:', error.message);
      return null;
    }
  }
}


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly customJwtService: CustomJwtService,  private prisma: PrismaService ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJWTFromCookie,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  private static extractJWTFromCookie(req: Request): string | null {
    if (req.cookies && req.cookies.jwt) {
      return req.cookies.jwt;
    }
    return null;
  }

  async validate(payload: { sub: string}) {
    const user = this.prisma.user.findUnique({
            where: {
              id: payload.sub,
            },
          });
    if (!user) {
      throw new UnauthorizedException;
    }
    return user;
    // return { userId: payload.sub, username: payload.username };
  }
}
// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
//   constructor( private prisma: PrismaService ) {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       secretOrKey: process.env.JWT_SECRET,
//     });
//   }

//   async validate(payload: { sub: string}) {
//     return this.prisma.user.findUnique({
//       where: {
//         id: payload.sub,
//       },
//     });
//   }
// }

// @Injectable()
// export class CustomJwtService {
//   // Replace 'YOUR_JWT_SECRET' with your actual JWT secret
//   constructor( private prisma: PrismaService) {}
//   private readonly secretKey = process.env.JWT_SECRET;

//   async decodeJwtToken(token: string){
//     try {
//       const decoded = jwt.verify(token, this.secretKey);

//       const user = await this.prisma.user.findUnique({
//         where: {
//           id: decoded.sub as string,
//         },
//       });
//       return(user);
//     } catch (error) {
//       console.error('Error decoding JWT token:', error.message);
//       return null;
//     }
//   }
// }
