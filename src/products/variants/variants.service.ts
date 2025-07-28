import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VariantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    const existing = await this.prisma.variant.findFirst({
      where: { sku: data.sku },
    });

    if (existing) {
      throw new BadRequestException('❌ Variant with this SKU already exists.');
    }

    const result = await this.prisma.variant.create({ data });
    return { message: 'Variant created successfully.', variant: result };
  }

  async findAll() {
    const variants = await this.prisma.variant.findMany();
    return { message: 'Variants fetched successfully.', variants };
  }

  async findOne(id: number) {
    const variant = await this.prisma.variant.findUnique({ where: { id } });
    if (!variant) {
      throw new BadRequestException('❌ Variant not found.');
    }
    return { message: 'Variant fetched successfully.', variant };
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
