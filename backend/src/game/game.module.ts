import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { UserService } from 'src/user/user.service';
import { CustomJwtService } from 'src/user/strategy';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserGateway } from 'src/user/user.gateway';

@Module({
  imports: [JwtModule.register({}), PassportModule.register({ defaultStrategy: '42' })],
  providers: [GameGateway, GameService, UserService, CustomJwtService, UserGateway]
})
export class GameModule {}
