import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { News, NewsSchema } from './schema/news.schema';
import { NewsController } from './controller/news.controller';
import { NewsService } from './service/news.service';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: News.name, schema: NewsSchema }]),
  ],
  controllers: [NewsController],
  providers: [NewsService, CloudinaryService],
})
export class NewsModule {}
