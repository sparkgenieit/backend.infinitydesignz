import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMainProductPromotionDto } from './dto/create-main-product-promotion.dto';
import { UpdateMainProductPromotionDto } from './dto/update-main-product-promotion.dto';

@Injectable()
export class MainProductPromotionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMainProductPromotionDto) {
    await this.verifyForeignKeys({ categoryId: dto.categoryId, brandId: dto.brandId });
    try {
      return await this.prisma.mainProductPromotion.create({
        data: {
          title: dto.title,
          priority: dto.priority ?? 0,
          displayPosition: dto.displayPosition,
          imageUrl: dto.imageUrl,

          categoryId: dto.categoryId,
          brandId: dto.brandId ?? null,
          seller: dto.seller ?? null,

          minPrice: dto.minPrice ?? null,
          maxPrice: dto.maxPrice ?? null,
          offerPercentFrom: dto.offerPercentFrom ?? null,
          offerPercentTo: dto.offerPercentTo ?? null,

          seoTitle: dto.seoTitle ?? null,
          seoDescription: dto.seoDescription ?? null,
          seoKeywords: dto.seoKeywords ?? null,

          status: dto.status ?? true,
        },
        include: { brand: true, category: true },
      });
    } catch (e: any) {
      if (e?.code === 'P2003') {
        throw new BadRequestException('Invalid foreign key: categoryId/brandId does not exist.');
      }
      throw e;
    }
  }

  async findAll(params: { page?: number | string; limit?: number | string; status?: 'all' | 'active' | 'inactive'; q?: string }) {
    const page = Math.max(1, Number(params.page ?? 1));
    const take = Math.min(100, Math.max(1, Number(params.limit ?? 20)));
    const skip = (page - 1) * take;

    const where: any = {};
    if (params.status === 'active') where.status = true;
    if (params.status === 'inactive') where.status = false;

    if (params.q?.trim()) {
      const q = params.q.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { displayPosition: { contains: q, mode: 'insensitive' } },
        { seller: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.mainProductPromotion.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        include: { brand: true, category: true },
        skip,
        take,
      }),
      this.prisma.mainProductPromotion.count({ where }),
    ]);

    return { page, limit: take, total, items };
  }

  async findOne(id: number) {
    const row = await this.prisma.mainProductPromotion.findUnique({
      where: { id },
      include: { brand: true, category: true },
    });
    if (!row) throw new NotFoundException('Promotion not found');
    return row;
  }

  async update(id: number, dto: UpdateMainProductPromotionDto) {
    await this.ensureExists(id);
    await this.verifyForeignKeys({ categoryId: dto.categoryId, brandId: dto.brandId }, true);

    try {
      return await this.prisma.mainProductPromotion.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
          ...(dto.displayPosition !== undefined ? { displayPosition: dto.displayPosition } : {}),
          ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),

          ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
          ...(dto.brandId !== undefined ? { brandId: dto.brandId ?? null } : {}),
          ...(dto.seller !== undefined ? { seller: dto.seller ?? null } : {}),

          ...(dto.minPrice !== undefined ? { minPrice: dto.minPrice } : {}),
          ...(dto.maxPrice !== undefined ? { maxPrice: dto.maxPrice } : {}),
          ...(dto.offerPercentFrom !== undefined ? { offerPercentFrom: dto.offerPercentFrom } : {}),
          ...(dto.offerPercentTo !== undefined ? { offerPercentTo: dto.offerPercentTo } : {}),

          ...(dto.seoTitle !== undefined ? { seoTitle: dto.seoTitle } : {}),
          ...(dto.seoDescription !== undefined ? { seoDescription: dto.seoDescription } : {}),
          ...(dto.seoKeywords !== undefined ? { seoKeywords: dto.seoKeywords } : {}),

          ...(dto.status !== undefined ? { status: dto.status } : {}),
        },
        include: { brand: true, category: true },
      });
    } catch (e: any) {
      if (e?.code === 'P2003') {
        throw new BadRequestException('Invalid foreign key: categoryId/brandId does not exist.');
      }
      throw e;
    }
  }

  async remove(id: number) {
    await this.ensureExists(id);
    return this.prisma.mainProductPromotion.update({
      where: { id },
      data: { status: false },
    });
  }

  // optional
  async hardDelete(id: number) {
    await this.ensureExists(id);
    return this.prisma.mainProductPromotion.delete({ where: { id } });
  }

  private async ensureExists(id: number) {
    const exists = await this.prisma.mainProductPromotion.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Promotion not found');
  }

  private async verifyForeignKeys(
    dto: { categoryId?: number; brandId?: number },
    partial = false,
  ) {
    const missing: string[] = [];

    if (!partial || dto.categoryId !== undefined) {
      if (dto.categoryId != null) {
        const hit = await this.prisma.category.findUnique({
          where: { id: Number(dto.categoryId) },
          select: { id: true },
        });
        if (!hit) missing.push('categoryId');
      }
    }

    if (!partial || dto.brandId !== undefined) {
      if (dto.brandId != null) {
        const hit = await this.prisma.brand.findUnique({
          where: { id: Number(dto.brandId) },
          select: { id: true },
        });
        if (!hit) missing.push('brandId');
      }
    }

    if (missing.length) {
      throw new BadRequestException(`Invalid foreign keys: ${missing.join(', ')}`);
    }
  }
}