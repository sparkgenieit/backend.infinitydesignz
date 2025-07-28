import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ColorsService {
  constructor(private prisma: PrismaService) {}

  /** Create color with duplicate label check */
  async create(data: { label: string; hex_code?: string; status?: boolean }) {
    const existing = await this.prisma.color.findFirst({
      where: { label: data.label },
    });

    if (existing) {
      throw new BadRequestException('Color with the same label already exists.');
    }

    const color = await this.prisma.color.create({ data });

    return {
      message: 'Color created successfully',
      data: color,
    };
  }

  /** List all colors */
  findAll() {
    return this.prisma.color.findMany({
      orderBy: {
        id: 'desc',
      },
    });
  }

  /** Get one color by ID */
  async findOne(id: number) {
    const color = await this.prisma.color.findUnique({ where: { id } });
    if (!color) {
      throw new NotFoundException(`Color with ID ${id} not found`);
    }
    return color;
  }

  /** Update color with duplicate label check */
  async update(id: number, data: Partial<{ label: string; hex_code: string; status: boolean }>) {
    const existingColor = await this.prisma.color.findUnique({ where: { id } });
    if (!existingColor) {
      throw new NotFoundException(`Color with ID ${id} not found`);
    }

    if (data.label) {
      const existing = await this.prisma.color.findFirst({
        where: {
          label: data.label,
          NOT: { id },
        },
      });

      if (existing) {
        throw new BadRequestException('Another color with the same label already exists.');
      }
    }

    const updated = await this.prisma.color.update({
      where: { id },
      data,
    });

    return {
      message: 'Color updated successfully',
      data: updated,
    };
  }

  /** Delete color */
  async remove(id: number) {
    const color = await this.prisma.color.findUnique({ where: { id } });
    if (!color) {
      throw new NotFoundException(`Color with ID ${id} not found`);
    }

    await this.prisma.color.delete({ where: { id } });

    return {
      message: 'Color deleted successfully',
    };
  }
}
