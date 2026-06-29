import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MessageController } from "./controller/communication.controller";
import { MessageService } from "./service/communication.service";
import { Message, MessageSchema } from "./schema/communication.schema";
import { User,userSchema } from "src/users/schema/users.shema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: User.name,schema: userSchema  }
    ]),
  ],
  controllers: [MessageController],
  providers: [MessageService],
})
export class CommunicationModule { }