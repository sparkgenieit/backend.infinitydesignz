import { Controller, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@Controller('products')
export class ProductUploadController {
  @Post('upload')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'main_image', maxCount: 1 },
    { name: 'multiple_images', maxCount: 10 },
  ]))
  upload(@UploadedFiles() files: { main_image?: Express.Multer.File[], multiple_images?: Express.Multer.File[] }) {
    return {
      mainImage: files.main_image?.[0]?.originalname || null,
      gallery: files.multiple_images?.map(f => f.originalname) || [],
    };
  }
}
