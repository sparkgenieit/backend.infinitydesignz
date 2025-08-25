import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMainCategoryPromotionDto } from './dto/create-main-category-promotion.dto';
import { UpdateMainCategoryPromotionDto } from './dto/update-main-category-promotion.dto';
import { MAIN_CATEGORY_PROMOTION_IMAGE_PATH } from '../config/constants';

// ---------- helpers (same spirit as slider.service) ----------
const formatImageUrl = (fileName: string | null) =>
  fileName ? `${MAIN_CATEGORY_PROMOTION_IMAGE_PATH}${fileName}` : null;

const toInt = (v: unknown, fallback = 0) => {
  if (v === null || v === undefined || v === '') return fallback;
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
};

const toBool = (v: unknown, fallback = false) => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string')
    return v === 'true' || v === '1' || v.toLowerCase() === 'yes';
  if (typeof v === 'number') return v === 1;
  return fallback;
};

@Injectable()
export class MainCategoryPromotionService {
  constructor(private prisma: PrismaService) {}

  /** Get all (ordered like sliders) */
  async findAll() {
    const items = await this.prisma.mainCategoryPromotion.findMany({
      orderBy: { priority: 'asc' }, // <- keep same ordering pattern as Slider
    });

    return items.map((it) => ({
      ...it,
      image_url: formatImageUrl(it.image_url as string | null),
      display_count: toInt(it.display_count),
      priority: toInt(it.priority),
      status: Boolean(it.status),
    }));
  }

  /** Create (expects file name in image_url, not full URL) */
  async create(
    data: CreateMainCategoryPromotionDto & { image_url: string | null },
  ) {
    try {
      // required field check (your Prisma error showed title missing)
      if (!data.title || `${data.title}`.trim() === '') {
        throw new BadRequestException('Title is required.');
      }

      const created = await this.prisma.mainCategoryPromotion.create({
        data: {
          title: `${data.title}`.trim(),
          // If you also collect link or other optional fields, add them here.
          image_url: data.image_url ?? null, // store just file name
          display_count: toInt((data as any).display_count, 0),
          priority: toInt((data as any).priority, 0),
          status: toBool((data as any).status, false),
        },
      });

      return {
        message: 'Home Category Promotion created successfully.',
        data: { ...created, image_url: formatImageUrl(created.image_url) },
      };
    } catch (error) {
      // surface the original reason like your error sample
      throw new BadRequestException(
        `Failed to create Home Category Promotion: ${error.message}`,
      );
    }
  }

  /** Update */
  async update(
    id: number,
    data: UpdateMainCategoryPromotionDto & { image_url?: string | null },
  ) {
    try {
      const existing = await this.prisma.mainCategoryPromotion.findUnique({
        where: { id },
      });
      if (!existing) throw new NotFoundException('Promotion not found.');

      const updated = await this.prisma.mainCategoryPromotion.update({
        where: { id },
        data: {
          ...(data.title !== undefined && {
            title: `${data.title}`.trim(),
          }),
          ...(data.image_url !== undefined && { image_url: data.image_url }),
          ...(data.display_count !== undefined && {
            display_count: toInt(data.display_count, existing.display_count ?? 0),
          }),
          ...(data.priority !== undefined && {
            priority: toInt(data.priority, existing.priority ?? 0),
          }),
          ...(data.status !== undefined && {
            status: toBool(data.status, existing.status ?? false),
          }),
        },
      });

      return {
        message: 'Home Category Promotion updated successfully.',
        data: { ...updated, image_url: formatImageUrl(updated.image_url) },
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to update Home Category Promotion: ${error.message}`,
      );
    }
  }

  /** Delete */
  async remove(id: number) {
    try {
      const exists = await this.prisma.mainCategoryPromotion.findUnique({
        where: { id },
      });
      if (!exists) throw new NotFoundException('Promotion not found.');

      await this.prisma.mainCategoryPromotion.delete({ where: { id } });
      return { message: 'Home Category Promotion deleted successfully.' };
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete Home Category Promotion: ${error.message}`,
      );
    }
  }
}
