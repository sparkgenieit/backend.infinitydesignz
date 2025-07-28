import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductFeatureDto, UpdateProductFeatureDto } from './dto';

@Injectable()
export class ProductFeaturesService {
  constructor(private prisma: PrismaService) {}

  async createOrUpdate(dto: CreateProductFeatureDto) {
    const { productId, featureListId, value } = dto;

    try {
      // Check if referenced productId exists
      const productExists = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
      });
      if (!productExists) {
        throw new BadRequestException(`Invalid productId does not exists in DB: ${productId}`);
      }

      // Check if referenced featureListId exists
      const featureExists = await this.prisma.featureList.findUnique({
        where: { id: featureListId },
        select: { id: true },
      });
      if (!featureExists) {
        throw new BadRequestException(`Invalid featureListId does not exists in DB: ${featureListId}`);
      }

      // Check if combination already exists
      const existing = await this.prisma.productFeature.findUnique({
        where: {
          productId_featureListId: { productId, featureListId },
        },
      });

      if (existing) {
        await this.prisma.productFeature.update({
          where: {
            productId_featureListId: { productId, featureListId },
          },
          data: { value },
        });
        return { message: 'Product Feature updated successfully' };
      }

      await this.prisma.productFeature.create({
        data: {
          productId,
          featureListId,
          value,
        },
      });
      return { message: 'Product Feature created successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new BadRequestException(
          `ProductFeature with productId ${productId} and featureListId ${featureListId} already exists.`
        );
      }
      throw new BadRequestException(error.message);
    }
  }

  async createOrUpdateMany(items: CreateProductFeatureDto[]) {
    const results = await Promise.all(
      items.map((dto) => this.createOrUpdate(dto))
    );
    return {
      message: `${results.length} product features processed successfully`,
    };
  }

  findByProduct(productId: number) {
    return this.prisma.productFeature.findMany({ where: { productId } });
  }

  async update(id: number, dto: UpdateProductFeatureDto) {
    try {
      await this.prisma.productFeature.update({
        where: { id },
        data: dto,
      });
      return { message: 'Product Feature updated successfully' };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          `Duplicate entry for update: ${JSON.stringify(dto)}`
        );
      }
      throw new BadRequestException(error.message);
    }
  }
}
