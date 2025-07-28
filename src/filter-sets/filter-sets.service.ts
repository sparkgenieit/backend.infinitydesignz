import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FilterSetService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create FilterSet */
  async create(data: {
    title: string;
    priority: number;
    status?: boolean;
    filterTypeId: number;
  }) {
    const filterSet = await this.prisma.filterSet.create({ data });

    return {
      message: 'Filter Set created successfully',
      data: filterSet,
    };
  }

  /** Get all FilterSets with their FilterType */
  findAll() {
    return this.prisma.filterSet.findMany({
      include: { filterType: true },
      orderBy: { id: 'desc' },
    });
  }

  /** Get a single FilterSet by ID */
  async findOne(id: number) {
    const filterSet = await this.prisma.filterSet.findUnique({
      where: { id },
      include: { filterType: true },
    });

    if (!filterSet) throw new NotFoundException('Filter Set not found');
    return filterSet;
  }

  /** Update FilterSet */
  async update(id: number, data: {
    title?: string;
    priority?: number;
    status?: boolean;
    filterTypeId?: number;
  }) {
    await this.findOne(id); // Ensure exists

    const updated = await this.prisma.filterSet.update({
      where: { id },
      data,
    });

    return {
      message: 'Filter Set updated successfully',
      data: updated,
    };
  }

  /** Delete FilterSet + its FilterLists + ProductFilters */
  async remove(id: number) {
    await this.findOne(id); // Ensure exists

    //  Step 1: Get all FilterLists under this FilterSet
    const filterLists = await this.prisma.filterList.findMany({
      where: { filterSetId: id },
      select: { id: true },
    });

    const filterListIds = filterLists.map(list => list.id);

    if (filterListIds.length > 0) {
      //  Step 2: Delete related ProductFilters
      await this.prisma.productFilter.deleteMany({
        where: { filterListId: { in: filterListIds } },
      });

      //  Step 3: Delete FilterLists
      await this.prisma.filterList.deleteMany({
        where: { id: { in: filterListIds } },
      });
    }

    //  Step 4: Delete FilterSet
    await this.prisma.filterSet.delete({
      where: { id },
    });

    return {
      message: 'Filter Set deleted successfully',
    };
  }
}
