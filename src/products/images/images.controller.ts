// src/images/images.controller.ts
import {
  Controller,
  Post,
  Param,
  UploadedFiles,
  UseInterceptors,
  Get,
  Patch,
  Delete,
  Body,
  UploadedFile,
} from '@nestjs/common';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ImagesService } from './images.service';
import { multerProductStorage } from '../../config/multerProductStorage';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post(':productId')
  @UseInterceptors(AnyFilesInterceptor({ storage: multerProductStorage }))
  uploadProductImages(
    @Param('productId') productId: string,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    return this.imagesService.saveImages(productId, files);
  }

  @Get(':productId')
  getImagesByProduct(@Param('productId') productId: string) {
    return this.imagesService.getImagesByProduct(+productId);
  }

  @Get('variant/:variantId')
  getImagesByVariant(@Param('variantId') variantId: string) {
    return this.imagesService.getImagesByVariant(+variantId);
  }

  
  @Delete(':id')
  deleteImage(@Param('id') id: string) {
    return this.imagesService.deleteImage(+id);
  }
}
