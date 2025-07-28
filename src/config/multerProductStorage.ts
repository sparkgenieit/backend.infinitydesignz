import { diskStorage } from 'multer';
import { join } from 'path';
import * as fs from 'fs';

export const multerProductStorage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = join(__dirname, '..', '..', '..', 'uploads', 'products');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
