import { Module } from '@nestjs/common';
import { CloudinaryService } from 'src/Documents/service/documents.service';

@Module({
  providers: [CloudinaryService],
  exports:   [CloudinaryService], 
})
export class CloudinaryModule {}