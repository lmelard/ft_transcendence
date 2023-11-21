import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { User } from '@prisma/client';
import { Server} from 'socket.io'
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';


@WebSocketGateway({
  cors: { origin: process.env.FRONT_URL },
  namespace: 'chat',
})
export class UserGateway {
  @WebSocketServer()
  server: Server;

  constructor( private prisma: PrismaService, private userService: UserService) {}

  async playersStatusUpdate(): Promise<void> {

    const users = await this.userService.findAllUsersExceptDefault();
    this.server.emit('playersStatusUpdate', users);
  }

  @SubscribeMessage('FriendsUpdate')
  async retrieveFriends(@ConnectedSocket() client: any): Promise<void> {
    const user = await this.userService.getUserFromToken(client.handshake.query.tokenJwt);
    const friendsList = await this.userService.retrieveUserFriends(user.id);
    client.emit('FriendsUpdate', friendsList);
  }

  @SubscribeMessage('addFriend')
  async addFriend(@MessageBody() data: any, @ConnectedSocket() client: any): Promise<void> {
    const user = await this.userService.getUserFromToken(client.handshake.query.tokenJwt);
    const friendNickname : string = data.friendNickname;

    const friendsList =  await this.userService.connectUsersAsFriends(user.nickname, friendNickname);
    this.server.emit('updateOnFriend');

    // delete friend request in DB   
    await this.prisma.friendRequests.deleteMany({
      where: {
        OR: [
          {AND:[
            {user1: user.nickname},
            {user2: friendNickname},
          ]},
          {AND:[
            {user1: friendNickname},
            {user2: user.nickname},
          ]}
        ]
      }
    });
  }

  @SubscribeMessage('blockPlayer')
  async blockPlayer(@MessageBody() data: any, @ConnectedSocket() client: any): Promise<void> {
    const user = await this.userService.getUserFromToken(client.handshake.query.tokenJwt);

    const blackList =  await this.userService.blockUser(user, data.friend);
    client.emit('updateBlackList', blackList);
  }

    @SubscribeMessage('unblockPlayer')
    async unblockPlayer(@MessageBody() data: any, @ConnectedSocket() client: any): Promise<void> {
      const user = await this.userService.getUserFromToken(client.handshake.query.tokenJwt);
  
      const blackList =  await this.userService.unblockUser(user, data.friend);
      client.emit('updateBlackList', blackList);
    }

  @SubscribeMessage('getUserInfo')
  async getUserInfo(@ConnectedSocket() client: any, @MessageBody() data: any): Promise<void> {
    const userInfo : User = await this.userService.getUserInfobyId(data.userInfo);
    const gamesInfo = await this.userService.getUserGamesbyId(data.userInfo);
    
    console.log('HEREEEEEE', userInfo.id)

    client.emit('getUserInfo', {userinfo: userInfo, gamesInfo: gamesInfo});
  }
}
