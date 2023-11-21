/* ***** DELETING METHODS LIST ***** */
/*
  // update channel: delete

      deleteChannelFromDB(user: User, channel: Channel): Promise<void>

  // update user in channel: kick, ban/unban, delete

      kickUserOnDB(user1: User, user2: User, channelName: string): Promise<Channel>
      banUserOnDB(user1: User, user2: User, channelName: string): Promise<Channel>
      unbanUserOnDB(user1: User, user2: User, channelName: string): Promise<Channel>
      deleteUserFromChannel(user: User, channelName: string): Promise<any>// leave
      removeUserFromChannelOnDB(user: User, channelName: string): Promise<Channel>// generic
*/
import { Injectable, ConflictException } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { ChatService } from "./chat.service";
import { UserService } from "src/user/user.service";
import { Channel, User } from '@prisma/client';

@Injectable()
export class ChatDelService {
  private prisma: PrismaClient;

  constructor(
    private chatService: ChatService,
    private userService: UserService,
  ) {
    this.prisma = new PrismaClient();
  }

  /* ********************************************************************************
  ** update channel & user: kick user from a channel
  ** ********************************************************************************
  **
  ** user1 = kicker
  ** user2 = to be kicked
  */
  async kickUserOnDB(user1: User, user2: User, chanName: string): Promise<Channel> {

    // check if the channel exists
    const channel = await this.prisma.channel.findUnique({
      where: { name: chanName },
    });
    if (!channel) {
      throw new Error('This channel does not exist.');
    }

    // check if user1 has permission to kick other users (as admin)
    const user1IsAdmin = await this.chatService.isUserChannelAdmin(user1.id, chanName);
    if (!user1IsAdmin) {
      throw new Error
        ('No permission to kick another member: User must be a channel admin.');
    }

    // check if user2 is in channel
    const user2IsInChannel = await this.chatService.isUserInChannel(user2.id, chanName);
    if (!user2IsInChannel) {
      throw new Error('User to kick is not joined in the channel.');
    }

    // check if user2 is the channel owner (cannot be kicked)
    const user2IsChanOwner = await this.chatService.isUserChannelOwner(user2.id, chanName);
    if (user2IsChanOwner) {
      throw new Error('Channel owner cannot be kicked.');
    }

    const updatedChannel = await this.removeUserFromChannelOnDB(user2, chanName);

    console.log('<serv-KICK USER FROM CHAN> channel:', updatedChannel.name,
      '-', updatedChannel.type);
    return updatedChannel;
  }

  /* ********************************************************************************
  ** update channel & user: ban user from a channel
  ** ********************************************************************************
  **
  ** user1 = banner
  ** user2 = to be banned
  */
  async banUserOnDB(user1: User, user2: User, chanName: string): Promise<Channel> {

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

    // check if user2 is in channel
    const user2IsInChannel = await this.chatService.isUserInChannel(user2.id, chanName);
    if (!user2IsInChannel) {
      throw new Error('User to ban is not joined in the channel.');
    }

    // check if user2 is the channel owner (cannot be kicked)
    const user2IsOwner = await this.chatService.isUserChannelOwner(user2.id, chanName);
    if (user2IsOwner) {
      throw new Error('Channel owner cannot be banned.');
    }

    // check if the user2 is already banned from the channel.
    if (channel?.banned?.some(banned => banned.id === user2.id)) {
      throw new Error('The user is already banned from this channel.');
    }

    const tempChannel = await this.removeUserFromChannelOnDB(user2, chanName);

    const updChannel = await this.prisma.channel.update({
      where: { id: tempChannel.id },
      data: { banned: { connect: { id: user2.id } } },
      include: {
        admins: true, members: true, invited: true, banned: true, muted: true,
      }
    });

    const bannedList = updChannel.banned.map((user) => user.nickname).join(', ');
    console.log('<serv-BAN USER FROM CHAN> channel:', updChannel.name,
      '-', updChannel.type, '- banned users:', bannedList || 'No banned users');
    return updChannel;
}

