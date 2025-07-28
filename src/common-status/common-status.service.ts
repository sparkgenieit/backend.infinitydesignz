import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommonStatusService {
  constructor(private prisma: PrismaService) {}

  // Mapping of allowed entities and their corresponding Prisma model keys
  private readonly statusUpdatableEntities: Record<string, keyof PrismaService> = {
    'size-uom': 'sizeUOM',
    'categories': 'category',
    'colors': 'color',
    'coupons': 'coupon',
    'brands': 'brand',
    'products': 'product',
    // add more here if needed
  };

  /** Bulk update status (active/inactive) across multiple supported models */
  async bulkUpdateStatus(entity: string, ids: number[], status: boolean) {
    const modelName = this.statusUpdatableEntities[entity];

    if (!modelName) {
      throw new BadRequestException(`Unsupported entity: ${entity}`);
    }

    const model = (this.prisma as any)[modelName];

    if (!model?.updateMany) {
      throw new BadRequestException(`Entity ${entity} does not support bulk status update.`);
    }

    const res = await model.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });

    return {
      message: ` Updated ${res.count} ${entity} record(s) to status ${status ? 'active' : 'inactive'}`,
      updatedCount: res.count,
    };
  }
}
