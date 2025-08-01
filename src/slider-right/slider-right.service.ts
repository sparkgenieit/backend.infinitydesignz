import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SliderRightService {
  constructor(private prisma: PrismaService) {}

  async findOne() {
    const slider = await this.prisma.sliderRight.findUnique({ where: { id: 1 } });

    if (!slider) {
      throw new NotFoundException('❌ SliderRight not found.');
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
      throw new BadRequestException(`❌ Failed to update SliderRight: ${error.message}`);
    }
  }
}