  /* ********************************************************************************
  ** update channel & user: delete user (leave channel)
  ** ********************************************************************************
  */
  async deleteUserFromChannel(user: User, chanName: string): Promise<any> {

    // check if the channel exists
    const channel = await this.prisma.channel.findUnique({
      where: { name: chanName },
    });
    if (!channel) {
      throw new Error('This channel does not exist.');
    }

    // check if user to remove is joined to the channel
    const userIsInChannel = await this.chatService.isUserInChannel(user.id, chanName);
    if (!userIsInChannel) {
      throw new Error('User to remove is not in the channel.');
    }

    // check if user is the channel owner --> delete the channel
    const userIsChanOwner = await this.chatService.isUserChannelOwner(user.id, chanName);
    if (userIsChanOwner) {
      await this.deleteChannelFromDB(user, channel);
      return;
    }

    const updatedChannel = await this.removeUserFromChannelOnDB(user, chanName);

    console.log('<serv-DELETE USER FROM CHAN (leave)> channel:', updatedChannel.name,
      '-', updatedChannel.type);
    return updatedChannel;
  }

  /* ********************************************************************************
  ** update channel & user: remove user on DB (called by leave channel, kick user...)
  ** ********************************************************************************
  */
  async removeUserFromChannelOnDB(user: User, channelName: string): Promise<Channel> {

    let updateData: any = {};

    // check if the channel exists
    const channel = await this.prisma.channel.findUnique({
      where: { name: channelName },
      include: {
        admins: true,
        members: true,
        invited: true,
        muted: true,
        banned: true,
        messages: true,
      }
    });
    if (!channel) {
      throw new Error('This channel does not exist.');
    }

    // check if the user is muted in channel and remove from muted list, if applicable
    if (channel.muted.find(mute => mute.id === user.id)) {
        updateData.muted = { disconnect: { id: user.id } };
    }

    // update channel by removing the user as admin and as member
    if (channel.admins.some(admin => admin.id === user.id)) {
      updateData.admins = { disconnect: { id: user.id } };
    }
    updateData.members = { disconnect: { id: user.id } };

    const updChannel = await this.prisma.channel.update({
      where: { id: channel.id },
      data: updateData,
      include: {
        admins: true,
        members: true,
        invited: true,
        muted: true,
        banned: true,
      }
    });

    const membersList = updChannel.members.map((user) => user.nickname).join(', ');
    console.log('<serv-REMOVE USER FROM CHAN (leave, kick...)> channel:',
      updChannel.name, '-', updChannel.type, '- members:', membersList);
    return updChannel;
  }

  /* ********************************************************************************
  ** delete channel from database
  ** ********************************************************************************
  */
  async deleteChannelFromDB(user: User, channel: Channel): Promise<void> {

    const channelNameToDelete = channel.name;
    const channelToDelete = await this.prisma.channel.findUnique({
      where: { name: channel.name },
      include: {
        admins: true,
        members: true,
        invited: true,
        muted: true,
        banned: true,
        messages: true,
      }
    });
    const { admins, members, invited, muted, banned } = channelToDelete;

    // check if user has permission to delete the channel (ownership)
    const userIsOwner = await this.chatService.isUserChannelOwner(user.id, channel.name);
    if (!userIsOwner) {
      console.error('Error in <deleteChannel>: No permission - ');
      console.error('User must be the channel owner.');
      throw new Error
        ('No permission to delete the channel: User must be the channel owner.');
    }

    if (channelToDelete) {
      // delete messages associated with the channel in the database
      await this.prisma.msg.deleteMany({
        where: { channelId: channelToDelete.id },
      });

      // disconnect relations before deleting the channel
      await this.prisma.channel.update({
        where: { id: channel.id },
        data: {
          banned: { disconnect: banned.map((banned) => ({ id: banned.id }))},
          muted: { disconnect: muted.map((muted) => ({ id: muted.id }))},
          invited: { disconnect: invited.map((invited) => ({ id: invited.id }))},
          members: { disconnect: members.map((members) => ({ id: members.id }))},
          admins: { disconnect: admins.map((admins) => ({ id: admins.id }))},
        },
      });

      // delete channel from the database
      await this.prisma.channel.delete({
        where: { id: channel.id },
      });
    }

    console.log('<serv-DELETE CHAN> deleted channel:', channelNameToDelete);
    return ;
  }
}
