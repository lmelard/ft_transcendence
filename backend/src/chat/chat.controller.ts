  /* ***** QUERIES LIST - START ***** */
  /*
  // list of users to display into channel details

        getChannelAdmins(@Query() params: any): Promise<User[]>
        getChannelMembers(@Query() params: any): Promise<User[]>
        getChannelInvited(@Query() params: any): Promise<User[]>
        getChannelMuted(@Query() params: any): Promise<User[]>
        getChannelBanned(@Query() params: any): Promise<User[]>

  // list of users to select in channel details (exclude user themselves)

        getChannelAdminables(@Query() params: any): Promise<User[]>
        getChannelUnadminables(@GetUser() user: User, @Query() params: any): Promise<User[]>
        getChannelInvitables(@Query() params: any): Promise<User[]>
        getChannelKickables(@GetUser() user: User, @Query() params: any): Promise<User[]>
        getChannelMutables(@Query() params: any): Promise<User[]>
        getChannelBannables(@Query() params: any): Promise<User[]>
        getUserDMables(@Query() params: any): Promise<User[]>

  // list of channels depending on their type (public, private, protected)

        getPublicChannels(@Body() channel: Channel): Promise<Channel[]>
        getPrivateChannels(@Body() channel: Channel): Promise<Channel[]>
        getProtectedChannels(@Body() channel: Channel): Promise<Channel[]>

  // list of channels depending on their type for a specific user

        getUserChannels(@Query() params: any): Promise<Channel[]>
        getUserDMs(@Query() params: any): Promise<ChannelDM[]>
        getUserPrivateChannels(@Query() params: any): Promise<Channel[]>
        getUserProtectedChannels(@Query() params: any): Promise<Channel[]>
        getUserChannelsWithNewMsg(@Query() params: any): Promise<string[]>

  // info for a specific channel

        getChannelDetails(@Query() params: any): Promise<Channel>
        getChannelMsg(@Query() params: any): Promise<MessageResponse[]>

  */
  /* ***** QUERIES LIST - END ***** */

