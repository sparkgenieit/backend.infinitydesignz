import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class KeywordsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, keywordRaw: string) {
    const keyword = (keywordRaw ?? '').trim();
    if (!keyword) throw new BadRequestException('Keyword cannot be empty');

    try {
      return await this.prisma.keyword.create({
        data: { userId, keyword },
        select: { id: true, keyword: true, userId: true, createdAt: true },
      });
    } catch (e: any) {
      // Unique violation → return existing row instead of error
      if (e?.code === 'P2002') {
        const existing = await this.prisma.keyword.findUnique({
          where: { keyword },
          select: { id: true, keyword: true, userId: true, createdAt: true },
        });
        // Should always exist, but be defensive:
        if (existing) return { ...existing, alreadyExisted: true };
      }
      throw e;
    }
  }

  async list(params: {
    page?: number;
    take?: number;
    search?: string;
    userId?: number;
  }) {
    const page = Math.max(params.page ?? 1, 1);
    const takeRaw = Math.max(params.take ?? 10, 1);
    const take = Math.min(takeRaw, 100);
    const skip = (page - 1) * take;

    const where: Prisma.KeywordWhereInput = {};
    if (params.userId) where.userId = params.userId;

    const term = (params.search ?? '').trim();
    if (term) where.keyword = { contains: term }; // MySQL collation handles CI

    const [items, total] = await this.prisma.$transaction([
      this.prisma.keyword.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          keyword: true,
          createdAt: true,
          user: { select: { id: true, name: true, phone: true } },
        },
      }),
      this.prisma.keyword.count({ where }),
    ]);

    return {
      items,
      page,
      take,
      total,
      totalPages: Math.max(Math.ceil(total / take), 1),
    };
  }

  async getById(id: number) {
    const row = await this.prisma.keyword.findUnique({
      where: { id },
      select: {
        id: true,
        keyword: true,
        userId: true,
        createdAt: true,
        user: { select: { id: true, name: true, phone: true } },
      },
    });
    if (!row) throw new NotFoundException('Keyword not found');
    return row;
  }

  async delete(id: number) {
    await this.prisma.keyword.delete({ where: { id } });
    return { success: true, id };
  }
}
