import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class KeywordsService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a global keyword (no user association)
  async create(keywordRaw: string) {
    const keyword = (keywordRaw ?? '').trim();
    if (!keyword) throw new BadRequestException('Keyword cannot be empty');

    // Unique on keyword only → upsert is simplest (idempotent)
    return this.prisma.keyword.upsert({
      where: { keyword },
      create: { keyword },
      update: {},
      select: { id: true, keyword: true, createdAt: true },
    });
  }

  async list(params: {
    page?: number;
    take?: number;
    search?: string;
  }) {
    const page = Math.max(params.page ?? 1, 1);
    const takeRaw = Math.max(params.take ?? 10, 1);
    const take = Math.min(takeRaw, 100);
    const skip = (page - 1) * take;

    const where: Prisma.KeywordWhereInput = {};
    const term = (params.search ?? '').trim();
    if (term) where.keyword = { contains: term }; // add { mode: 'insensitive' } if desired

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
        createdAt: true,
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
