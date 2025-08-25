import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserSubscribeDto } from './dto/create-user-subscribe.dto';
import { UpdateUserSubscribeDto } from './dto/update-user-subscribe.dto';

@Injectable()
export class UserSubscribeService {
  constructor(private prisma: PrismaService) {}

  /** Create a new subscriber */
  async create(dto: CreateUserSubscribeDto) {
    return this.prisma.userSubscribe.create({
      data: {
        email: dto.email,
        ...(dto.subscribedAt ? { subscribed_at: new Date(dto.subscribedAt) } : {}),
      },
    });
  }

  /** List subscribers with search + pagination */
  async findAll(params: { search?: string; page?: number; take?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const take = Math.min(100, Math.max(1, params.take ?? 10));
    const skip = (page - 1) * take;

    const where: any = {};
    if (params.search && params.search.trim()) {
      where.OR = [{ email: { contains: params.search, mode: 'insensitive' } }];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.userSubscribe.findMany({
        where,
        orderBy: { subscribed_at: 'desc' },
        skip,
        take,
      }),
      this.prisma.userSubscribe.count({ where }),
    ]);

    return { items, total, page, take };
  }

  /** Get one by ID */
  async findOne(id: number) {
    const row = await this.prisma.userSubscribe.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`UserSubscribe ${id} not found`);
    return row;
  }

  /** Update by ID */
  async update(id: number, dto: UpdateUserSubscribeDto) {
    await this.ensureExists(id);
    return this.prisma.userSubscribe.update({
      where: { id },
      data: {
        email: dto.email,
        ...(dto.subscribedAt ? { subscribed_at: new Date(dto.subscribedAt) } : {}),
      },
    });
  }

  /** Delete by email (hard delete) */
  async removeByEmail(email: string) {
    const result = await this.prisma.userSubscribe.deleteMany({
      where: { email },
    });

    if (result.count === 0) {
      throw new NotFoundException(`Subscriber with email "${email}" not found`);
    }

    return {
      message:
        result.count === 1
          ? 'Unsubscribed successfully'
          : `Unsubscribed ${result.count} entries successfully`,
    };
  }

  private async ensureExists(id: number) {
    const exists = await this.prisma.userSubscribe.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Subscribe ${id} not found`);
  }
}
