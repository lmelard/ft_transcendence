/* ***** MODIFYING METHODS LIST ***** */
/*
  // update channel: change type/password

      setChannelAsProtectedOnDB(user: User, channelName: string, password: string): Promise<Channel>
      setChannelAsPrivateOnDB(user: User, channelName: string): Promise<Channel>
      resetChannelAsPublicOnDB(user: User, channelName: string): Promise<Channel>
      changeChannelPwdOnDB(user: User, channelName: string, newPwd: string): Promise<Channel>

  // update user in channel: set/unset as admin, mute/unmute, unban

      setAsChannelAdminOnDB(user1: User, user2: User, channelName: string): Promise<void>
      unsetAsChannelAdminOnDB(user1: User, user2: User, channelName: string): Promise<void>
      muteUserOnDB(user1: User, user2: User, channelName: string): Promise<void>
      unmuteUserOnDB(user: User, channelName: string): Promise<void>
*/
import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { ChatService } from "./chat.service";
import { UserService } from "src/user/user.service";
import { Channel, User } from '@prisma/client';
import * as argon from 'argon2';

@Injectable()
export class ChatModService {
  private prisma: PrismaClient;

  constructor(private chatService: ChatService) {
    this.prisma = new PrismaClient();
  }

  /* ********************************************************************************
  ** update channel: set channel as protected
  ** ********************************************************************************
  */
  async setChannelAsProtectedOnDB(user: User, channelName: string, password: string)
  : Promise<boolean> {

    let hash: string;
    let isNewProtectedChannel: boolean = true;

    // check if the channel exists
    const channel = await this.prisma.channel.findUnique({
      where: { name: channelName },
    });
    if (!channel) {
      throw new Error('This channel does not exist.');
    }
    console.log('<serv-SET CHAN AS PROTECTED> channel type was:', channel.type);

    // check if user has permission to set a channel as private (ownership)
    const userIsOwner = await this.chatService.isUserChannelOwner(user.id, channelName);
    if (!userIsOwner) {
      throw new Error
        ('No permission to set channel type: User must be the channel owner.');
    }

    // check type of channel to set
    switch (channel.type) {
      // if 'DM': type cannot be changed
      case 'DM':
        throw new Error('No permission to set channel type: DM cannot be changed.');
      case 'PRIVATE':
        break;
      case 'PUBLIC':
        break;
      // if already 'PROTECTED': check if the password has changed
      default:
        isNewProtectedChannel = false;
        break;
    }

    if (!password) {
      throw new Error("Channel must have a password to be of 'protected' type.");
    }
    hash = await argon.hash(password);

    // update channel by setting the channel type as 'PROTECTED' in DB
    const updatedChannel = await this.prisma.channel.update({
      where: { id: channel.id },
      data: {
        type: 'PROTECTED',
        hashedPwd: hash,
      },
    });
    console.log('<serv-SET CHAN AS PROTECTED> channel type is now:',
      updatedChannel.type);

    return isNewProtectedChannel;
  }

  /* ********************************************************************************
  ** update channel: set channel as private
  ** ********************************************************************************
  */
  async setChannelAsPrivateOnDB(user: User, channelName: string): Promise<Channel> {

    let updateData: any = {};

    // check if the channel exists
    const channel = await this.prisma.channel.findUnique({
      where: { name: channelName },
    });
    if (!channel) {
      throw new Error('This channel does not exist.');
    }
    console.log('<serv-SET CHAN AS PROTECTED> channel type was:', channel.type);

    // check if user has permission to set a channel as private (ownership)
    const userIsOwner = await this.chatService.isUserChannelOwner(user.id, channelName);
    if (!userIsOwner) {
      throw new Error
        ('No permission to set channel type: User must be the channel owner.');
    }

    // check type of channel to set
    switch (channel.type) {
      // if 'DM': type cannot be changed
      case 'DM':
        throw new Error('No permission to set channel type: DM cannot be changed.');
      case 'PUBLIC':
        break;
      // if 'PROTECTED': delete password
      case 'PROTECTED':
        updateData.hashedPwd = null;
        break;
      // if already 'PRIVATE': do nothing, return current channel as is
      default:
        return channel;
    }
    updateData.type = 'PRIVATE';

    // update channel by setting the channel type as 'PRIVATE' in DB
    const updatedChannel = await this.prisma.channel.update({
      where: { id: channel.id },
      data: updateData,
      // include: { members: true },
    });
    console.log('<serv-SET CHAN AS PRIVATE> channel type is now:',
      updatedChannel.type);

    return updatedChannel;
  }

