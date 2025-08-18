import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SLIDER_RIGHT_IMAGE_PATH } from '../config/constants';

const formatImageUrl = (fileName: string | null) =>
  fileName ? `${SLIDER_RIGHT_IMAGE_PATH}${fileName}` : null;
@Injectable()
export class SliderRightService {
  constructor(private prisma: PrismaService) {}

  async findOne() {
    const slider = await this.prisma.sliderRight.findUnique({ where: { id: 1 } });
      slider.image1 = formatImageUrl(slider.image1);
      slider.image2 = formatImageUrl(slider.image2);
      slider.image3 = formatImageUrl(slider.image3);
    if (!slider) {
      throw new NotFoundException(' SliderRight not found.');
    }

    return slider;
  }

  async update(images: { image1?: string; image2?: string; image3?: string }) {
    try {
      const updated = await this.prisma.sliderRight.update({
        where: { id: 1 },
        data: images,
      });

      return {
        message: 'SliderRight images updated successfully.',
        data: updated,
      };
    } catch (error) {
      throw new BadRequestException(` Failed to update SliderRight: ${error.message}`);
    }
  }
}
