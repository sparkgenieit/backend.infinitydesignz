import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMainCategoryPromotionDto } from './dto/create-main-category-promotion.dto';
import { UpdateMainCategoryPromotionDto } from './dto/update-main-category-promotion.dto';

@Injectable()
export class MainCategoryPromotionService {
  constructor(private prisma: PrismaService) {}

  /** Get all main category promotions */
  async findAll() {
    return this.prisma.mainCategoryPromotion.findMany({
      orderBy: { created_at: 'asc' },
    });
  }

  /** Create a main category promotion */
  async create(data: CreateMainCategoryPromotionDto & { image_url: string }) {
    const created = await this.prisma.mainCategoryPromotion.create({
      data: {
        ...data,
        display_count: Number(data.display_count),
        display_rows: Number(data.display_rows),
        status:
          typeof data.status === 'string'
            ? data.status === 'true' || data.status === '1'
            : Boolean(data.status),
      },
    });

    return {
      message: 'Main Category Promotion created successfully',
      data: created,
    };
  }

  /** Update a main category promotion */
  async update(id: number, data: UpdateMainCategoryPromotionDto & { image_url?: string }) {
    const updated = await this.prisma.mainCategoryPromotion.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.position && { position: data.position }),
        ...(data.image_url && { image_url: data.image_url }),
        ...(data.display_count !== undefined && {
          display_count: Number(data.display_count),
        }),
        ...(data.display_rows !== undefined && {
          display_rows: Number(data.display_rows),
        }),
        ...(data.status !== undefined && {
          status:
            typeof data.status === 'string'
              ? data.status === 'true' || data.status === '1'
              : Boolean(data.status),
        }),
      },
    });

    return {
      message: 'Main Category Promotion updated successfully',
      data: updated,
    };
  }

  /** Delete a main category promotion */
  async remove(id: number) {
    const exists = await this.prisma.mainCategoryPromotion.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Promotion not found');
    }

    await this.prisma.mainCategoryPromotion.delete({ where: { id } });

    return {
      message: 'Main Category Promotion deleted successfully',
    };
  }
}
