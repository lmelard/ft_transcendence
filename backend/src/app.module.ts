import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DefaultUserService } from './default-service/default-user.service';
import { DefaultChannelService } from './default-service/default-channel.service';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { ChatModule } from './chat/chat.module';
import { GameModule } from './game/game.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UserModule,
    PrismaModule,
    ChatModule,
    GameModule
  ],
  providers: [DefaultUserService, DefaultChannelService],
})
export class AppModule {}
