import { Module } from '@nestjs/common';
import {UsersConteroller} from "./controller/users.controller";
import {UserService} from "./service/users.service";
import {MongooseModule} from "@nestjs/mongoose";
import {User,userSchema} from "./schema/users.shema";
import {AuthController}  from "./controller/auth.controller";
@Module({
  imports: [
        MongooseModule.forFeature([
      { name: User.name,schema: userSchema  },
   
    ])
  ],
  controllers: [UsersConteroller,AuthController],
  providers: [UserService],
})
export class UsersModule {}
