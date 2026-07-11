import { Module } from "@nestjs/common";
import { EventController } from "./controller/events.controller";
import { EventService } from "./service/events.service";
import { MongooseModule } from "@nestjs/mongoose";
import { EventSchema ,Event} from "./schema/events.schema";
@Module({
  imports: [
    MongooseModule.forFeature([
          { name:Event.name, schema: EventSchema },
        ])
  ],
    controllers: [EventController],  
  providers: [EventService],
})
export class EventsModule{}