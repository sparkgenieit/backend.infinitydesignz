import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FilterListService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create FilterList */
  async create(data: {
    label: string;
    priority: number;
    status?: boolean;
    filterSetId: number;
  }) {
    const filterList = await this.prisma.filterList.create({ data });

    return {
      message: 'Filter List created successfully',
      data: filterList,
    };
  }

  /** Get all filter lists with their parent FilterSet */
  findAll() {
    return this.prisma.filterList.findMany({
      include: { filterSet: true },
      orderBy: { id: 'desc' },
    });
  }

  /** Get one filter list by ID */
  async findOne(id: number) {
    const filterList = await this.prisma.filterList.findUnique({
      where: { id },
      include: { filterSet: true },
    });

    if (!filterList) throw new NotFoundException('Filter List not found');

    return filterList;
  }

  /** Update a filter list */
  async update(
    id: number,
    data: {
      label?: string;
      priority?: number;
      status?: boolean;
      filterSetId?: number;
    }
  ) {
    await this.findOne(id); // ensure exists

    const updated = await this.prisma.filterList.update({
      where: { id },
      data,
    });

    return {
      message: 'Filter List updated successfully',
      data: updated,
    };
  }

  /** Delete filter list and all related ProductFilters */
  async remove(id: number) {
    await this.findOne(id); // ensure exists

    //  Step 1: Delete all related ProductFilter entries
    await this.prisma.productFilter.deleteMany({
      where: { filterListId: id },
    });

    //  Step 2: Delete the FilterList
    await this.prisma.filterList.delete({
      where: { id },
    });

    return {
      message: 'Filter List deleted successfully',
    };
  }
}
