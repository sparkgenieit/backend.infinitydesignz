import {
  Controller,
  Get,
  Put,
 UseGuards,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { SliderRightService } from './slider-right.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';



@Controller('slider-right')
export class SliderRightController {
  constructor(private readonly sliderService: SliderRightService) {}

  @Get()
  findOne() {
    return this.sliderService.findOne();
  }

   @UseGuards(JwtAuthGuard)
  @Put()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image1', maxCount: 1 },
        { name: 'image2', maxCount: 1 },
        { name: 'image3', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/slider-right',
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, uniqueSuffix + extname(file.originalname));
          },
        }),
      },
    ),
  )
  async update(
    @UploadedFiles()
    files: {
      image1?: Express.Multer.File[];
      image2?: Express.Multer.File[];
      image3?: Express.Multer.File[];
    },
  ) {
    const images: { [key: string]: string } = {};
    if (files.image1 && files.image1.length) images.image1 = files.image1[0].filename;
    if (files.image2 && files.image2.length) images.image2 = files.image2[0].filename;
    if (files.image3 && files.image3.length) images.image3 = files.image3[0].filename;
    return this.sliderService.update(images);
  }
}