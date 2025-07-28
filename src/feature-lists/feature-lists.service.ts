import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeatureListService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create a new FeatureList */
  async create(data: {
    label: string;
    priority: number;
    status?: boolean;
    featureSetId: number;
  }) {
    const featureList = await this.prisma.featureList.create({ data });

    return {
      message: 'Feature List created successfully',
      data: featureList,
    };
  }

  /** Get all feature lists with their parent FeatureSet */
  findAll() {
    return this.prisma.featureList.findMany({
      include: { featureSet: true },
      orderBy: { id: 'desc' },
    });
  }

  /** Get one feature list by ID */
  async findOne(id: number) {
    const featureList = await this.prisma.featureList.findUnique({
      where: { id },
      include: { featureSet: true },
    });

    if (!featureList) throw new NotFoundException('Feature List not found');

    return featureList;
  }

  /** Update a feature list */
  async update(
    id: number,
    data: {
      label?: string;
      priority?: number;
      status?: boolean;
      featureSetId?: number;
    },
  ) {
    await this.findOne(id); // ensure exists

    const updated = await this.prisma.featureList.update({
      where: { id },
      data,
    });

    return {
      message: 'Feature List updated successfully',
      data: updated,
    };
  }

  /** Delete a feature list and all associated product features */
  async remove(id: number) {
    await this.findOne(id); // ensure exists

    //  Step 1: Delete related ProductFeatures
    await this.prisma.productFeature.deleteMany({
      where: { featureListId: id },
    });

    //  Step 2: Delete the FeatureList
    await this.prisma.featureList.delete({
      where: { id },
    });

    return {
      message: 'Feature List deleted successfully',
    };
  }
}
