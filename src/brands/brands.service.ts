import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  /** Create brand with duplicate name check */
  async create(data: { name: string; logo_url?: string; status?: boolean }) {
    const existing = await this.prisma.brand.findFirst({
      where: { name: data.name },
    });

    if (existing) {
      throw new BadRequestException('Brand with the same name already exists.');
    }

    const brand = await this.prisma.brand.create({ data });

    return {
      message: 'Brand created successfully',
      data: brand,
    };
  }

  /** List all brands */
  findAll() {
    return this.prisma.brand.findMany({
      orderBy: {
        id: 'desc',
      },
    });
  }

  /** Get one brand */
  async findOne(id: number) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }
    return brand;
  }

  /** Update brand with duplicate name check */
  async update(id: number, data: Partial<{ name: string; status: boolean }>) {
    const existingBrand = await this.prisma.brand.findUnique({ where: { id } });
    if (!existingBrand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    if (data.name) {
      const existing = await this.prisma.brand.findFirst({
        where: {
          name: data.name,
          NOT: { id }, // Exclude current brand
        },
      });

      if (existing) {
        throw new BadRequestException('Another brand with the same name already exists.');
      }
    }

    const updated = await this.prisma.brand.update({
      where: { id },
      data,
    });

    return {
      message: 'Brand updated successfully',
      data: updated,
    };
  }

  /** Delete brand */
  async remove(id: number) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    await this.prisma.brand.delete({ where: { id } });

    return {
      message: 'Brand deleted successfully',
    };
  }
}
