import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CouponService {
  constructor(private prisma: PrismaService) {}

  /** Create coupon with duplicate code protection */
  async create(data: CreateCouponDto) {
    try {
      const coupon = await this.prisma.coupon.create({ data });
      return {
        message: 'Coupon created successfully',
        data: coupon,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Coupon code already exists');
      }
      throw error;
    }
  }

  /** List all coupons */
  findAll() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Find one coupon by ID */
  async findOne(id: number) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  /** Update coupon with error handling */
  async update(id: number, data: UpdateCouponDto) {
    try {
      const updated = await this.prisma.coupon.update({
        where: { id },
        data,
      });

      return {
        message: 'Coupon updated successfully',
        data: updated,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Coupon not found');
      }
      throw error;
    }
  }

  /** Delete coupon with existence check */
  async remove(id: number) {
    const exists = await this.prisma.coupon.findUnique({
      where: { id },
    });
    if (!exists) {
      throw new NotFoundException('Coupon not found');
    }

    await this.prisma.coupon.delete({ where: { id } });

    return {
      message: 'Coupon deleted successfully',
    };
  }
}
