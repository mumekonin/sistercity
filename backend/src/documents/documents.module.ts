import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsController } from './controller/documents.controller';
import { DocumentsService } from './service/documents.service';
import { CloudinaryModule } from '../common/cloudinary/cloudinary.module';
import { DocumentFile, DocumentFileSchema } from './schema/documents.shema';
import { User, userSchema } from '../users/schema/users.shema';
import { NotificationModule } from '../notifications/notification.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentFile.name, schema: DocumentFileSchema },
      { name: User.name, schema: userSchema },
    ]),
    CloudinaryModule,
    NotificationModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
