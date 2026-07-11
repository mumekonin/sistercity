import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name:this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key:this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret:this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFile(file:any , folder: string): Promise<{
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder,resource_type: 'auto'},
        (error, result) => {
          if (error || !result) {
            reject(new Error('Cloudinary upload failed'));
            return;
          }

          resolve({
            fileUrl:  result.secure_url,
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: result.bytes,
          });
        }
      ).end(file.buffer);
    });
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const urlParts= fileUrl.split('/upload/');
    const publicIdWithExtension = urlParts[1];
    const publicId = publicIdWithExtension.split('.')[0];
    await cloudinary.uploader.destroy(publicId);
  }
}