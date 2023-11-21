import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DefaultUserService {
  constructor(private readonly prisma: PrismaService) {}

  // see if the users database is empty
  async isUserDatabaseEmpty(): Promise<boolean> {
    const userCount = await this.prisma.user.count();
    return userCount === 0;
  }

  // check if the default user already exists
  async checkIfDefaultUserExists(): Promise<boolean> {

    const defaultUser = await this.prisma.user.findUnique({
      where: {
        nickname: '__defaultUser__',
      },
    });

	  return !!defaultUser;
  }

  // create the default user
  async createDefaultUser(): Promise<void> {

    const defaultUser = await this.prisma.user.create({
      data: {
        email: 'default.user@zz-transcendence.com',
        nickname: '__defaultUser__',
      },
    });
      
    console.log('<CREATE USER> created user details:', defaultUser);
    
  }

  // Initialise the default user if it doesn't exist
  async initDefaultUser(): Promise<void> {

    const databaseEmpty = await this.isUserDatabaseEmpty();

    if (databaseEmpty) {
      await this.createDefaultUser();
    } 
    else {

      const defaultUserExists = await this.checkIfDefaultUserExists();

      if (!defaultUserExists) {
        await this.createDefaultUser();
      }
    }
  } 
}
