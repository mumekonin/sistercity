import { Module } from '@nestjs/common';
import { UsersConteroller } from './controller/users.controller';
import { UserService } from './service/users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from './schema/users.shema';
import { AuthController } from './controller/auth.controller';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: userSchema }]),
    EmailModule,
  ],
  controllers: [UsersConteroller, AuthController],
  providers: [UserService],
  exports: [MongooseModule, UserService],
})
export class UsersModule {}
