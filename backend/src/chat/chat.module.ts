import { Module } from '@nestjs/common';
import { ChatService } from './services/chat.service';
import { ChatModService } from './services/chat-mod.service';
import { ChatDelService } from './services/chat-del.service';
import { ChatGateway } from './chat.gateway';
import { CustomJwtService } from 'src/user/strategy';
import { UserService } from 'src/user/user.service';
import { ChatController } from './chat.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [JwtModule.register({}), PassportModule.register({ defaultStrategy: '42' })],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, ChatModService, ChatDelService, CustomJwtService, UserService],
})
export class ChatModule {}
