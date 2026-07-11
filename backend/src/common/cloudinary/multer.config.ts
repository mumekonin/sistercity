import { memoryStorage } from 'multer';
export const multerConfig = {
  storage: memoryStorage(),         
  limits: {
    fileSize: 10 * 1024 * 1024,   
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);              
    } else {
      cb( new Error('Invalid file type. Only PDF, Word, Excel, and images are allowed' ),
        false                       
         );
    }
  },
};