import { Controller, Get, Body, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User, Channel } from '@prisma/client';
import { JwtAuthGuard } from 'src/user/guard';
import { ChannelDM, MessageResponse } from './chat.interface';
import { GetUser } from 'src/user/decorator';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /* ********************************************************************************
  ** list of users to display into channel details
  ** ********************************************************************************
  */
  // list of admins for a specific channel sorted in ascending order
  @Get('channelAdmins')
  async getChannelAdmins(@Query() params: any): Promise<User[]> {
    try {
      const currentChannel = await this.prisma.channel.findUnique({
        where: { id: params.channelId },
        include: {
          admins: {
            orderBy: { nickname: 'asc' },
          },
        },
      });
      if (!currentChannel) { throw new Error('This channel does not exist.') };
	    return currentChannel.admins || [];

    } catch (error) {
      console.error('Failed to fetch channel admins:', error);
      throw error;
    }
  }

  // list of members for a specific channel sorted in ascending order
  @Get('channelMembers')
  async getChannelMembers(@Query() params: any): Promise<User[]> {
    try {
      const currentChannel = await this.prisma.channel.findUnique({
        where: { id: params.channelId },
        include: {
          members: {
            orderBy: { nickname: 'asc' },
          },
        },
      });
      if (!currentChannel) { throw new Error('This channel does not exist.') };
      return currentChannel.members || [];

    } catch (error) {
      console.error('Failed to fetch channel members:', error);
      throw error;
    }
  }

  // list of invited users for a specific channel sorted in ascending order
  @Get('channelInvited')
  async getChannelInvited(@Query() params: any): Promise<User[]> {
    try {
      const currentChannel = await this.prisma.channel.findUnique({
        where: { id: params.channelId },
        include: {
          invited: {
            orderBy: { nickname: 'asc' },
          },
        },
      });
      return currentChannel?.invited || [];

    } catch (error) {
      console.error('Failed to fetch channel invited users:', error);
      throw error;
    }
  }

  // list of muted users in a specific channel sorted in ascending order
  @Get('channelMuted')
  async getChannelMuted(@Query() params: any): Promise<User[]> {
    try {
      const currentChannel = await this.prisma.channel.findUnique({
        where: { id: params.channelId },
        include: {
          muted: {
            orderBy: { nickname: 'asc' },
          },
        },
      });
      return currentChannel?.muted || [];

    } catch (error) {
      console.error('Failed to fetch channel muted users:', error);
      throw error;
    }
  }

  // list of banned users in a specific channel sorted in ascending order
  @Get('channelBanned')
  async getChannelBanned(@Query() params: any): Promise<User[]> {
    try {
      const currentChannel = await this.prisma.channel.findUnique({
        where: { id: params.channelId },
        include: {
          banned: {
            orderBy: { nickname: 'asc' },
          },
        },
      });
      return currentChannel?.banned || [];

    } catch (error) {
      console.error('Failed to fetch channel banned users:', error);
      throw error;
    }
  }

  /* ********************************************************************************
  ** list of users to select in channel details (exclude user themselves)
  ** ********************************************************************************
  */
  // list of 'adminable' users in a specific channel (must be members, but not admins yet)
  @Get('channelAdminables')
  async getChannelAdminables(@Query() params: any): Promise<User[]> {
    try {
      // list of admins and members on a specfic channel
      const currentChannel = await this.prisma.channel.findUnique({
        where: { id: params.channelId },
        include: {
          admins: { orderBy: { nickname: 'asc' } },
          members: { orderBy: { nickname: 'asc' } },
        },
      });
      if (!currentChannel) { throw new Error('This channel does not exist.') };

      // Destructuring is a powerful feature in JavaScript and TypeScript
      // --> extracts multiple properties from an element and assign them to variable
      // --> can be used on objects, arrays, function parameters and other data structures
      const { admins, members } = currentChannel;
      const nonAdmins = members.filter(member => !admins.some(admin => admin.id === member.id));
      return nonAdmins.length > 0 ? nonAdmins : [];

    } catch (error) {
      console.error("Failed to fetch channel 'adminable' users:", error);
      throw error;
    }
  }

  // list of 'unadminable' users in a specific channel (must be admins, but not user themselves)
  @Get('channelUnadminables')
  async getChannelUnadminables(@GetUser() user: User, @Query() params: any): Promise<User[]> {
    try {
      // list of admins on a specfic channel
      const currentChannel = await this.prisma.channel.findUnique({
        where: { id: params.channelId },
        include: {
          admins: { orderBy: { nickname: 'asc' } },
          owner: true,
        },
      });
      if (!currentChannel) { throw new Error('This channel does not exist.') };

      const { admins, owner } = currentChannel;
      const unadminables = admins.filter(admin => admin.id !== user.id && admin.id !== owner.id);
      return unadminables.length > 0 ? unadminables : [];

    } catch (error) {
      console.error("Failed to fetch channel 'unadminable' users:", error);
      throw error;
    }
  }

  // list of 'invitable' users in a specific channel (not members, not invited yet and not banned)
  @Get('channelInvitables')
  async getChannelInvitables(@Query() params: any): Promise<User[]> {
    try {
      // list of all users signep up in the server (except default user)
      const allUsers = await this.prisma.user.findMany({
        orderBy: { nickname: 'asc' },
        where: {
          NOT: { nickname: '__defaultUser__' }
        },
      });

      // list of members and invited users on the specific channel
      const currentChannel = await this.prisma.channel.findUnique({
        where: { id: params.channelId },
        include: { members: true, invited: true, banned: true },
      });
      if (!currentChannel) { throw new Error('This channel does not exist.') };

      const channelUsers = [...currentChannel.members, ...currentChannel.invited, ...currentChannel.banned];
      const channelInvitables = allUsers.filter((user) => !channelUsers.some((member) => member.id === user.id));
      const sortedInvitables = channelInvitables.sort((a, b) => (a.nickname > b.nickname ? 1 : -1));
      return sortedInvitables || [];

    } catch (error) {
      console.error("Failed to fetch channel 'invitable' users:", error);
      throw error;
    }
  }

  // list of 'kickable' users in a specific channel (members and not owner, not user themselves)
  @Get('channelKickables')
  async getChannelKickables(@GetUser() user: User, @Query() params: any): Promise<User[]> {
    try {
       // list of members on a specfic channel
       const currentChannel = await this.prisma.channel.findUnique({
        where: { id: params.channelId },
        include: {
          owner: true,
          members: {
            where: { NOT: { id: user.id } },
            orderBy: { nickname: 'asc' } },
        },
      });
      if (!currentChannel) { throw new Error('This channel does not exist.') };

      const channelKickables = currentChannel.members.filter((user) => {
        if (user.id === currentChannel.owner.id)
          return false;
        return true;
      });
      return channelKickables || [];

    } catch (error) {
      console.error("Failed to fetch channel 'kickable' users:", error);
      throw error;
    }
  }

  // list of 'Mutable' users for a specific user sorted in ascending order
  // (must be member, not muted yet, not owner and not user themselves)
  @Get('channelMutables')
  async getChannelMutables(@GetUser() user: User, @Query() params: any): Promise<User[]> {
    try {
      const currentChannel = await this.prisma.channel.findUnique({
        where: { id: params.channelId },
        include: {
          owner: true,
          members: {
            where: { NOT: { id: user.id } },
            orderBy: { nickname: 'asc' },
          },
          muted:  {
            where: { NOT: { id: user.id } },
            orderBy: { nickname: 'asc' },
          },
        },
      });
      if (!currentChannel) { throw new Error('This channel does not exist.') };

      const { owner, members, muted } = currentChannel;
      const ownerAndMuted = [owner, ...muted];
      const channelMutables = members.filter(member => !ownerAndMuted.some(muted => muted.id === member.id));
      return channelMutables || [];

    } catch (error) {
      console.error("Failed to fetch 'mutable' users of the user:", error);
      throw error;
    }
  }

  // list of 'bannable' users in a specific channel
  // (must be members, but not owner and not user themselves)
  @Get('channelBannables')
  async getChannelBannables(@GetUser() user: User, @Query() params: any): Promise<User[]> {
    try {
      const currentChannel = await this.prisma.channel.findUnique({
        where: { id: params.channelId },
        include: {
          owner: true,
          members: {
            where: { NOT: { id: user.id } }, // Exclude the user with the specified userId
            orderBy: { nickname: 'asc' },
          },
        },
      });
      if (!currentChannel) { throw new Error('This channel does not exist.') };

      const { members, owner } = currentChannel;
      // Filter out both the owner and the user with the specified userId
      const channelBannables = members.filter(member => member.id !== owner.id);
      return channelBannables.length > 0 ? channelBannables : [];

    } catch (error) {
      console.error("Failed to fetch channel 'bannable' users:", error);
      throw error;
    }
  }

  // list of 'DMable' users for a specific user sorted in ascending order
  // (not DMed yet, nor invited on DM with user, not user themselves)
  @Get('userDMables')
  async getUserDMables(@GetUser() user: User, @Query() params: any): Promise<User[]> {
    try {
      const DMableUsers = await this.prisma.user.findMany({
        where: {
          NOT: {
            OR: [
              {
                memberOf: {
                  some: {
                    AND: [
                      { type: 'DM' },
                      { members: { some: { id: params.userId } } },
                    ],
              } } },
              {
                invitedIn: {
                  some: {
                    AND: [
                      { type: 'DM' },
                      { members: { some: { id: params.userId } } },
                    ],
              } } },
              { nickname: '__defaultUser__' },
              { id: user.id }, // Exclude the user with the specified userId
            ],
          },
        },
      });
      return DMableUsers || [];

    } catch (error) {
      console.error("Failed to fetch 'DMable' users of the user:", error);
      throw error;
    }
  }

  /* ********************************************************************************
  ** list of channels depending on their type (public, private, protected)
  ** ********************************************************************************
  */
  // list of all 'PUBLIC' channels sorted in ascending order
  @Get('publicChannels')
  async getPublicChannels(@Body() channel: Channel): Promise<Channel[]> {
    try {
      const channels = await this.prisma.channel.findMany({
        orderBy: { name: 'asc' },
        where: {
          AND: [
            { type: 'PUBLIC' },
            { NOT: { name: 'ALL' }},
          ],
        },
      });

      const allChannel = await this.prisma.channel.findFirst({
        where: { name: 'ALL' },
      });
      if (!allChannel) { throw new Error("The 'ALL' channel does not exist.") };

      if (channels.length === 0) {
        channels.push(allChannel);
      } else {
        channels.unshift(allChannel);
      }
      return channels;

    } catch (error) {
      console.error('Failed to fetch all public channels:', error);
      throw error;
    }
  }

  // list of all 'PRIVATE' channels sorted in ascending order
  @Get('privateChannels')
  async getPrivateChannels(@Body() channel: Channel): Promise<Channel[]> {
    try {
      const channels = await this.prisma.channel.findMany({
        orderBy: { name: 'asc' },
        where: { type: 'PRIVATE' },
      });
      return channels || [];

    } catch (error) {
      console.error('Failed to fetch all private channels:', error);
      throw error;
    }
  }

  // list of all 'PROTECTED' channels sorted in ascending order
  @Get('protectedChannels')
  async getProtectedChannels(@Body() channel: Channel): Promise<Channel[]> {
    try {
      const channels = await this.prisma.channel.findMany({
        orderBy: { name: 'asc' },
        where: { type: 'PROTECTED' },
      });
      return channels || [];

    } catch (error) {
      console.error('Failed to fetch all protected channels:', error);
      throw error;
    }
  }

  /* ********************************************************************************
  ** list of channels depending on their type for a specific user
  ** ********************************************************************************
  */
  // list of sorted channels for a specific user for 'auto-join' on 'sign in'
  @Get('userChannels')
  async getUserChannels(@Query() params: any): Promise<Channel[]> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: params.userId },
        include: { memberOf: true },
      });

      const sortedChannels = user?.memberOf.sort((a, b) => (a.name > b.name ? 1 : -1));
      return sortedChannels || [];

    } catch (error) {
      console.error('Failed to fetch channels of the user:', error);
      throw error;
    }
  }

  // list of DMs for a specific user sorted in ascending order
  @Get('userDMs')
  async getUserDMs(@Query() params: any): Promise<ChannelDM[]> {
    try {
      const channels = await this.prisma.channel.findMany({
        where: {
          type: 'DM',
          OR: [
            { members: { some: { id: params.userId } } },
            { invited: { some: { id: params.userId } } },
          ]
        },
        include: { owner: true, members: true, invited: true },
      });

      // map the ChannelDM
      const channelDMs: ChannelDM[] = channels.map((channel) => {
        const otherMember = channel.members.find(member => member.id !== params.userId);
        let label = otherMember ? otherMember.nickname : '';
        if (label === '') {
          label = channel.invited[0].nickname;
        }

        return {
          id: channel.id,
          name: channel.name,
          ownerId: channel.ownerId,
          owner: channel.owner,
          type: channel.type,
          label: label,
        };
      });

      const sortedChannels = channelDMs?.sort((a, b) => (a.name > b.name ? 1 : -1));
      return sortedChannels || [];

    } catch (error) {
      console.error('Failed to fetch user DMs:', error);
      throw error;
    }
  }

  // list of sorted private channels for a specific user (invited/members)
  @Get('userPrivateChannels')
  async getUserPrivateChannels(@Query() params: any): Promise<Channel[]> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: params.userId },
        include: {
          memberOf: {
            where: { type: 'PRIVATE' },
          },
          invitedIn: {
            where: { type: 'PRIVATE' },
          },
        },
      });

      const privateChannels = [
        ...(user?.memberOf.filter(channel => channel.type === 'PRIVATE') || []),
        ...(user?.invitedIn.filter(channel => channel.type === 'PRIVATE') || []),
      ];

      const sortedChannels = privateChannels?.sort((a, b) => (a.name > b.name ? 1 : -1));
      return sortedChannels || [];

    } catch (error) {
      console.error('Failed to fetch private channels of the user:', error);
      throw error;
    }
  }

  // list of sorted protected channels for a specific user (invited/members)
  @Get('userProtectedChannels')
  async getUserProtectedChannels(@Query() params: any): Promise<Channel[]> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: params.userId },
        include: {
          memberOf: {
            where: { type: 'PROTECTED' },
          },
          invitedIn: {
            where: { type: 'PROTECTED' },
          },
        },
      });

      const protectedChannels = [
        ...(user?.memberOf.filter(channel => channel.type === 'PROTECTED') || []),
        ...(user?.invitedIn.filter(channel => channel.type === 'PROTECTED') || []),
      ];

      const sortedChannels = protectedChannels?.sort((a, b) => (a.name > b.name ? 1 : -1));
      return sortedChannels || [];

    } catch (error) {
      console.error('Failed to fetch protected channels of the user:', error);
      throw error;
    }
  }

  // list of channels for a specific user to notif new messages after being offline
  @Get('channelsNewMessages')
  async getUserChannelsWithNewMsg(@Query() params: any): Promise<string[]> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: params.userId },
      });
      const lastOfflineTime = user.lastOffline || new Date(0);//'1900-01-01T00:00:00Z';

      const channels = await this.prisma.channel.findMany({
        where: {
          OR: [
            { type: 'PUBLIC' },
            { OR: [
              { members: { some: { id: params.userId } } },
              { invited: { some: { id: params.userId } } },
            ]},
          ],
          messages: {
            some: {
              createAt: { gt: lastOfflineTime },//gr = greater than
            },
          },
        },
      });

      const channelsWithNewMessages = channels.map((channel) => channel.name);
      return channelsWithNewMessages || [];

    } catch (error) {
      console.error('Failed to fetch channels of the user with new messages:', error);
      throw error;
    }
  }

  /* ********************************************************************************
  ** info for a specific channel
  ** ********************************************************************************
  */
  // get main info/details for a specific channel
  @Get('channelDetails')
  async getChannelDetails(@Query() params: any): Promise<Channel> {
    try {
      const chanDetails = await this.prisma.channel.findUnique({
        where: { id: params.channelId },
        include: { owner: true },
      });
      return chanDetails;

    } catch (error) {
      console.error('Failed to fetch channel main details:', error);
      throw error;
    }
  }

  // list of all messages for a specific channel
  @Get('channelMessages')
  async getChannelMsg(@Query() params: any): Promise<MessageResponse[]> {
    try {
      const channel = await this.prisma.channel.findUnique({
        where: { name: params.channelName },
        include: {
          messages: {
            select: {
              id: true,
              createAt: true,
              text: true,
              author: {
                select: {
                  id: true,
                  nickname: true,
                  imageUrl:true,
                  blockedBy: true,
        } } } } },
      });
      if (!channel)
        return [];

      // map the messages to the MessageResponse type with channelName & handle blocked users
      const messageResponses: MessageResponse[] = channel.messages.map((message) => {
        // Check if the message author is in the user's blocked users list
        const isBlocked = message.author.blockedBy.some((blockedUser) => blockedUser.id === params.userId);
        // If the author is blocked, change the text to 'message blocked'
        const text = isBlocked ? '🚫 MESSAGE BLOCKED' : message.text;

        return {
          id: message.id,
          createAt: message.createAt,
          text: text,
          author: message.author.nickname,
          channelName: channel.name,
          avatar: message.author.imageUrl,
        };
      });

      return messageResponses || [];

    } catch (error) {
      console.error('Failed to fetch channel messages:', error);
      throw error;
    }
  }
}
