/* ***** METHODS LIST ***** */
/*
  // check --> boolean

      isUserInChannel(userId: string, channelName: string): Promise<boolean>
      isUserChannelOwner(userId: string, channelName: string): Promise<boolean>
      isUserChannelAdmin(userId: string, channelName: string): Promise<boolean>
      isUserMutedInChannel(userId: string, channelName: string): Promise<boolean>
      isUserBannedFromChannel(userId: string, channelName: string): Promise<boolean>
      isPasswordCorrect(channelName: string, password: string): Promise<boolean>

  // get from DB

      getUserFromDB(nickname: string): Promise<User>
      getChannelFromDB(channelName: string): Promise<Channel>
      getDmFromDB(user1: User, user2: User): Promise<Channel>

  // update channel & user: create, add, invite

      createChannelOnDB(user: User, channelName: string): Promise<Channel>
      createDmOnDB(user1: User, user2: User): Promise<Channel>
      createMsgOnDB(user: User, messageText: string, channelName: string): Promise<MessageResponse>
      addUserToChannel(user: User, channelName: string, password: string): Promise<Channel>
      inviteUserToChannel(user1: User, user2: User, channelName: string): Promise<void>
*/
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UserService } from 'src/user/user.service';
import { Channel, User } from '@prisma/client';
import { MessageResponse } from '../chat.interface';
import * as argon from 'argon2';



@Injectable()
export class ChatService {

  private prisma: PrismaClient;

  constructor(
    private userService: UserService,

    ) {
    this.prisma = new PrismaClient();
  }

  /* ********************************************************************************
  ** check if user is in channel
  ** ********************************************************************************
  */
  async isUserInChannel(userId: string, channelName: string): Promise<boolean> {

    const channel = await this.prisma.channel.findUnique({
      where: {
        name: channelName,
        members: { some: { id: userId }},
      },
    });
    console.log('<serv-CHECK USER IS IN CHANNEL> Channel found:',
      channel?.name, '-', channel?.type);
    console.log('<serv-CHECK USER IS IN CHANNEL> Is user in channel?',
      channel ?  true : false);
    return channel ?  true : false;
   }

  /* ********************************************************************************
  ** check if user is channel owner
  ** ********************************************************************************
  */
  async isUserChannelOwner(userId: string, channelName: string): Promise<boolean> {

    const channel = await this.prisma.channel.findUnique({
       where: { name: channelName },
       include: { owner: true }
    });
    console.log('<serv-CHECK USER IS CHAN OWNER> Is user the channel owner?',
      channel?.owner.id === userId || false);
    return channel?.owner.id === userId || false;
   }

  /* ********************************************************************************
  ** check if user is channel admin
  ** ********************************************************************************
  */
  async isUserChannelAdmin(userId: string, channelName: string): Promise<boolean> {

    const channel = await this.prisma.channel.findFirst({
        where: {
            name: channelName,
            admins: { some: { id: userId } }
        }
    });
    console.log('<serv-CHECK USER IS CHAN ADMIN> Is user a channel admin?', !!channel);
    return !!channel;
   }

  /* ********************************************************************************
  ** check if user is muted in channel
  ** ********************************************************************************
  */
  async isUserMutedInChannel(userId: string, channelName: string): Promise<boolean> {

    const currentChannel = await this.prisma.channel.findUnique({
      where: { name: channelName },
      include: { members: true, invited: true, banned: true, muted: true },
    });

    const { muted } = currentChannel;
    const userIsMuted = muted.find(mute => mute.id === userId );

    console.log('<serv-CHECK USER IS MUTED IN CHAN> Is user muted in channel?',
      !!userIsMuted || false);
    if (userIsMuted)
      return true;
    return false;
  }

