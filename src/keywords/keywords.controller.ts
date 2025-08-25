import {
  Body,
  Controller,
  Post,
  Get,
  Delete,
  Query,
  UseGuards,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { KeywordsService } from './keywords.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKeywordDto } from './dto/create-keyword.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type SortOrder = 'asc' | 'desc';

@Controller('keywords')
export class KeywordsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly keywordsService: KeywordsService,
  ) {}

  // Create a global keyword (no user association)
  @Post()
  async create(@Body() dto: CreateKeywordDto) {
    return this.keywordsService.create(dto.keyword.trim());
  }

  // List global keywords
  @UseGuards(JwtAuthGuard)
  @Get()
  async listKeywords(
    @Query('page') pageQ?: string,
    @Query('take') takeQ?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortByQ?: string,
    @Query('order') orderQ?: SortOrder,
  ) {
    const page = Math.max(parseInt(pageQ ?? '1', 10) || 1, 1);
    const takeRaw = Math.max(parseInt(takeQ ?? '10', 10) || 10, 1);
    const take = Math.min(takeRaw, 100);
    const skip = (page - 1) * take;

    const where: Prisma.KeywordWhereInput = {};
    const term = (search ?? '').trim();
    if (term) where.keyword = { contains: term }; // add { mode: 'insensitive' } if desired

    // Allowed sort fields for safety
    const sortable = new Set<keyof Prisma.KeywordOrderByWithRelationInput>([
      'id',
      'keyword',
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
      sortBy,
      order,
      filters: {
        search: term || undefined,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getKeywordById(@Param('id', ParseIntPipe) id: number) {
    return this.keywordsService.getById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteKeyword(@Param('id', ParseIntPipe) id: number) {
    await this.prisma.keyword.delete({ where: { id } });
    return { success: true, id };
    }
}