  /* ********************************************************************************
  ** update channel: reset channel as public
  ** ********************************************************************************
  */
  async resetChannelAsPublicOnDB(user: User, channelName: string): Promise<Channel> {

    let updateData: any = {};

    // check if the channel exists
    const channel = await this.prisma.channel.findUnique({
      where: { name: channelName },
    });
    if (!channel) {
      throw new Error('This channel does not exist.');
    }
    console.log('<serv-SET CHAN AS PUBLIC> channel type was:', channel.type);

    // check if user has permission to reset a channel as public (ownership)
    const userIsOwner = await this.chatService.isUserChannelOwner(user.id, channelName);
    if (!userIsOwner) {
      throw new Error
        ('No permission to set channel type: User must be the channel owner.');
    }

    // check type of channel to set
     switch (channel.type) {
      // if 'DM': type cannot be changed
      case 'DM':
        throw new Error('No permission to set channel type: DM cannot be changed.');
      // if 'PROTECTED': delete password
      case 'PRIVATE':
        break;
      case 'PROTECTED':
        updateData.hashedPwd = null;
        break;
      // if already 'PUBLIC': do nothing, return current channel as is
      default:
        return channel;
    }
    updateData.type = 'PUBLIC';

    // update channel by setting the channel type as 'PUBLIC' in DB
    const updatedChannel = await this.prisma.channel.update({
      where: { id: channel.id },
      data: updateData,
    });
    console.log('<serv-SET CHAN AS PUBLIC> channel type is now:',
      updatedChannel.type);

    return updatedChannel;
  }

  /* ********************************************************************************
  ** update channel: change password for 'protected' channel
  ** ********************************************************************************
  */
  async changeChannelPwdOnDB(user: User, channelName: string, newPwd: string)
  : Promise<Channel> {

    let hash: string;

    // check if the channel exists
    const channel = await this.prisma.channel.findUnique({
      where: { name: channelName },
    });
    if (!channel) {
      throw new Error('This channel does not exist.');
    }

    // check if user has permission to modify the password (ownership)
    const userIsOwner = await this.chatService.isUserChannelOwner(user.id, channelName);
    if (!userIsOwner) {
      throw new Error
        ('No permission to modify the password: User must be the channel owner.');
    }

    // check if the channel is set as protected
    if (channel.type !== 'PROTECTED') {
      throw new Error("Channel must be of 'protected' type to have a password.");
    }

    // change the pwd
    if (!newPwd) {
      throw new Error("Channel must have a password to be of 'protected' type.");
    }
    hash = await argon.hash(newPwd);

    // update channel by changing the channel password in DB
    const updatedChannel = await this.prisma.channel.update({
      where: { id: channel.id },
      data: { hashedPwd: hash },
    });

    console.log('<serv-CHANGE CHANNEL PASSWORD> channel:', updatedChannel.name,
      '-', updatedChannel.type);
    return updatedChannel;
  }
  /* ********************************************************************************
  ** update channel & user: set other users as channel admin
  ** ********************************************************************************
  **
  ** user1 = setter (owner)
  ** user2 = to be set as admin
  */
  async setAsChannelAdminOnDB(user1: User, user2: User, chanName: string)
  : Promise<void> {

    // check if the channel exists
    const channel = await this.prisma.channel.findUnique({
      where: { name: chanName },
      include: { admins: true }
    });
    if (!channel) {
      throw new Error('This channel does not exist.');
    }

    // check if user has permission to set other users as admins (ownership)
    const userIsOwner = await this.chatService.isUserChannelOwner(user1.id, chanName);
    if (!userIsOwner) {
      throw new Error
        ('No permission to set users as admins: User must be the channel owner.');
    }

    // check if user to set as admin is joined to the channel
    const user2InChannel = await this.chatService.isUserInChannel(user2.id, chanName);
    if (!user2InChannel) {
      throw new Error('User to set as admin is not in the channel.');
    }

    // check if user to set as admin is already admin in the channel
    const user2IsAdmin = await this.chatService.isUserChannelAdmin(user2.id, chanName);
    if (user2IsAdmin) {
      return;
    }

    // update channel by setting the user2 as admin in DB
    const updChannel = await this.prisma.channel.update({
      where: { id: channel.id },
      data: { admins: { connect: { id: user2.id }}},
      include: { admins: true },
    });

    const adminsList = updChannel.admins.map((user) => user.nickname).join(', ');
    console.log('<serv-SET USER AS CHAN ADMIN> channel:', updChannel.name,
      '-', updChannel.type, '- chan admins:', adminsList || 'No chan admins');
    return;
  }

