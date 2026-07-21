import { Module } from '@nestjs/common';
import { EventController } from './controller/events.controller';
import { EventService } from './service/events.service';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSchema, Event } from './schema/events.schema';
import { User, userSchema } from '../users/schema/users.shema';
import { NotificationModule } from '../notifications/notification.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: User.name, schema: userSchema },
    ]),
    NotificationModule,
  ],
  controllers: [EventController],
  providers: [EventService],
})
export class EventsModule {}
