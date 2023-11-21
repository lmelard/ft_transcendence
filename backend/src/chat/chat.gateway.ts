/* Note for WebSockets errors handlers

In a Nest.js WebSocket gateway, you generally won't use HttpException and HttpStatus
because these are primarily designed for handling HTTP requests and responses.
WebSocket gateways deal with WebSocket messages and events, which have different
characteristics than HTTP requests.

Instead of using HttpException, you would typically handle errors by emitting custom
WebSocket messages or events to communicate errors or responses to your WebSocket clients.
You have more flexibility in defining your error handling logic in WebSocket gateways.

*/
import {
  WebSocketGateway, WebSocketServer, ConnectedSocket,
  SubscribeMessage, MessageBody,
  OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit,
} from '@nestjs/websockets';
import { ChatService } from './services/chat.service';
import { ChatModService } from './services/chat-mod.service';
import { ChatDelService } from './services/chat-del.service';
import { Server, Socket } from 'socket.io';
import { UserService } from 'src/user/user.service';
import { ChatResponse } from './chat.interface';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

/* <SUMMARY>
** Enable the client to communicate with the Websocket server
** by defining CORS in initializing the WebSocketGateway
** cross-origin resource
*/
@WebSocketGateway({
  cors: {
    origin: process.env.FRONT_URL,
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {

  constructor(
    private readonly chatService: ChatService,
    private readonly chatModService: ChatModService,
    private readonly chatDelService: ChatDelService,
    private readonly userService: UserService,
    private prisma: PrismaService,
  ) {}

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket): Promise<any> {
    console.log('<CHAT-HANDLE CONNECTION> client socket.id', client.id);
    const user = await this.userService.getUserFromToken(client.handshake.query.tokenJwt);
    // const user = await this.authService.getUserFromSocket(client);// other idea to get user from AUTH
    if (!user) {
      return client.disconnect();
    }
    client.data.user = user;

  }

  handleDisconnect(client: Socket): void {
    if (!client.data.user) {
      return ;
    }
  }

  /*  **************************
  **    JOIN SOCKET TO CHANNEL
  **  **************************
  */
  @SubscribeMessage('joinSocketToChannel')
  async joinSocketToChannel( @MessageBody() data: any, @ConnectedSocket() client: Socket ): Promise<ChatResponse> {

    let chatResponse: ChatResponse = {
      ok: false,
      statusText: "",
    }

    try {
      console.log('----------');
      console.log('<JOIN SOCKET TO CHANNEL> frontend data content:', data);
      console.log('<JOIN SOCKET TO CHANNEL> client socket.id', client.id);

      // check if channel exists and join client socket to it
      const channel = await this.chatService.getChannelFromDB(data.channelName);
      if (!channel) {
        console.error('Error in <joinSocketToChannel>: This channel does not exist.');
        // chatResponse.status = TOBEDEFINED_type01
        chatResponse.statusText = 'Error in <joinSocketToChannel>: This channel does not exist.';
      } else {
        await client.join(data.channelName);
        chatResponse.ok = true;
      }
      return chatResponse;

    } catch (error) {
      console.error('Error in <joinSocketToChannel>:', error);
      chatResponse.statusText = error;
      return chatResponse;
    }
  }

  /*  ***************************
  **    LEAVE SOCKET FROM CHANNEL
  **  ***************************
  */
  @SubscribeMessage('leaveSocketFromChannel')
  async leaveSocketFromChannel( @MessageBody() data: any, @ConnectedSocket() client: Socket ): Promise<ChatResponse> {

    let chatResponse: ChatResponse = {
      ok: false,
      statusText: "",
    }

    try {
      console.log('----------');
      console.log('<LEAVE SOCKET FROM CHANNEL> frontend data content:', data);
      console.log('<LEAVE SOCKET FROM CHANNEL> client socket.id', client.id);

      // check if channel exists and remove client socket to it
      const channel = await this.chatService.getChannelFromDB(data.channelName);
      if (!channel) {
        console.error('Error in <leaveSocketFromChannel>: This channel does not exist.');
        // chatResponse.status = TOBEDEFINED_type01
        chatResponse.statusText = 'Error in <leaveSocketFromChannel>: This channel does not exist.';
      } else {
        await client.leave(data.channelName);
        chatResponse.ok = true;
      }
      return chatResponse;

    } catch (error) {
      console.error('Error in <leaveSocketFromChannel>:', error);
      chatResponse.statusText = error;
      return chatResponse;
    }
  }

  /*  ******************
  **    CREATE CHANNEL
  **  ******************
  */
  @SubscribeMessage('createChannel')
  async createChannel( @MessageBody() data: any, @ConnectedSocket() client: Socket ): Promise<ChatResponse> {

    let chatResponse: ChatResponse = {
      ok: false,
      statusText: "",
    }

    try {
      console.log('----------');
      console.log('<CREATE CHANNEL> frontend data content:', data);
      console.log('<CREATE CHANNEL> client socket.id', client.id);

      // ** STEP 1 ** : get the client 'User profile' (check if client is connected first)
      const user = client.data.user;
      if (!user) {
        console.error('Error in <createChannel>: User not connected.');
        // chatResponse.status = TOBEDEFINED_type02
        chatResponse.statusText = "Error in <createChannel>: User not connected.";
        return chatResponse;
      }

      // ** STEP 2 ** : create channel (checks: validity, does not exist yet)
      const newChannel = await this.chatService.createChannelOnDB(user, data.channelName);

      // ** STEP 3 ** : join client (Websocket) to new channel by using the Socket.IO method 'join'
      await client.join(newChannel.name);

      // ** STEP 4 ** : display info to client
      this.server.emit('createdChannel', newChannel, user.nickname);
      chatResponse.ok = true;
      return chatResponse;

    } catch (error) {
      console.error('Error in <createChannel>:', error);
      // if conflict error (existing channel): open a dialog box, else: something went wrong
      if (error instanceof ConflictException) {
        chatResponse.status = 409;
        chatResponse.statusText = error.message;
        return chatResponse;
      }
      chatResponse.statusText = error;
      return chatResponse;
    }
  }

  /*  *************
  **    CREATE DM
  **  *************
  */
  @SubscribeMessage('createDm')
  async createDm(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): Promise<ChatResponse> {

    let chatResponse: ChatResponse = {
      ok: false,
      statusText: "",
    }

    try {
      console.log('----------');
      console.log('<CREATE DM> frontend data content:', data);
      console.log('<CREATE DM> client socket.id', client.id);

      // ** STEP 1 ** : get the client 'user1' profile (check if client is connected first)
      const user1 = client.data.user;
      if (!user1) {
        console.error('Error in <createDm>: User not connected.');
        // chatResponse.status = TOBEDEFINED_type02
        chatResponse.statusText = "Error in <createDm>: User not connected.";
        return chatResponse;
      }

      // ** STEP 2 ** : get the user2 'profile' (check if it exists)
      const user2 = await this.chatService.getUserFromDB(data.player);
      if (!user2) {
        console.error('Error in <createDm>: User does not exist.');
        // chatResponse.status = TOBEDEFINED_type03
        chatResponse.statusText = "Error in <createDm>: User does not exist.";
        return chatResponse;
      }

      // ** STEP 3 ** : create DM channel (checks: validity, does/does not exist) + invite user2
      const dmExists = await this.chatService.getDmFromDB(user1, user2);
      if (dmExists) {
        await this.chatService.addUserToChannel(user1, dmExists.name,'');
        await client.join(dmExists.name);
        chatResponse.ok = true;
        return chatResponse;
      }
      const newDm = await this.chatService.createDmOnDB(user1, user2);

      // ** STEP 4 ** : join client (Websocket) to new channel by using the Socket.IO method 'join'
      // no adverse effects if the client is already joined (managed by socket.io)
      await client.join(newDm.name);

      // ** STEP 5 ** : display info to client
      this.server.emit('createdDM', newDm, user1.nickname, user2.nickname);
      // check that the emit to server happens before the emit message to channel room
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for 0.5 second
      const dmInviteMsg = "DM request to " + user2.nickname + ": waiting for acceptation.";
      const notifMsg = await this.chatService.createMsgOnDB(user1, dmInviteMsg, newDm.name);
      this.server.to(newDm.name).emit('message', notifMsg);
      chatResponse.ok = true;
      return chatResponse;

    } catch (error) {
      console.error('Error in <createDm>:', error);
      chatResponse.statusText = error;
      return chatResponse;
    }
  }

  /*  *********************
  **    INVITE FOR A GAME
  **  *********************
  */
  @SubscribeMessage('inviteGame')
  async inviteGame(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): Promise<ChatResponse> {

    let chatResponse: ChatResponse = {
      ok: false,
      statusText: "",
    }

    try {
      console.log('----------');
      console.log('<INVITE GAME> front data content:', data);
      console.log('<INVITE GAME> client socket.id', client.id);

      // ** STEP 1 ** : get the client 'user1' profile (check if client is connected first)
      const user1 = client.data.user;
      if (!user1) {
        console.error('Error in <inviteGame>: User not connected.');
        // chatResponse.status = TOBEDEFINED_type02
        chatResponse.statusText = "Error in <inviteGame>: User not connected.";
        return chatResponse;
      }

      if (user1.isPlaying || !user1.online) {
        console.error('Error in <inviteGame>: User inviting is already playing another game.');
        // chatResponse.status = TOBEDEFINED_type04
        chatResponse.statusText = "Error in <inviteGame>: User inviting is already playing another game.";
        return chatResponse;
      }

      // ** STEP 2 ** : get the user2 'profile'
      const user2 = await this.chatService.getUserFromDB(data.player.nickname);
      if (!user2) {
        console.error('Error in <inviteGame>: User does not exist.');
        // chatResponse.status = TOBEDEFINED_type03
        chatResponse.statusText = "Error in <inviteGame>: User does not exist.";
        return chatResponse;
      }

      // ** STEP 3 ** : check if user2 is 'available'
      if (user2.isPlaying || !user2.online) {
        console.error('Error in <inviteGame>: User invited is already playing another game.');
        // chatResponse.status = TOBEDEFINED_type04
        chatResponse.statusText = "Error in <inviteGame>: User invited is already playing another game.";
        return chatResponse;
      }

      // ** STEP 4 ** : create DM channel (checks: validity, existence...) + invite user2
      let dm = await this.chatService.getDmFromDB(user1, user2);
      if (!dm) {
        dm = await this.chatService.createDmOnDB(user1, user2);
        await client.join(dm.name);
        this.server.emit('createdDM', dm, user1.nickname, user2.nickname);
      } else {
        await this.chatService.addUserToChannel(user1, dm.name,'');
        await client.join(dm.name);
      }

      // ** STEP 4 ** : display info to client
      this.server.emit('inviteGame', {
        gameId : data.gameId,
        host : user1.nickname,
        invited : user2.nickname,
        dmName : dm.name,
      });
      const gameInviteMsg = "Game request to " + user2.nickname + ": waiting for acceptation.";
      const notifMsg = await this.chatService.createMsgOnDB(user1, gameInviteMsg, dm.name);
      this.server.emit('message', notifMsg);
      chatResponse.ok = true;
      return chatResponse;

    } catch (error) {
      console.error('Error in <inviteGame>:', error);
      chatResponse.statusText = error;
      return chatResponse;
    }
  }

  /*  *********************
  **    FRIEND REQUEST
  **  *********************
  */
  @SubscribeMessage('friendRequest')
  async friendRequest(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): Promise<ChatResponse> {

    let chatResponse: ChatResponse = {
      ok: false,
      statusText: "",
    }

    try {
      console.log('----------');
      console.log('<FRIEND REQUEST> front data content:', data);
      console.log('<FRIEND REQUEST> client socket.id', client.id);

      // ** STEP 1 ** : get the client 'user1' profile (check if client is connected first)
      const user1 = await this.chatService.getUserFromDB(data.host);
      if (!user1) {
        console.error('Error in <friendRequest>: User not connected.');
        // chatResponse.status = TOBEDEFINED_type02
        chatResponse.statusText = "Error in <friendRequest>: User not connected.";
        return chatResponse;
      }

      // ** STEP 2 ** : get the user2 'profile' (check if it exists)
      const user2 = await this.chatService.getUserFromDB(data.player);
      if (!user2) {
        console.error('Error in <friendRequest>: User does not exist.');
        // chatResponse.status = TOBEDEFINED_type03
        chatResponse.statusText = "Error in <friendRequest>: User does not exist.";
        return chatResponse;
      }

      // ** STEP 3 ** : create DM channel (checks: validity, existence) + invite user2
      let dm = await this.chatService.getDmFromDB(user1, user2);
      if (!dm) {
        dm = await this.chatService.createDmOnDB(user1, user2);
        await client.join(dm.name);
        this.server.emit('createdDM', dm, user1.nickname, user2.nickname);
      } else {
        await this.chatService.addUserToChannel(user1, dm.name,'');
        await client.join(dm.name);
      }

      // ** STEP 4 ** : display info to client
      this.server.emit('incomingFriendRequest', {
        host : user1.nickname,
        invited : user2.nickname,
        dmName : dm.name,
      });
      const friendInviteMsg = "Friend request to " + user2.nickname + ": waiting for acceptation.";
      const notifMsg = await this.chatService.createMsgOnDB(user1, friendInviteMsg, dm.name);
      this.server.emit('message', notifMsg);

      // ** STEP 5 ** : log request
      await this.prisma.friendRequests.create({
        data: {
          user1: user1.nickname,
          user2: user2.nickname,
        },
      });
      chatResponse.ok = true;
      return chatResponse;

    } catch (error) {
      console.error('Error in <friendRequest>:', error);
      chatResponse.statusText = error;
      return chatResponse;
    }
  }

  /*  *********************
  **    REMOVE FRIEND
  **  *********************
  */
  @SubscribeMessage('removeFriend')
  async removeFriend(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): Promise<ChatResponse> {

    let chatResponse: ChatResponse = {
      ok: false,
      statusText: "",
    }

    try {
      console.log('----------');
      console.log('<REMOVE FRIEND> front data content:', data);
      console.log('<REMOVE FRIEND> client socket.id', client.id);

      // ** STEP 1 ** : get the client 'User profile' (check if client is connected first)
      const user = client.data.user;
      if (!user) {
        console.error('Error in <removeFriend>: User not connected.');
        // chatResponse.status = TOBEDEFINED_type02
        chatResponse.statusText = "Error in <removeFriend>: User not connected.";
        return chatResponse;
      }

      // ** STEP 2 ** : get the oldFriend 'profile'
      const oldFriend = await this.chatService.getUserFromDB(data.friend.nickname);
      if (!oldFriend) {
        console.error('Error in <removeFriend>: User does not exist.');
        // chatResponse.status = TOBEDEFINED_type03
        chatResponse.statusText = "Error in <removeFriend>: User does not exist.";
        return chatResponse;
      }

      // ** STEP 3 ** : removeUsersAsFriends
      const friendsList =  await this.userService.removeUsersAsFriends(user.id, oldFriend.id);
      this.server.emit('updateOnFriend');

      // ** STEP 4 ** : get DM channel
      let dm = await this.chatService.getDmFromDB(user, oldFriend);
      if (!dm) {
        console.error('Error in <removeFriend>: DM not found.');
        // chatResponse.status = TOBEDEFINED_type05
        chatResponse.statusText = "Error in <removeFriend>: DM not found.";
        return chatResponse;
      }

      // ** STEP 5 ** : display info to client
      const removeFriendMsg = user.nickname + " has been removed from friends.";
      const notifMsg = await this.chatService.createMsgOnDB(user, removeFriendMsg, dm.name);
      this.server.emit('message', notifMsg);
      chatResponse.ok = true;
      return chatResponse;

    } catch (error) {
      console.error('Error in <removeFriend>:', error);
      chatResponse.statusText = error;
      return chatResponse;
    }
  }

  /*  ****************
  **    JOIN CHANNEL
  **  ****************
  */
  @SubscribeMessage('joinChannel')
  async joinChannel(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): Promise<ChatResponse> {

    let chatResponse: ChatResponse = {
      ok: false,
      statusText: "",
    }

    try {
      console.log('----------');
      console.log('<JOIN CHANNEL> frontend data content:', data);
      console.log('<JOIN CHANNEL> client socket.id', client.id);

      // ** STEP 1 ** : get the client 'User profile' (check if client is connected first)
      const user = client.data.user;
      if (!user) {
        console.error('Error in <joinChannel>: User not connected.');
        // chatResponse.status = TOBEDEFINED_type02
        chatResponse.statusText = "Error in <joinChannel>: User not connected.";
        return chatResponse;
      }

      // ** STEP 2 ** : add user to channel (apply checks)
      const channel = await this.chatService.addUserToChannel(user, data.channelName, data.password);

      // ** STEP 3 ** : join client (Websocket) to new channel by using the Socket.IO method 'join'
      await client.join(channel.name);

      // ** STEP 4 ** : display to channel members if OK (check blocked)
      const invitOK = "Invitation accepted!";
      this.server.emit('join', channel.name, user.nickname);
      // 'data.auto === true' on automatic join after sign-in
      if (!data.auto) {
        const notifMsg = await this.chatService.createMsgOnDB(user, invitOK, channel.name);
        this.server.to(channel.name).emit('message', notifMsg);
      }

      delete(data.password);

      console.log('<post-JOIN CHAN> USER', user.nickname, 'HAS JOINED CHANNEL:', channel.name);
      chatResponse.ok = true;
      return chatResponse;

    } catch (error) {
      // if unauthorized error: open a dialog box, else: something went wrong
      console.error('Error in <joinChannel>:', error);
      if (error instanceof UnauthorizedException) {
        chatResponse.status = 401;
        chatResponse.statusText = error.message;
        return chatResponse;
      }
      chatResponse.statusText = error;
      return chatResponse;
    }
  }

  /*  ********************
  **    CREATE A MESSAGE
  **  ********************
  */
  @SubscribeMessage('createMessage')
  async createMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): Promise<ChatResponse> {

    let chatResponse: ChatResponse = {
      ok: false,
      statusText: "",
    }

    try {
      console.log('----------');
      console.log('<CREATE MSG> frontend data content:', data);
      console.log('<CREATE MSG> client socket.id', client.id);

      // ** STEP 1 ** : get the client 'User profile' (check if client is connected first)
      const user = client.data.user;
      if (!user) {
        console.error('Error in <createMessage>: User not connected.');
        // chatResponse.status = TOBEDEFINED_type02
        chatResponse.statusText = "Error in <createMessage>: User not connected.";
        return chatResponse;
      }

      // ** STEP 2 ** : create message (checks in Service)
      const message = await this.chatService.createMsgOnDB(user, data.message, data.channelName);

      // ** STEP 3 ** : display message to all channel members
      this.server.to(data.channelName).emit('message', message);

      console.log('<post-CREATE MSG> USER', user.nickname, 'HAS SENT MESSAGE "', message.text, '" ON CHANNEL', data.channelName);
      chatResponse.ok = true;
      return chatResponse;

    } catch (error) {
      console.error('Error in <createMessage>:', error);
      chatResponse.statusText = error;
      return chatResponse;
    }
  }

  /*  **************************
  **    INVITE TO JOIN CHANNEL
  **  **************************
  */
  @SubscribeMessage('inviteToChannel')
  async inviteToChannel(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): Promise<ChatResponse> {

    let chatResponse: ChatResponse = {
      ok: false,
      statusText: "",
    }

    try {
      console.log('----------');
      console.log('<INVITE TO CHANNEL> frontend data content:', data);
      console.log('<INVITE TO CHANNEL> client socket.id', client.id);

      // ** STEP 1 ** : get the client 'user1' profile (check if client is connected first)
      const user1 = client.data.user;
      if (!user1) {
        console.error('Error in <inviteToChannel>: User not connected.');
        // chatResponse.status = TOBEDEFINED_type02
        chatResponse.statusText = "Error in <inviteToChannel>: User not connected.";
        return chatResponse;
      }

      // ** STEP 2 ** : get the 'user2' profile (check if it exists)
      const user2 = await this.chatService.getUserFromDB(data.player);
      if (!user2) {
        console.error('Error in <inviteToChannel>: This player does not exist.');
        // chatResponse.status = TOBEDEFINED_type03
        chatResponse.statusText = "Error in <inviteToChannel>: This player does not exist.";
        return chatResponse;
      }

      // ** STEP 3 ** : add invitation to DB
      await this.chatService.inviteUserToChannel(user1, user2, data.channelName);

      // ** STEP 4 ** : notify members of invitation & update channel
      const chanInviteMsg = "Invitation sent to " + user2.nickname + ": waiting for acceptation.";
      const notifMsg = await this.chatService.createMsgOnDB(user1, chanInviteMsg, data.channelName, true);
      this.server.to(data.channelName).emit('message', notifMsg);
      this.server.emit('channelDetailsUpdated', data.channelName);
      console.log('<post-INVITE TO CHAN> USER:', data.player, 'IS INVITED TO JOIN CHANNEL:', data.channelName);
      chatResponse.ok = true;
      return chatResponse;

    } catch (error) {
      console.error('Error in <inviteToChannel>:', error);
      chatResponse.statusText = error;
      return chatResponse;
    }
  }

  /*  ****************
  **    SET AS ADMIN
  **  ****************
  */
  @SubscribeMessage('setAsAdmin')
  async setAsAdmin(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): Promise<ChatResponse> {

    let chatResponse: ChatResponse = {
      ok: false,
      statusText: "",
    }

    try {
      console.log('----------');
      console.log('<SET USER AS ADMIN> frontend data content:', data);
      console.log('<SET USER AS ADMIN> client socket.id', client.id);

      // ** STEP 1 ** : get the client 'user1' profile (check if client is connected first)
      const user1 = client.data.user;
      if (!user1) {
        console.error('Error in <setAsAdmin>: User not connected.');
        // chatResponse.status = TOBEDEFINED_type02
        chatResponse.statusText = "Error in <setAsAdmin>: User not connected.";
        return chatResponse;
      }

      // ** STEP 2 ** : get the 'user2' profile (check if it exists)
      const user2 = await this.chatService.getUserFromDB(data.player);
      if (!user2) {
        console.error('Error in <setAsAdmin>: This player does not exist.');
        // chatResponse.status = TOBEDEFINED_type03
        chatResponse.statusText = "Error in <setAsAdmin>: This player does not exist.";
        return chatResponse;
      }

      // ** STEP 3 ** : set as admin on DB
      await this.chatModService.setAsChannelAdminOnDB(user1, user2, data.channelName);

      // ** STEP 4 ** : display to channel
      const setAsAdminMsg = user2.nickname + " is now channel admin.";
      const notifMsg = await this.chatService.createMsgOnDB(user1, setAsAdminMsg, data.channelName);
      this.server.to(data.channelName).emit('message', notifMsg);
      this.server.to(data.channelName).emit('channelDetailsUpdated', data.channelName);
      console.log('<post-SET USER AS CHAN ADMIN> USER:', data.player, 'IS SET AS ADMIN IN CHANNEL:', data.channelName);
      chatResponse.ok = true;
      return chatResponse;

    } catch (error) {
      console.error('Error in <setAsAdmin>:', error);
      chatResponse.statusText = error;
      return chatResponse;
    }
  }

  /*  ******************
  **    UNSET AS ADMIN
  **  ******************
  */
  @SubscribeMessage('unsetAsAdmin')
  async unsetAsAdmin(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): Promise<ChatResponse> {

    let chatResponse: ChatResponse = {
      ok: false,
      statusText: "",
    }

    try {
      console.log('----------');
      console.log('<UNSET USER AS ADMIN> frontend data content:', data);
      console.log('<UNSET USER AS ADMIN> client socket.id', client.id);

      // ** STEP 1 ** : get the client 'user1' profile (check if client is connected first)
      const user1 = client.data.user;
      if (!user1) {
        console.error('Error in <unsetAsAdmin>: User not connected.');
        // chatResponse.status = TOBEDEFINED_type02
        chatResponse.statusText = "Error in <unsetAsAdmin>: User not connected.";
        return chatResponse;
      }

      // ** STEP 2 ** : get the 'user2' profile (check if it exists)
      const user2 = await this.chatService.getUserFromDB(data.player);
      if (!user2) {
        console.error('Error in <unsetAsAdmin>: This player does not exist.');
        // chatResponse.status = TOBEDEFINED_type03
        chatResponse.statusText = "Error in <unsetAsAdmin>: This player does not exist.";
        return chatResponse;
      }

      // ** STEP 3 ** : set as admin on DB
      await this.chatModService.unsetAsChannelAdminOnDB(user1, user2, data.channelName);

      // ** STEP 4 ** : display to channel
      const unsetAsAdminMsg = user2.nickname + " is not channel admin anymore.";
      const notifMsg = await this.chatService.createMsgOnDB(user1, unsetAsAdminMsg, data.channelName);
      this.server.to(data.channelName).emit('message', notifMsg);
      this.server.to(data.channelName).emit('channelDetailsUpdated', data.channelName);
      console.log('<post-USER UNSET AS CHAN ADMIN> USER:', data.player, 'IS UNSET AS ADMIN IN CHANNEL:', data.channelName);
      chatResponse.ok = true;
      return chatResponse;

    } catch (error) {
      console.error('Error in <setAsAdmin>:', error);
      chatResponse.statusText = error;
      return chatResponse;
    }
  }

  /*  *****************
  **    LEAVE CHANNEL
  **  *****************
  */
  @SubscribeMessage('leaveChannel')
	async leaveChannel(
	  @MessageBody() data: any,
	  @ConnectedSocket() client: Socket,
  ): Promise<ChatResponse> {

    let chatResponse: ChatResponse = {
      ok: false,
      statusText: "",
    }

    try {
      console.log('----------');
      console.log('<LEAVE MSG> frontend data content:', data);
      console.log('<LEAVE MSG> client socket.id', client.id);

      // ** STEP 1 ** : get the client 'User profile' (check if client is connected first)
      const user = client.data.user;
      if (!user) {
        console.error('Error in <leaveChannel>: User not connected.');
        // chatResponse.status = TOBEDEFINED_type02
        chatResponse.statusText = "Error in <leaveChannel>: User not connected.";
        return chatResponse;
      }

      // ** STEP 2 ** : unmute user before leaving the channel (to send notif)
      await this.chatModService.unmuteUserOnDB(user, data.channelName);

      // ** STEP 3 ** : notify other members about user's leaving the channel
      const byebyeMsg = user.nickname + " left";
      const notifMsg = await this.chatService.createMsgOnDB(user, byebyeMsg, data.channelName);
      this.server.to(data.channelName).emit('message', notifMsg);

      // ** STEP 4 ** : remove user from channel
      const channel = await this.chatDelService.deleteUserFromChannel(user, data.channelName);

      // ** STEP 5 ** : emit update channel details
      this.server.to(data.channelName).emit('channelDetailsUpdated', data.channelName);

      // ** STEP 6 ** : remove client (Websocket) from the channel if type is private or protected
      if (channel.type === 'PRIVATE' || channel.type === 'PROTECTED') {
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for 0.5 second
        await client.leave(data.channelName);
      }
      console.log('<post-LEAVE CHAN> USER:', user.nickname, 'HAS LEFT CHANNEL:', data.channelName);
      chatResponse.ok = true;
      return chatResponse;

    } catch (error) {
      console.error('Error in <leaveChannel>:', error);
      chatResponse.statusText = error;
      return chatResponse;
    }
  }

  /*  ******************
  **    DELETE CHANNEL
  **  ******************
  */
  // to be completed
  @SubscribeMessage('deleteChannel')
  async deleteChannel(
    @MessageBody() data: any, // Receive channel name from front-end
    @ConnectedSocket() client: Socket,
  ): Promise<ChatResponse> {

    let chatResponse: ChatResponse = {
      ok: false,
      statusText: "",
    }

    try {
      console.log('----------');
      console.log('<DELETE CHANNEL> frontend data content:', data);
      console.log('<DELETE CHANNEL> client socket.id', client.id);

      // ** STEP 1 ** : get the client 'User profile' (check if client is connected first)
      const user = client.data.user;
      if (!user) {
        console.error('Error in <deleteChannel>: User not connected.');
        // chatResponse.status = TOBEDEFINED_type02
        chatResponse.statusText = "Error in <deleteChannel>: User not connected.";
        return chatResponse;
      }

      // ** STEP 2 ** : find the channel in Prisma DB
      const channel = await this.chatService.getChannelFromDB(data.channelName);
      if (!channel) {
        console.error('Error in <deleteChannel>: This channel does not exist.');
        // chatResponse.status = TOBEDEFINED_type01
        chatResponse.statusText = "Error in <deleteChannel>: This channel does not exist.";
        return chatResponse;
      }

      // ** STEP 3 ** : notify other members about the channel's deletion
      const chanDeleteMsg = user.nickname + " is closing the channel.";
      const notifMsg = await this.chatService.createMsgOnDB(user, chanDeleteMsg, data.channelName);
      this.server.to(data.channelName).emit('message', notifMsg);

      // ** STEP 4 ** : emit a message to all clients
      this.server.emit('deletedChannel', channel);

      // ** STEP 5 ** : leave(room)
      await client.leave(data.channelName);

      // ** STEP 6 ** : delete channel
      await this.chatDelService.deleteChannelFromDB(user, channel);

      console.log('<post-DELETE CHAN> USER:', user.nickname, 'HAS DELETED CHANNEL:', data.channelName);
      chatResponse.ok = true;
      return chatResponse;

    } catch (error) {
      console.error('Error in <deleteChannel>:', error);
      chatResponse.statusText = error;
      return chatResponse;
    }
  }

  /*  ************
  **    BAN USER
  **  ************
  */
  @SubscribeMessage('banUser')
  async ban(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): Promise<ChatResponse> {

    let chatResponse: ChatResponse = {
      ok: false,
      statusText: "",
    }

    try {
      console.log('----------');
      console.log('<BAN A USER> frontend data content:', data);
      console.log('<BAN A USER> client socket.id', client.id);

      // ** STEP 1 ** : get the client 'user1' profile (check if client is connected first)
      const user1 = client.data.user;
      if (!user1) {
        console.error('Error in <banUser>: User not connected.');
        // chatResponse.status = TOBEDEFINED_type02
        chatResponse.statusText = "Error in <banUser>: User not connected.";
        return chatResponse;
      }

      // ** STEP 2 ** : get the 'user2' profile (check if it exists))
      const user2 = await this.chatService.getUserFromDB(data.player);
      if (!user2) {
        console.error('Error in <banUser>: This player does not exist.');
        // chatResponse.status = TOBEDEFINED_type03
        chatResponse.statusText = "Error in <banUser>: This player does not exist.";
        return chatResponse;
      }

      // ** STEP 3 ** : notify other members about user's leaving the channel
      const banMsg = user2.nickname + " is banned by " + user1.nickname;
      const notifMsg = await this.chatService.createMsgOnDB(user1, banMsg, data.channelName, true);
      this.server.to(data.channelName).emit('message', notifMsg);

      // ** STEP 4 ** : ban user
      const channel = await this.chatDelService.banUserOnDB(user1, user2, data.channelName);

      // ** STEP 5 ** : update channel
      this.server.to(data.channelName).emit('channelDetailsUpdated', data.channelName);

      // ** STEP 6 ** : remove client (Websocket) from the channel if type is private or protected
      if (channel.type === 'PRIVATE' || channel.type === 'PROTECTED') {
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for 0.5 second
        await client.leave(data.channelName);
      }
      console.log('<post-BAN USER FROM CHAN> USER:', user2.nickname, 'IS BANNED BY', user1.nickname, 'FROM CHANNEL:', data.channelName);
      chatResponse.ok = true;
      return chatResponse;

    } catch (error) {
      console.error('Error in <banUser>:', error);
      chatResponse.statusText = error;
      return chatResponse;
    }
  }

  /*  **************
  **    UNBAN USER
  **  **************
  */
  @SubscribeMessage('unbanUser')
  async unban(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): Promise<ChatResponse> {

    let chatResponse: ChatResponse = {
      ok: false,
      statusText: "",
    }

    try {
      console.log('----------');
      console.log('<UNBAN A USER> frontend data content:', data);
      console.log('<UNBAN A USER> client socket.id', client.id);

      // ** STEP 1 ** : get the client 'user1' profile (check if client is connected first)
      const user1 = client.data.user;
      if (!user1) {
        console.error('Error in <unbanUser>: User not connected.');
        // chatResponse.status = TOBEDEFINED_type02
        chatResponse.statusText = "Error in <unbanUser>: User not connected.";
        return chatResponse;
      }

      // ** STEP 2 ** : get the 'user2' profile (check if it exists)
      const user2 = await this.chatService.getUserFromDB(data.player);
      if (!user2) {
        console.error('Error in <unbanUser>: This player does not exist.');
        // chatResponse.status = TOBEDEFINED_type03
        chatResponse.statusText = "Error in <unbanUser>: This player does not exist.";
        return chatResponse;
      }

      // ** STEP 3 ** : unban user
      await this.chatModService.unbanUserOnDB(user1, user2, data.channelName);

      // ** STEP 4 ** : notify other members about user's being unbanned from the channel + update channel
      const unbanMsg = user2.nickname + " is unbanned by " + user1.nickname;
      const notifMsg = await this.chatService.createMsgOnDB(user1, unbanMsg, data.channelName, true);
      this.server.to(data.channelName).emit('message', notifMsg);
      this.server.to(data.channelName).emit('channelDetailsUpdated', data.channelName);
      console.log('<post-UNBAN USER FROM CHAN> USER:', user2.nickname, 'IS UNBANNED BY', user1.nickname, 'FROM CHANNEL:', data.channelName);
      chatResponse.ok = true;
      return chatResponse;

    } catch (error) {
      console.error('Error in <unbanUser>:', error);
      chatResponse.statusText = error;
      return chatResponse;
    }
  }

  /*  ***************
  **    KICK MEMBER
  **  ***************
  */
  @SubscribeMessage('kickUser')
  async kickUser(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
    ): Promise<ChatResponse> {

    let chatResponse: ChatResponse = {
      ok: false,
      statusText: "",
    }

    try {
      console.log('----------');
      console.log('<KICK A MEMBER> frontend data content:', data);
      console.log('<KICK A MEMBER> client socket.id', client.id);

      // ** STEP 1 ** : get the client 'user1' profile (check if client is connected first)
      const user1 = client.data.user;
      if (!user1) {
        console.error('Error in <kickUser>: User not connected.');
        // chatResponse.status = TOBEDEFINED_type02
        chatResponse.statusText = "Error in <kickUser>: User not connected.";
        return chatResponse;
      }

      // ** STEP 2 ** : get the 'user2' profile (check if it exists)
      const user2 = await this.chatService.getUserFromDB(data.player);
      if (!user2) {
        console.error('Error in <kickUser>: This player does not exist.');
        // chatResponse.status = TOBEDEFINED_type03
        chatResponse.statusText = "Error in <kickUser>: This player does not exist.";
        return chatResponse;
      }

      // ** STEP 3 ** : notify other members about user's leaving the channel
      const kickMsg = user2.nickname + " was kicked by " + user1.nickname;
      const notifMsg = await this.chatService.createMsgOnDB(user1, kickMsg, data.channelName, true);
      this.server.to(data.channelName).emit('message', notifMsg);

      // ** STEP 4 ** : kick user
      const channel = await this.chatDelService.kickUserOnDB(user1, user2, data.channelName);

      // ** STEP 5 ** : update channel details
      this.server.to(data.channelName).emit('channelDetailsUpdated', data.channelName);

      // ** STEP 6 ** : remove clientprivate (Websocket) from the channel if type is private or protected
      if (channel.type === 'PRIVATE' || channel.type === 'PROTECTED') {
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for 0.5 second
        await client.leave(data.channelName);
      }
      console.log('<post-KICK USER FROM CHAN> USER:', user2.nickname, 'WAS KICKED BY', user1.nickname, 'FROM CHANNEL:', data.channelName);
      chatResponse.ok = true;
      return chatResponse;

    } catch (error) {
      console.error('Error in <kickUser>:', error);
      chatResponse.statusText = error;
      return chatResponse;
    }
  }

  /*  *************
  **    MUTE USER
  **  *************
  */
  @SubscribeMessage('muteUser')
  async mute(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): Promise<ChatResponse> {

    let chatResponse: ChatResponse = {
      ok: false,
      statusText: "",
    }

    try {
      console.log('----------');
      console.log('<MUTE A USER> frontend data content:', data);
      console.log('<MUTE A USER> client socket.id', client.id);

      const MUTE_DURATION = 60000 * data.muteDuration;// Duration in milliseconds (60000ms = 1min)

      // ** STEP 1 ** : get the client 'user1' profile (check if client is connected first)
      const user1 = client.data.user;
      if (!user1) {
        console.error('Error in <muteUser>: User not connected.');
        // chatResponse.status = TOBEDEFINED_type02
        chatResponse.statusText = "Error in <muteUser>: User not connected.";
        return chatResponse;
      }

      // ** STEP 2 ** : get the 'user2' profile (check if it exists)
      const user2 = await this.chatService.getUserFromDB(data.player);
      if (!user2) {
        console.error('Error in <muteUser>: This player does not exist.');
        // chatResponse.status = TOBEDEFINED_type03
        chatResponse.statusText = "Error in <muteUser>: This player does not exist.";
        return chatResponse;
      }

      // ** STEP 3 ** : notify other members about muting a user
      const muteMsg = user2.nickname + " is muted by " + user1.nickname;
      const notifMsg = await this.chatService.createMsgOnDB(user1, muteMsg, data.channelName, true);
      this.server.to(data.channelName).emit('message', notifMsg);

      // ** STEP 4 ** : mute user and plan the 'unmute' step after the provided duration
      await this.chatModService.muteUserOnDB(user1, user2, data.channelName);
      setTimeout(() => {this.unmute(user2, data.channelName)}, MUTE_DURATION);

      // ** STEP 5 ** : update channel details
      this.server.to(data.channelName).emit('channelDetailsUpdated', data.channelName);
      console.log('<post-MUTE USER> USER:', user2.nickname, 'IS MUTED BY', user1.nickname, 'IN CHANNEL:', data.channelName);
      chatResponse.ok = true;
      return chatResponse;

    } catch (error) {
      console.error('Error in <muteUser>:', error);
      chatResponse.statusText = error;
      return chatResponse;
    }
  }

  /*  ***************
  **    UNMUTE USER
  **  ***************
  */
  @SubscribeMessage('unmuteUser')
  async unmute( user: User, channelName: string ): Promise<ChatResponse> {

    let chatResponse: ChatResponse = {
      ok: false,
      statusText: "",
    }

    try {
      console.log('----------');
      console.log('<UNMUTE A USER> frontend data content:', user);

      // ** STEP 1 ** : unmute user
      await this.chatModService.unmuteUserOnDB(user, channelName);

      // ** STEP 2 ** : notify other members about unmuting a user
      const unmuteMsg = user.nickname + " is unmuted. Time for small talk again!";
      const notifMsg = await this.chatService.createMsgOnDB(user, unmuteMsg, channelName, true);
      this.server.to(channelName).emit('message', notifMsg);

      // ** STEP 3 ** : update channel details
      this.server.to(channelName).emit('channelDetailsUpdated', channelName);
      console.log('<post-UNMUTE USER> USER:', user.nickname, 'IS UNMUTED IN CHANNEL:', channelName);
      chatResponse.ok = true;
      return chatResponse;

    } catch (error) {
      console.error('Error in <muteUser>:', error);
      chatResponse.statusText = error;
      return chatResponse;
    }
  }

  /*  **************************
  **    SET CHANNEL AS PRIVATE
  **  **************************
  */
  @SubscribeMessage('setAsPrivateChannel')
  async setAsPrivateChannel(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): Promise<ChatResponse> {

    let chatResponse: ChatResponse = {
      ok: false,
      statusText: "",
    }

    try {
      console.log('----------');
      console.log('<SET CHANNEL AS PRIVATE> frontend data content:', data);
      console.log('<SET CHANNEL AS PRIVATE> client socket.id', client.id);

      // ** STEP 1 ** : get the client 'User profile' (check if client is connected first)
      const user = client.data.user;
      if (!user) {
        console.error('Error in <setAsPrivateChannel>: User not connected.');
        // chatResponse.status = TOBEDEFINED_type02
        chatResponse.statusText = "Error in <setAsPrivateChannel>: User not connected.";
        return chatResponse;
      }

      // ** STEP 2 ** : set channel as private
      await this.chatModService.setChannelAsPrivateOnDB(user, data.channelName);

      // ** STEP 3 ** : notify other members about setting channel as private
      const chanPrivMsg = user.nickname + " has set channel as private";
      const notifMsg = await this.chatService.createMsgOnDB(user, chanPrivMsg, data.channelName);
      this.server.to(data.channelName).emit('message', notifMsg);

      // ** STEP 4 ** : update channel details
      this.server.to(data.channelName).emit('channelDetailsUpdated', data.channelName);
      this.server.emit('channelTypeUpdated', data.channelName);
      console.log('<post-SET CHAN AS PRIVATE> USER:', user.nickname, 'HAS SET CHANNEL', data.channelName, 'AS PRIVATE:');
      chatResponse.ok = true;
      return chatResponse;

    } catch (error) {
      console.error('Error in <setAsPrivateChannel>:', error);
      chatResponse.statusText = error;
      return chatResponse;
    }
  }

  /*  ****************************
  **    SET CHANNEL AS PROTECTED
  **  ****************************
  */
  @SubscribeMessage('setAsProtectedChannel')
  async setAsProtectedChannel(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): Promise<ChatResponse> {

    let chatResponse: ChatResponse = {
      ok: false,
      statusText: "",
    }

    try {
      console.log('----------');
      console.log('<SET CHANNEL AS PROTECTED> frontend data content:', data);
      console.log('<SET CHANNEL AS PROTECTED> client socket.id', client.id);

      // ** STEP 1 ** : get the client 'User profile' (check if client is connected first)
      const user = client.data.user;
      if (!user) {
        console.error('Error in <setAsProtectedChannel>: User not connected.');
        // chatResponse.status = TOBEDEFINED_type02
        chatResponse.statusText = "Error in <setAsProtectedChannel>: User not connected.";
        return chatResponse;
      }

      // ** STEP 2 ** : set channel as protected
      const isNewProtected = await this.chatModService.setChannelAsProtectedOnDB(user, data.channelName, data.password);

      // ** STEP 3 ** : notify other members about changing channel type or password
      const chanProtectedMsg = (isNewProtected) ? user.nickname + " has set channel as protected"
        : user.nickname + " has changed the password"
      const notifMsg = await this.chatService.createMsgOnDB(user, chanProtectedMsg, data.channelName);
      this.server.to(data.channelName).emit('message', notifMsg);

      // ** STEP 4 ** : update channel details
      this.server.to(data.channelName).emit('channelDetailsUpdated', data.channelName);
      this.server.emit('channelTypeUpdated', data.channelName);
      console.log('<post-SET CHAN AS PROTECTED> USER:', user.nickname, 'HAS SET CHANNEL', data.channelName, 'AS PROTECTED:');
      chatResponse.ok = true;
      return chatResponse;

    } catch (error) {
      console.error('Error in <setAsProtectedChannel>:', error);
      chatResponse.statusText = error;
      return chatResponse;
    }
  }

  /*  ***************************
  **    RESET CHANNEL AS PUBLIC
  **  ***************************
  */
  @SubscribeMessage('resetAsPublicChannel')
  async resetAsPublicChannel(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): Promise<ChatResponse> {

    let chatResponse: ChatResponse = {
      ok: false,
      statusText: "",
    }

    try {
      console.log('----------');
      console.log('<RESET CHANNEL AS PUBLIC> frontend data content:', data);
      console.log('<RESET CHANNEL AS PUBLIC> client socket.id', client.id);

     // ** STEP 1 ** : get the client 'User profile' (check if client is connected first)
      const user = client.data.user;
      if (!user) {
        console.error('Error in <resetAsPublicChannel>: User not connected.');
        // chatResponse.status = TOBEDEFINED_type02
        chatResponse.statusText = "Error in <resetAsPublicChannel>: User not connected.";
        return chatResponse;
      }

      // ** STEP 2 ** : reset channel as public
      await this.chatModService.resetChannelAsPublicOnDB(user, data.channelName);

      // ** STEP 3 ** : notify other members about reset as public
      const chanPublicMsg = user.nickname + " has set channel as public";
      const notifMsg = await this.chatService.createMsgOnDB(user, chanPublicMsg, data.channelName);
      this.server.to(data.channelName).emit('message', notifMsg);

      // ** STEP 4 ** : update channel details
      this.server.to(data.channelName).emit('channelDetailsUpdated', data.channelName);
      this.server.emit('channelTypeUpdated', data.channelName);
      console.log('<post-RESET CHAN AS PUBLIC> USER:', user.nickname, 'HAS RESET CHANNEL', data.channelName, 'AS PUBLIC:');
      chatResponse.ok = true;
      return chatResponse;

    } catch (error) {
      console.error('Error in <resetAsPublicChannel>:', error);
      chatResponse.statusText = error;
      return chatResponse;
    }
  }

  /*  ***************************
  **    CHANGE CHANNEL PASSWORD
  **  ***************************
  */
  @SubscribeMessage('changeChannelPwd')
  async changeChannelPwd(
    @MessageBody() data: any,//new password / old password ?
    @ConnectedSocket() client: Socket,
  ): Promise<ChatResponse> {

    let chatResponse: ChatResponse = {
      ok: false,
      statusText: "",
    }

    try {
      console.log('----------');
      console.log('<CHANGE CHANNEL PASSWORD> frontend data content:', data);
      console.log('<CHANGE CHANNEL PASSWORD> client socket.id', client.id);

     // ** STEP 1 ** : get the client 'User profile' (check if client is connected first)
      const user = client.data.user;
      if (!user) {
        console.error('Error in <changeChannelPwd>: User not connected.');
        // chatResponse.status = TOBEDEFINED_type02
        chatResponse.statusText = "Error in <changeChannelPwd>: User not connected.";
        return chatResponse;
      }

      // ** STEP 2 ** : change channel password
      await this.chatModService.changeChannelPwdOnDB(user, data.channelName, data.password);

      // ** STEP 3 ** : display info to channel members
      const chanPwdMsg = user.nickname + " has changed the password";
      const notifMsg = await this.chatService.createMsgOnDB(user, chanPwdMsg, data.channelName);
      this.server.to(data.channelName).emit('message', notifMsg);

      // ** STEP 4 ** : update channel
      this.server.to(data.channelName).emit('channelDetailsUpdated', data.channelName);
      console.log('<post-CHANGE CHAN PASSWORD> USER:', user.nickname, 'CHANGED PASSWORD OF CHANNEL', data.channelName);
      chatResponse.ok = true;
      return chatResponse;

    } catch (error) {
      console.error('Error in <changeChannelPwd>:', error);
      chatResponse.statusText = error;
      return chatResponse;
    }
  }

}