  /* ********************************************************************************
  ** update channel & user: unset other user as channel admin
  ** ********************************************************************************
  **
  ** user1 = setter (owner)
  ** user2 = to be unset as admin
  */
  async unsetAsChannelAdminOnDB(user1: User, user2: User, chanName: string)
  : Promise<void> {

    // check if the channel exists
    const channel = await this.prisma.channel.findUnique({
      where: { name: chanName },
      include: { admins: true, members: true }
    });
    if (!channel) {
      throw new Error('This channel does not exist.');
    }

    // check if user1 has permission to unset other users as admins (ownership)
    const userIsOwner = await this.chatService.isUserChannelOwner(user1.id, chanName);
    if (!userIsOwner) {
      throw new Error
        ('No permission to set users as admins: User must be the channel owner.');
    }

    // check if user2 to unset as admin is joined to the channel
    const user2IsInChannel = await this.chatService.isUserInChannel(user2.id, chanName);
    if (!user2IsInChannel) {
      throw new Error('User to set as admin is not in the channel.');
    }

    // check if user to unset as admin is already admin in the channel
    const user2IsAdmin = await this.chatService.isUserChannelAdmin(user2.id, chanName);
    if (!user2IsAdmin) {
      return;
    }

    // update channel by unsetting the user2 as admin in DB
    const updChannel = await this.prisma.channel.update({
      where: { id: channel.id },
      data: { admins: { disconnect: { id: user2.id }}},
      include: { admins: true },
    });

    const adminsList = updChannel.admins.map((user) => user.nickname).join(', ');
    console.log('<serv-UNSET USER AS CHAN ADMIN> channel:', updChannel.name,
      '-', updChannel.type, '- admins:', adminsList || 'No chan admins');
    return;
  }

  /* ********************************************************************************
  ** update channel & user: mute user in a channel
  ** ********************************************************************************
  **
  ** user1 = muter
  ** user2 = to be muted
  */
  async muteUserOnDB(user1: User, user2: User, chanName: string): Promise<any> {

    // get channel id
    const currentChannel = await this.prisma.channel.findUnique({
      where: { name: chanName },
      // include: { members: true, invited: true, banned: true, muted: true },
    });

    // check if user1 (muter) has permission to mute/unmute other users (as admin)
    const user1IsAdmin = await this.chatService.isUserChannelAdmin(user1.id, chanName);
    if (!user1IsAdmin) {
      console.error('Error in <muteUser>: User must be a channel admin.');
      throw new Error
        ('No permission to mute another member: User must be a channel admin.');
    }

    // check if user2 (to be muted) is in channel
    const user2InChannel = await this.chatService.isUserInChannel(user2.id, chanName);
    if (!user2InChannel) {
      console.error('Error in <muteUser>: User to mute is not in the channel.');
      throw new Error('User to mute is not joined in the channel.');
    }

    // check if user2 (to be muted) is the channel owner (cannot be muted)
    const user2IsOwner = await this.chatService.isUserChannelOwner(user2.id, chanName);
    if (user2IsOwner) {
      console.error('Error in <muteUser>: Channel owner cannot be muted.');
      throw new Error('Channel owner cannot be muted.');
    }

    // Check if the user2 (to be muted) is already muted --> do nothing
    const user2IsMuted = await this.chatService.isUserMutedInChannel(user2.id, chanName);
    if (user2IsMuted) {
      console.error('Error in <muteUser>: User to mute is already muted.');
      throw new Error('User to mute is already muted in the channel.');
    }

    // mute the user on DB (and set a function to be triggered later)
    const updatedChannel = await this.prisma.channel.update({
      where: { id: currentChannel.id },
      data: { muted: { connect: { id: user2.id } } },
      include: { muted: true }
    });

    const mutedList = updatedChannel.muted.map((user) => user.nickname).join(', ');
    console.log('<serv-MUTE USER FROM CHAN> channel:', updatedChannel.name,
      '-', updatedChannel.type, '- muted users:', mutedList || 'No muted users');
    return;
  }

