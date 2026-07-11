import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsController } from './controller/documents.controller';
import { DocumentsService } from './service/documents.service';
import { CloudinaryModule } from '../common/cloudinary/cloudinary.module';
import { DocumentFile, DocumentFileSchema } from './schema/documents.shema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentFile.name, schema: DocumentFileSchema },
    ]),
    CloudinaryModule,             
  ],
  controllers: [DocumentsController],
  providers:   [DocumentsService],
})
export class DocumentsModule {}