import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Channel } from '@prisma/client';

@Injectable()
export class DefaultChannelService {
  constructor(private readonly prisma: PrismaService) {}

  // see if the channels database is empty
  async isChanDatabaseEmpty(): Promise<boolean> {
    const channelCount = await this.prisma.channel.count();
    return channelCount === 0;
  }

  // check if the default channel already exists
  async checkIfDefaultChannelExists(): Promise<boolean> {

    const defaultChannel = await this.prisma.channel.findUnique({
      where: {
        name: 'ALL',
        owner: {
          nickname: '__defaultUser__',
        },
      },
    });

	  return !!defaultChannel;
  }

  // create the default channel
  async createDefaultChannel(): Promise<void> {

    const defaultChannel = await this.prisma.channel.create({
      data: {
        name: 'ALL',
        owner: {
          connect: { nickname: '__defaultUser__' },
        },
      },
    });

    console.log('<CREATE CHAN> created channel details:', defaultChannel);
  }

  // Initialise the default channel if it doesn't exist
  async initDefaultChannel(): Promise<void> {

    const databaseEmpty = await this.isChanDatabaseEmpty();

    if (databaseEmpty) {
      await this.createDefaultChannel();
    } 
    else {

      const defaultChannelExists = await this.checkIfDefaultChannelExists();

      if (!defaultChannelExists) {
        await this.createDefaultChannel();
      }
    }
  }
}
