import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserOrderDto } from './dto/create-user-order.dto';
import { UpdateUserOrderDto } from './dto/update-user-order.dto';

@Injectable()
export class UserOrdersService {
  constructor(private prisma: PrismaService) {}

  /** Create a new user order (subscriber) */
  async create(dto: CreateUserOrderDto) {
    return this.prisma.userOrder.create({
      data: {
        email: dto.email,
        ...(dto.subscribedAt
          ? { subscribed_at: new Date(dto.subscribedAt) }
          : {}),
      },
    });
  }

  /**
   * List user orders with optional:
   *  - search (email)
   *  - pagination (page, take)
   */
  async findAll(params: { search?: string; page?: number; take?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const take = Math.min(100, Math.max(1, params.take ?? 10));
    const skip = (page - 1) * take;

    const where: any = {};
    if (params.search && params.search.trim()) {
      where.OR = [{ email: { contains: params.search, mode: 'insensitive' } }];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.userOrder.findMany({
        where,
        orderBy: { subscribed_at: 'desc' },
        skip,
        take,
      }),
      this.prisma.userOrder.count({ where }),
    ]);

    return { items, total, page, take };
  }

  /** Get one by ID */
  async findOne(id: number) {
    const row = await this.prisma.userOrder.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`UserOrder ${id} not found`);
    return row;
  }

  /** Update (email and/or subscribed date) */
  async update(id: number, dto: UpdateUserOrderDto) {
    await this.ensureExists(id);
    return this.prisma.userOrder.update({
      where: { id },
      data: {
        email: dto.email,
        ...(dto.subscribedAt
          ? { subscribed_at: new Date(dto.subscribedAt) }
          : {}),
      },
    });
  }

  /** Delete (hard delete) */
  async remove(id: number) {
    await this.ensureExists(id);
    await this.prisma.userOrder.delete({ where: { id } });
    return { message: 'UserOrder deleted successfully' };
  }

  private async ensureExists(id: number) {
    const exists = await this.prisma.userOrder.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`UserOrder ${id} not found`);
  }
}