  /* ********************************************************************************
  ** update channel & user: unmute user in a channel
  ** ********************************************************************************
  */
  async unmuteUserOnDB(user: User, chanName: string): Promise<void> {

    // check if channel exists
    const channel = await this.prisma.channel.findUnique({
      where: { name: chanName},
      include: { muted: true }
    });
    if (!channel) {
      console.error('Undefined channel: This channel does not exist.');
      throw new Error('Undefined channel: This channel does not exist.');
    }

    // check if user is joined to the channel
    const userInChannel = await this.chatService.isUserInChannel(user.id, channel.name);
    if (!userInChannel) {
      console.error('User to unmute is not joined in the channel.');
      return;
    }

    // check if user is already unmute
    const userIsMuted = await this.chatService.isUserMutedInChannel(user.id, chanName);
    if (!userIsMuted) {
      console.error('User to unmute is already unmuted.');
      return;
    }

    const updatedChannel = await this.prisma.channel.update({
      where: { name: chanName },
      data: { muted: { disconnect: { id: user.id } } },
      include: {members: true, muted: true },
    });

    const mutedList = updatedChannel.muted.map((user) => user.nickname).join(', ');
    console.log('<serv-UNMUTE USER FROM CHAN> channel:', updatedChannel.name,
      '-', updatedChannel.type, '- muted users:', mutedList || 'No muted users');
    return;
  }

  /* ********************************************************************************
  ** update channel & user: unban user from a channel
  ** ********************************************************************************
  **
  ** user1 = unbanner
  ** user2 = to be unbanned
  */
  async unbanUserOnDB(user1: User, user2: User, chanName: string): Promise<Channel> {

    // check if the channel exists
    const channel = await this.prisma.channel.findUnique({
      where: { name: chanName },
      include: {
        admins: true, members: true, invited: true, banned: true, muted: true,
      }
    });
    if (!channel) {
      throw new Error('This channel does not exist.');
    }

    // check if user1 has permission to ban other users (as admin)
    const user1IsAdmin = await this.chatService.isUserChannelAdmin(user1.id, chanName);
    if (!user1IsAdmin) {
      throw new Error
        ('No permission to ban another member: User must be a channel admin.');
    }

    // check if user2 is banned from the channel
    const user2IsBanned = await this.chatService.isUserBannedFromChannel(user2.id, chanName);
    if (!user2IsBanned) {
      throw new Error('Cannot unban user2: user2 is not banned from this channel.');
    }

    const updChannel = await this.prisma.channel.update({
      where: { id: channel.id },
      data: { banned: { disconnect: { id: user2.id } } },
      include: {
        admins: true, members: true, invited: true, banned: true, muted: true ,
      }
    });

    const bannedList = updChannel.banned.map((user) => user.nickname).join(', ');
    console.log('<serv-UNBAN USER FROM CHAN> channel:', updChannel.name,
      '-', updChannel.type, '- banned users:', bannedList || 'No banned users');
    return updChannel;
  }
}
