import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GetFacetsDto } from './dto/get-facets.dto';
import { DISCOUNT_RANGES, MATERIALS } from './constants/facets.constants';

type FacetList = { id: number; label: string; priority: number; count: number };
type FacetSet  = { id: number; title: string; priority: number; lists: FacetList[] };
type FacetType = { id: number; name: string; sets: FacetSet[] };

type PriceBucket = { key: string; label: string; min?: number; max?: number };
type PriceBucketOut = PriceBucket & { count: number };

const PRICE_BUCKETS: PriceBucket[] = [
  { key: 'P0', label: 'upto 100',          max: 100 },
  { key: 'P1', label: '100-500',           min: 100,  max: 500 },
  { key: 'P2', label: '500-1000',          min: 500,  max: 1000 },
  { key: 'P3', label: '1000-5000',         min: 1000, max: 5000 },
  { key: 'P4', label: '5000-10000',        min: 5000, max: 10000 },
  { key: 'P5', label: 'above 10000',       min: 10000 },
];

@Injectable()
export class FiltersService {
  constructor(private readonly prisma: PrismaService) {}

  async getFacets(dto: GetFacetsDto) {
    // ---- Coerce numbers
    const categoryId = dto.categoryId != null ? Number(dto.categoryId) : undefined;
    const brandId    = dto.brandId    != null ? Number(dto.brandId)    : undefined;
    const minPrice   = dto.minPrice   != null ? Number(dto.minPrice)   : undefined;
    const maxPrice   = dto.maxPrice   != null ? Number(dto.maxPrice)   : undefined;

    const computedShowEmptyDefault = categoryId ? false : true;

    // ----- 1) Base product scope (no price)
    const productWhereBase: Prisma.ProductWhereInput = { status: true };
    if (categoryId) productWhereBase.categoryId = categoryId;
    if (brandId)    productWhereBase.brandId    = brandId;
    if (dto.q && dto.q.trim().length > 0) {
      productWhereBase.OR = [
        { title: { contains: dto.q } },
        { description: { contains: dto.q } },
        { sku: { contains: dto.q } },
      ];
    }

    // Same scope but with price (used to narrow other facets when user selects price)
    const productWhereWithPrice: Prisma.ProductWhereInput = { ...productWhereBase };
    if (minPrice != null || maxPrice != null) {
      const priceCond: Prisma.FloatFilter = {};
      if (minPrice != null) priceCond.gte = minPrice;
      if (maxPrice != null) priceCond.lte = maxPrice;
      productWhereWithPrice.variants = { some: { sellingPrice: priceCond } };
    }

    // ----- 2) Load Types -> Sets -> Lists
    const typeWhereMapped: Prisma.FilterTypeWhereInput | undefined =
      categoryId ? { Category: { some: { id: categoryId } } } : undefined;

    const typesRaw = await this.prisma.filterType.findMany({
      where: typeWhereMapped,
      orderBy: { name: 'asc' },
      include: {
        filterSets: {
          where: { status: true },
          orderBy: { priority: 'asc' },
          include: {
            filterLists: {
              where: { status: true },
              orderBy: { priority: 'asc' },
              select: { id: true, label: true, priority: true },
            },
          },
        },
      },
    });

    const listIds = Array.from(
      new Set(typesRaw.flatMap(t => t.filterSets.flatMap(s => s.filterLists.map(l => l.id))))
    );

    // ----- 3) Count products per FilterList (respect current price filter)
    const countMap = new Map<number, number>();
    if (listIds.length > 0) {
      const grouped = await this.prisma.productFilter.groupBy({
        by: ['filterListId'],
        where: {
          filterListId: { in: listIds },
          product: productWhereWithPrice, // <- respects min/max when applied
        },
        _count: { _all: true },
      });
      for (const g of grouped) countMap.set(g.filterListId, g._count._all);
    }

    // ----- 4) Compose sidebar; hide/show empties
    const hideEmpty = !(dto.showEmpty ?? computedShowEmptyDefault);

    const sidebar: FacetType[] = typesRaw
      .map(t => {
        const sets: FacetSet[] = t.filterSets
          .map(s => {
            const lists: FacetList[] = s.filterLists
              .map(l => ({
                id: l.id,
                label: l.label,
                priority: l.priority ?? 0,
                count: countMap.get(l.id) ?? 0,
              }))
              .filter(x => (hideEmpty ? x.count > 0 : true));
            return { id: s.id, title: s.title, priority: s.priority ?? 0, lists };
          })
          .filter(set => (hideEmpty ? set.lists.length > 0 : true));
        return { id: t.id, name: t.name, sets };
      })
      .filter(ft => (hideEmpty ? ft.sets.length > 0 : true));

    const allFilters: FacetSet[] = sidebar.flatMap(t => t.sets);

    // ----- 5) Colors
    const colors = await this.prisma.color.findMany({
      where: { status: true },
      orderBy: [{ label: 'asc' }],
      select: { id: true, label: true, hex_code: true },
    });

    // ----- 6) Price min/max over current scope (ignore any selected min/max)
    const priceAgg = await this.prisma.variant.aggregate({
      _min: { sellingPrice: true },
      _max: { sellingPrice: true },
      where: { product: productWhereBase },
    });

    // ----- 7) Price buckets like screenshot (counts ignore existing min/max)
    const priceBuckets: PriceBucketOut[] = await Promise.all(
      PRICE_BUCKETS.map(async (b) => {
        const priceCond: Prisma.FloatFilter = {};
        if (b.min != null) priceCond.gte = b.min;
        if (b.max != null) priceCond.lt  = b.max; // < upper bound to avoid overlap
        const count = await this.prisma.variant.count({
          where: {
            product: productWhereBase,
            sellingPrice: (b.min != null || b.max != null) ? priceCond : undefined,
          },
        });
        return { ...b, count };
      })
    );

    // ----- 8) Other static facets
    const discountRanges = DISCOUNT_RANGES;
    const materials      = MATERIALS;

    return {
      sidebar,
      allFilters,
      colors,
      price: {
        min: priceAgg._min.sellingPrice ?? 0,
        max: priceAgg._max.sellingPrice ?? 0,
        buckets: priceBuckets, // <-- UI can render checkboxes exactly as shown
      },
      discountRanges,
      materials,
    };
  }
}
