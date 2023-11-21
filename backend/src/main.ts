import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as childProcess from 'child_process';
import { DefaultUserService } from './default-service/default-user.service';
import { DefaultChannelService } from './default-service/default-channel.service';
import * as session from 'express-session';
import * as cookieParser from "cookie-parser"

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const cors = require('cors');

  // app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  
  app.use(
    cors({origin: process.env.FRONT_URL, credentials: true}),
    cookieParser(),
  );
  
  
  // Initialize the default user & default channel if needed
  const defaultUserService = app.get(DefaultUserService);
  await defaultUserService.initDefaultUser();
  const defaultChannelService = app.get(DefaultChannelService);
  await defaultChannelService.initDefaultChannel();


  await app.listen(4000);
}
bootstrap();


/* shouldnt we disconnect prisma at the end ?

.finally(async () ==> {
  await prisma.disconnnect()
})


*/