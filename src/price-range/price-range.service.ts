import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePriceRangeDto } from './dto/create-price-range.dto';
import { UpdatePriceRangeDto } from './dto/update-price-range.dto';

@Injectable()
export class PriceRangeService {
  constructor(private prisma: PrismaService) {}

  /** Create a new price range */
  async create(data: CreatePriceRangeDto) {
    const priceRange = await this.prisma.priceRange.create({ data });

    return {
      message: 'Price Range created successfully',
      data: priceRange,
    };
  }

  /** Get all price ranges */
  findAll() {
    return this.prisma.priceRange.findMany({
      orderBy: { min: 'asc' },
    });
  }

  /** Get one price range by ID */
  async findOne(id: number) {
    const priceRange = await this.prisma.priceRange.findUnique({
      where: { id },
    });

    if (!priceRange) {
      throw new NotFoundException('Price Range not found');
    }

    return priceRange;
  }

  /** Update a price range */
  async update(id: number, data: UpdatePriceRangeDto) {
    await this.findOne(id); // ensure it exists

    const updated = await this.prisma.priceRange.update({
      where: { id },
      data,
    });

    return {
      message: 'Price Range updated successfully',
      data: updated,
    };
  }

  /** Delete a price range */
  async remove(id: number) {
    const exists = await this.prisma.priceRange.findUnique({
      where: { id },
    });

    if (!exists) {
      throw new NotFoundException('Price Range not found');
    }

    await this.prisma.priceRange.delete({ where: { id } });

    return {
      message: 'Price Range deleted successfully',
    };
  }
}
