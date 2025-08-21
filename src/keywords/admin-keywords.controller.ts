import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { KeywordsService } from './keywords.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type SortOrder = 'asc' | 'desc';

@UseGuards(JwtAuthGuard)
@Controller('admin/keywords')
export class AdminKeywordsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly keywordsService: KeywordsService,
  ) {}

  // ───────────────────────── LIST ─────────────────────────
  @Get()
  async listKeywords(
    @Query('page') pageQ?: string,
    @Query('take') takeQ?: string,
    @Query('search') search?: string,
    @Query('userId') userIdQ?: string,
    @Query('sortBy') sortByQ?: string,
    @Query('order') orderQ?: SortOrder,
  ) {
    const page = Math.max(parseInt(pageQ ?? '1', 10) || 1, 1);
    const takeRaw = Math.max(parseInt(takeQ ?? '10', 10) || 10, 1);
    const take = Math.min(takeRaw, 100);
    const skip = (page - 1) * take;

    const where: Prisma.KeywordWhereInput = {};
    const term = (search ?? '').trim();
    if (term) where.keyword = { contains: term }; // compatible with your Prisma version (no 'mode')
    const userId = userIdQ ? Number(userIdQ) : undefined;
    if (!Number.isNaN(userId as number) && userId !== undefined) where.userId = userId!;

    // safe sortable fields
    const sortable = new Set<keyof Prisma.KeywordOrderByWithRelationInput>([
      'id',
      'keyword',
      'userId',
      'createdAt',
    ]);
    const sortBy = (sortable.has(sortByQ as any) ? sortByQ : 'createdAt') as
      | keyof Prisma.KeywordOrderByWithRelationInput
      | undefined;
    const order: SortOrder = orderQ === 'asc' || orderQ === 'desc' ? orderQ : 'desc';

    const [items, total] = await this.prisma.$transaction([
      this.prisma.keyword.findMany({
        where,
        skip,
        take,
        orderBy: sortBy ? { [sortBy]: order } : undefined,
        select: {
          id: true,
          keyword: true,
          userId: true,
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
      sortBy,
      order,
      filters: {
        search: term || undefined,
        userId: userId ?? undefined,
      },
    };
  }

  // ───────────────────────── READ ─────────────────────────
  @Get(':id')
  async getKeywordById(@Param('id', ParseIntPipe) id: number) {
    return this.keywordsService.getById(id);
  }

  // ───────────────────────── DELETE ─────────────────────────
  @Delete(':id')
  async deleteKeyword(@Param('id', ParseIntPipe) id: number) {
    await this.prisma.keyword.delete({ where: { id } });
    return { success: true, id };
  }
}
