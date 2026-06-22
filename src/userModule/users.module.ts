import { Module } from '@nestjs/common';
import {UsersConteroller} from "./controller/users.controller";
import {UserService} from "./service/users.service";
import {MongooseModule} from "@nestjs/mongoose";
import {User,userSchema} from "./schema/users.shema";
@Module({
  imports: [
        MongooseModule.forFeature([
      { name: User.name,schema: userSchema  },
   
    ])
  ],
  controllers: [UsersConteroller],
  providers: [UserService],
})
export class UsersModule {}
