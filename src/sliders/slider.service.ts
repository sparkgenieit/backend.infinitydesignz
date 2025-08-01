import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSliderDto } from './dto/create-slider.dto';
import { UpdateSliderDto } from './dto/update-slider.dto';

@Injectable()
export class SliderService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const sliders = await this.prisma.slider.findMany({
      orderBy: { priority: 'asc' },
    });

    return sliders;
  }

  async create(data: CreateSliderDto & { image_url: string }) {
    try {
      const created = await this.prisma.slider.create({
        data: {
          title: data.title,
          link: data.link,
          image_url: data.image_url,
          priority: Number(data.priority),
          status:
            typeof data.status === 'string'
              ? data.status === 'true' || data.status === '1'
              : Boolean(data.status),
        },
      });

      return {
        message: 'Slider created successfully.',
        data: created,
      };
    } catch (error) {
      throw new BadRequestException(`❌ Failed to create slider: ${error.message}`);
    }
  }

  async update(id: number, data: UpdateSliderDto & { image_url?: string }) {
    try {
      const existing = await this.prisma.slider.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('❌ Slider not found.');

      const updated = await this.prisma.slider.update({
        where: { id },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.link && { link: data.link }),
          ...(data.image_url && { image_url: data.image_url }),
          ...(data.priority !== undefined && { priority: Number(data.priority) }),
          ...(data.status !== undefined && {
            status:
              typeof data.status === 'string'
                ? data.status === 'true' || data.status === '1'
                : Boolean(data.status),
          }),
        },
      });

      return {
        message: 'Slider updated successfully.',
        data: updated,
      };
    } catch (error) {
      throw new BadRequestException(`❌ Failed to update slider: ${error.message}`);
    }
  }

  async remove(id: number) {
    try {
      const existing = await this.prisma.slider.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('❌ Slider not found.');

      await this.prisma.slider.delete({ where: { id } });
      return { message: 'Slider deleted successfully.' };
    } catch (error) {
      throw new BadRequestException(`❌ Failed to delete slider: ${error.message}`);
    }
  }
}
