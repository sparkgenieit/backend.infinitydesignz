import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeatureSetService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create FeatureSet */
  async create(data: { title: string; priority: number; status?: boolean; featureTypeId: number }) {
    const featureSet = await this.prisma.featureSet.create({ data });

    return {
      message: 'Feature Set created successfully',
      data: featureSet,
    };
  }

  /** List all FeatureSets with their FeatureType */
  findAll() {
    return this.prisma.featureSet.findMany({
      include: { featureType: true },
      orderBy: { id: 'desc' },
    });
  }

  /** Find one FeatureSet by ID */
  async findOne(id: number) {
    const featureSet = await this.prisma.featureSet.findUnique({
      where: { id },
      include: { featureType: true },
    });

    if (!featureSet) throw new NotFoundException('Feature Set not found');

    return featureSet;
  }

  /** Update FeatureSet */
  async update(
    id: number,
    data: { title?: string; priority?: number; status?: boolean; featureTypeId?: number },
  ) {
    await this.findOne(id); // ensure exists

    const updated = await this.prisma.featureSet.update({
      where: { id },
      data,
    });

    return {
      message: 'Feature Set updated successfully',
      data: updated,
    };
  }

  /** Remove FeatureSet and its nested FeatureLists & ProductFeatures */
  async remove(id: number) {
    const featureSet = await this.findOne(id); // ensure exists

    //  Step 1: Get all FeatureLists under this FeatureSet
    const featureLists = await this.prisma.featureList.findMany({
      where: { featureSetId: id },
      select: { id: true },
    });

    const featureListIds = featureLists.map(f => f.id);

    if (featureListIds.length > 0) {
      //  Step 2: Delete all ProductFeatures using those FeatureList IDs
      await this.prisma.productFeature.deleteMany({
        where: { featureListId: { in: featureListIds } },
      });

      //  Step 3: Delete all FeatureLists
      await this.prisma.featureList.deleteMany({
        where: { id: { in: featureListIds } },
      });
    }

    //  Step 4: Delete the FeatureSet
    await this.prisma.featureSet.delete({
      where: { id },
    });

    return {
      message: 'Feature Set deleted successfully',
    };
  }
}