  /* ********************************************************************************
  ** check if user is banned from channel
  ** ********************************************************************************
  */
  async isUserBannedFromChannel(userId: string, channelName: string): Promise<boolean> {

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        bannedFrom: {
          where: { name: channelName },
        },
      },
    });
    console.log('<serv-CHECK USER IS BANNED FROM CHAN> Is user banned from channel?',
      user?.bannedFrom.length > 0 || false);
    return !!user?.bannedFrom.length;
  }

  /* ********************************************************************************
  ** check if provided password match channel one
  ** ********************************************************************************
  */
  async isPasswordCorrect(channelName: string, password: string): Promise<boolean> {

    // check if the channel exists
    const channel = await this.prisma.channel.findUnique({
      where: {
        name: channelName,
        type: 'PROTECTED',
      },
    });
    if (!channel) {
      throw new Error('This channel does not exist.');
    }

    if (!channel.hashedPwd) {
      throw new UnauthorizedException('Incorrect password');
    }
    const pwdMatches = await argon.verify(channel.hashedPwd, password);
    console.log('<serv-CHECK CHANNEL PASSWORD> Is password correct?',
      pwdMatches ? true : false);
    if (pwdMatches)
      return true;
    return false;
  }

  /* ********************************************************************************
  ** get user from database
  ** ********************************************************************************
  */
  async getUserFromDB(nickname: string): Promise<User> {

    const user = await this.prisma.user.findUnique({
      where: { nickname: nickname },
    });
    return user || null;
  }

  /* ********************************************************************************
  ** get channel from database
  ** ********************************************************************************
  */
  async getChannelFromDB(channelName: string): Promise<Channel> {

    const channel = await this.prisma.channel.findUnique({
      where: { name: channelName },
      include: {
        members: true,
        invited: true,
        messages: true,
      }
    });
    return channel || null;
  }

  /* ********************************************************************************
  ** get DM from database
  ** ********************************************************************************
  */
  async getDmFromDB(user1: User, user2: User): Promise<Channel /* | null  */> {
    const channel = await this.prisma.channel.findFirst({
      where: {
        type: 'DM',
        OR: [
          {
            members: { some: { nickname: user1.nickname } },
            invited: { some: { nickname: user2.nickname } },
          },
          {
            members: { some: { nickname: user2.nickname } },
            invited: { some: { nickname: user1.nickname } },
          },
          { AND: [
                  { members: { some: { id: user1.id }}},
                  { members: { some: { id: user2.id }}},
                  { members: { every: {
                      OR: [{ id:user1.id }, { id:user2.id }]}},
                  }
                ]
          },
        ],
      },
    });
    return channel || null;
  }

  /* ********************************************************************************
  ** create and save channel on database (public by default)
  ** ********************************************************************************
  */
  async createChannelOnDB(user: User, channelName: string): Promise<Channel> {

    // check the new channel name: not null, not empty, not undefined
    channelName = channelName.trim();
    if (!channelName) {
      throw new Error('This channel name is empty.');
    }

    // check if this channel already exists
    const channel = await this.prisma.channel.findUnique({
      where: { name: channelName },
    });
    if (channel) {
      throw new ConflictException('This channel name already exists');
    }

    // create channel in the database
    const updatedChannel = await this.prisma.channel.create({
      data: {
        name: channelName,
        owner: { connect: { id: user.id }},
        admins: { connect: [{ id: user.id }]},
        members: { connect: [{ id: user.id }]},
      },
    });

    console.log('<serv-CREATE CHAN> created channel:', updatedChannel.name,
      '-', updatedChannel.type);
    return updatedChannel;
  }

  /* ********************************************************************************
  ** create and save DM on database
  ** ********************************************************************************
  */
  async createDmOnDB(user1: User, user2: User): Promise<Channel> {

    // create DM channel in the database   
    const newDm = await this.prisma.channel.create({
      data: {
        name: "DM_" + user1.nickname + "__" + user2.nickname,
        type: 'DM',
        owner: { connect: { id: user1.id }},
        admins: { connect: { id: user1.id }},
        members: { connect: { id: user1.id }},
        invited: { connect: { id: user2.id }},
      },
      include: { members: true, invited: true }
    });

    console.log('<serv-CREATE DM> created DM:', newDm.name, '- member:',
      newDm.members[0].nickname, '& invited:', newDm.invited[0].nickname );
    return newDm;
  }

  /* ********************************************************************************
  ** create and save message on database
  ** ********************************************************************************
  */
  async createMsgOnDB(user: User, messageText: string, channelName: string,
    isAction: boolean = false): Promise<MessageResponse> {

    // check if the channel exists
    const channel = await this.prisma.channel.findUnique({
      where: { name: channelName },
    });
    if (!channel) {
      throw new Error('This channel does not exist.');
    }

    // check if the client is in the channel
    const userIsInChannel = await this.isUserInChannel(user.id, channel.name);
    if (!userIsInChannel) {
      throw new Error('Not in the channel: User not joined to this channel.');
    }

    // check if the client is muted
    const userIsMuted = await this.isUserMutedInChannel(user.id, channel.name);
    const userIsAdmin = await this.isUserChannelAdmin(user.id, channel.name);
    if (userIsMuted) {
      if (!userIsAdmin  || !isAction)
        throw new Error
          ('No permission to send a message: User is muted in this channel.');
    }

    // check if the client is banned
    const userIsBanned = await this.isUserBannedFromChannel(user.id, channel.name);
    if (userIsBanned) {
      throw new Error
          ('No permission to send a message: User is banned from this channel.');
    }

    // create message in the database
    const message = await this.prisma.msg.create({
      data: {
        text: messageText,
        author: { connect: { id: user.id } },
        channel: { connect: { name: channel.name } },
      },
      include: { author: true, channel: true },
    });

    console.log('<serv-CREATE MSG> msg content:', message.text, 'on channel:',
      message.channel.name);
    const messageResponse: MessageResponse = {
      id: message.id,
      createAt: message.createAt,
      text: message.text,
      author: message.author.nickname,
      channelName: channel.name,
      avatar: message.author.imageUrl,
    }

    return messageResponse;
  }

  /* ********************************************************************************
  ** update channel: add user to a channel (join)
  ** ********************************************************************************
  */
  async addUserToChannel(user: User, channelName: string, password: string)
  : Promise<Channel> {

    let updateData: any = {};

    // check the new channel name: not null, not empty, not undefined
    channelName = channelName.trim();
    if (!channelName) {
      throw new Error('This channel name is empty.');
    }

    // check if the channel exists
    const channel = await this.prisma.channel.findUnique({
      where: { name: channelName },
      include: { admins: true, members: true, invited: true, banned: true },
    });
    if (!channel) {
      throw new Error('This channel does not exist.');
    }

    // check if the client is already in the channel (is so, return)
    const userInChannel = await this.isUserInChannel(user.id, channelName);
    if (userInChannel) {
      return channel ;
    }

    // check if the client is banned from the channel
    if (channel?.banned?.some(banned => banned.id === user.id)) {
      throw new Error('The user is banned from this channel.');
    }

    // check channel type and start updating database
    switch (channel.type) {
      case 'DM':
        if (channel?.members?.length == 2
          || !channel?.invited?.some(invited => invited.id === user.id))
          throw new Error('The user is not invited in this DM.');
        updateData.admins = { connect: [{ id: user.id }] };
        break;
      case 'PROTECTED':
        const correctPwd = await (this.isPasswordCorrect(channelName, password));
        if (!correctPwd)
          throw new UnauthorizedException('Incorrect password');
        break;
      case 'PRIVATE':
        if (!channel?.invited?.some(invited => invited.id === user.id))
          throw new Error('The user has not been invited to this PRIVATE channel.');
        break;
      // if 'PUBLIC': go ahead
      default:
        break;
    }

    // update database
    updateData = {
      members: { connect: [{ id: user.id }] },
      invited: { disconnect: [{ id: user.id }] },
    };

    const updChannel = await this.prisma.channel.update({
      where: { id: channel.id },
      data: updateData,
      include: { admins: true, members: true, invited: true, banned: true },
    });

    const membersList = updChannel.members.map((user) => user.nickname).join(', ');
    console.log('<serv-ADD USER TO CHAN> channel:', updChannel.name,
      '-', updChannel.type, '- members:', membersList);
    return updChannel;
  }

  /* ********************************************************************************
  ** update channel & user: invite user to a channel
  ** ********************************************************************************
  **
  ** user1 = inviter
  ** user2 = to be invited
  */
  async inviteUserToChannel(user1: User, user2: User, channelName: string)
  : Promise<void> {

    const channel = await this.prisma.channel.findUnique({
      where: { name: channelName},
    });
    if (!channel) {
      console.error('Undefined channel: This channel does not exist.');
      throw new Error('Undefined channel: This channel does not exist.');
    }

    // check if user has permission to invite other users (admins)
    const user1IsAdmin = await this.isUserChannelAdmin(user1.id, channel.name);
    if (!user1IsAdmin) {
      console.error('No permission to invite users: User must be a channel admin.');
      throw new Error('No permission to invite users: User must be a channel admin.');
    }

    // check if user is already joined to the channel
    const user2InChannel = await this.isUserInChannel(user2.id, channel.name);
    if (user2InChannel) {
      console.error('User to invite already joined in the channel.');
      throw new Error('User to invite already joined in the channel.');
    }

    // update channel by inviting the user2 (to join)
    const updChannel = await this.prisma.channel.update({
      where: { id: channel.id },
      data: { invited: { connect: { id: user2.id }}},
      include: { invited: true },
    });

    const invitedList = updChannel.invited.map((user) => user.nickname).join(', ');
    console.log('<serv-INVITE USER TO CHAN> channel:', updChannel.name,
      '-', updChannel.type, '- invited users:', invitedList || 'No invitees');
    return;
  }
}
