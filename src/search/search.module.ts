import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Project, ProjectSchema } from '../projects/schema/projects.schema';
import { Message, MessageSchema } from '../communication/schema/communication.schema';
import { EventSchema,Event } from 'src/events/schema/events.schema';
import { News,NewsSchema } from 'src/news/schema/news.schema ';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Event.name, schema: EventSchema },
      { name: News.name, schema: NewsSchema },
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}