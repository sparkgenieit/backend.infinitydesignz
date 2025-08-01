import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VariantsService {
  constructor(private readonly prisma: PrismaService) {}
async create(productId: number, data: any[]) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new BadRequestException('❌ Payload must be a non-empty array of variants.');
  }

  const productExists = await this.prisma.product.findUnique({
    where: { id: productId },
  });

  if (!productExists) {
    throw new BadRequestException(`❌ Product with ID '${productId}' does not exist.`);
  }

  const createdVariants = [];

  for (const item of data) {
    const existing = await this.prisma.variant.findFirst({
      where: { sku: item.sku },
    });

    if (existing) {
      throw new BadRequestException(`❌ Variant with SKU '${item.sku}' already exists.`);
    }

    const created = await this.prisma.variant.create({
      data: {
        sku: item.sku,
        stock: item.stock,
        mrp: item.mrp,
        sellingPrice: item.sellingPrice,
        product: { connect: { id: productId } },
        ...(item.sizeId && { size: { connect: { id: item.sizeId } } }),
        ...(item.colorId && { color: { connect: { id: item.colorId } } }),
      },
    });

    createdVariants.push(created);
  }

  return createdVariants;
}

  async findAll() {
    const variants = await this.prisma.variant.findMany();
    return  variants;
  }

  async findOne(id: number) {
    const variant = await this.prisma.variant.findUnique({ where: { id } });
    if (!variant) {
      throw new BadRequestException('❌ Variant not found.');
    }
    return variant;
  }

  async update(id: number, data: any) {
    const existing = await this.prisma.variant.findFirst({
      where: {
        sku: data.sku,
        NOT: { id }, // Exclude current variant from the check
      },
    });

    if (existing) {
      throw new BadRequestException('❌ Another variant with this SKU already exists.');
    }

    const updated = await this.prisma.variant.update({
      where: { id },
      data,
    });

    return { message: 'Variant updated successfully.', variant: updated };
  }

  async remove(id: number) {
    const existing = await this.prisma.variant.findUnique({ where: { id } });
    if (!existing) {
      throw new BadRequestException('❌ Variant not found for deletion.');
    }

    await this.prisma.variant.delete({ where: { id } });
    return { message: 'Variant deleted successfully.' };
  }
}
