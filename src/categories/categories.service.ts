// src/categories/categories.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService }              from '../prisma/prisma.service';
import { CATEGORY_IMAGE_PATH }        from '../config/constants';

const formatImage = (fn: string|null) => fn ? `${CATEGORY_IMAGE_PATH}${fn}` : null;
const formatCategoryResponse = (c: any) => ({
  ...c,
  mainImage: formatImage(c.mainImage),
  appIcon:   formatImage(c.appIcon),
  webImage:  formatImage(c.webImage),
});

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}
/** Recursive helper to fetch children of a category */
private async getCategoryWithChildrenRecursive(id: number): Promise<any> {
  const category = await this.prisma.category.findUnique({
    where: { id },
    include: {
      children: true,
      featureType: { include: { featureSets: { include: { featureLists: true } } } },
      filterType:  { include: { filterSets:  { include: { filterLists:  true } } } },
    },
  });

  if (!category) return null;

  return {
    ...formatCategoryResponse(category),
    children: await Promise.all(
      category.children.map(child => this.getCategoryWithChildrenRecursive(child.id))
    )
  };
}

  /** Create a leaf category with direct FeatureType/FilterType FKs */
  async create(data: any, files: any = {}) {
    const parentId = data.parentId != null ? Number(data.parentId) : null;
    const status   = data.status === 'true' || data.status === true;

    // 1) prevent duplicate title under same parent
    if (await this.prisma.category.findFirst({ where: { title: data.title, parentId } })) {
      throw new BadRequestException(
        'Category with same title already exists under selected parent.'
      );
    }

    // 2) parse single IDs
    const featureTypeId = data.featureTypeId != null ? Number(data.featureTypeId) : null;
    const filterTypeId  = data.filterTypeId  != null ? Number(data.filterTypeId)  : null;

    // 3) create record, connecting FKs
    const category = await this.prisma.category.create({
      data: {
        title: data.title,
        status,
        ...(parentId    != null && { parent:     { connect: { id: parentId    } } }),
        ...(featureTypeId != null && { featureType: { connect: { id: featureTypeId } } }),
        ...(filterTypeId  != null && { filterType:  { connect: { id: filterTypeId  } } }),
        mainImage: files.mainImage?.[0]?.filename || null,
        appIcon:   files.appIcon?.[0]?.filename   || null,
        webImage:  files.webImage?.[0]?.filename  || null,
      },
    });
 return {
    message: 'Category created successfully',
    data: formatCategoryResponse(category),
  };
   
  }

  /** List all categories with nested FeatureType→Sets→Lists and FilterType→Sets→Lists */
async findAll() {
  const categories = await this.prisma.category.findMany({
    include: {
      featureType: {
        include: { featureSets: { include: { featureLists: true } } },
      },
      filterType: {
        include: { filterSets: { include: { filterLists: true } } },
      },
    },
    orderBy: { id: 'desc' },
  });

  const formatted = categories.map(c => ({
    ...formatCategoryResponse(c),
    children: [],
  }));

  const categoryMap = new Map<number, any>();
  formatted.forEach(cat => categoryMap.set(cat.id, cat));

  const result = [];

  for (const cat of formatted) {
    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId);
      if (parent) {
        parent.children.push(cat);
      }
    }
    // Whether parent or not, we return all nodes in the list
    result.push(cat);
  }

  return result;
}

  /** Fetch one category (with its tree) plus its FeatureType & FilterType hierarchy */
async findOne(id: number) {
  const category = await this.getCategoryWithChildrenRecursive(id);
  if (!category) throw new NotFoundException(`Category ${id} not found`);
  return category;
}
  /** Update direct FKs via connect/disconnect on one FeatureType & one FilterType */
  async update(id: number, data: any, files: any = {}) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Category ${id} not found`);

    // duplicate‐title check
    if (data.title) {
      const dup = await this.prisma.category.findFirst({
        where: {
          title: data.title.trim(),
          parentId: data.parentId != null ? Number(data.parentId) : undefined,
          NOT: { id }
        }
      });
      if (dup) throw new BadRequestException(
        'Category with same title already exists under selected parent.'
      );
    }

    const payload: any = {
      ...(data.title       && { title: data.title.trim() }),
      ...(data.status      && { status: data.status === 'true' || data.status === true }),
      ...(data.parentId    !== undefined && {
        parent: data.parentId === null
          ? { disconnect: true }
          : { connect:    { id: Number(data.parentId) } }
      }),
      ...(data.featureTypeId !== undefined && {
        featureType: { connect: { id: Number(data.featureTypeId) } }
      }),
      ...(data.filterTypeId !== undefined && {
        filterType: { connect: { id: Number(data.filterTypeId) } }
      }),
      ...(files.mainImage?.[0] && { mainImage: files.mainImage[0].filename }),
      ...(files.appIcon?.[0]   && { appIcon:   files.appIcon[0].filename   }),
      ...(files.webImage?.[0]  && { webImage:  files.webImage[0].filename  }),
    };

    const updated = await this.prisma.category.update({
      where: { id },
      data: payload,
    });

     return {
    message: 'Category updated successfully',
    data: formatCategoryResponse(updated),
  };
  }

  async updateStatusBulk(ids: number[], status: boolean) {
    if (!Array.isArray(ids) || !ids.length) {
      throw new BadRequestException('IDs must be a non-empty array.');
    }
    const res = await this.prisma.category.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
    return {
      message:      `Updated ${res.count} categories' status to ${status}`,
      updatedCount: res.count,
    };
  }

 async remove(id: number) {
  const category = await this.prisma.category.findUnique({
    where: { id },
    include: { children: true },
  });
  if (!category) throw new NotFoundException('Category not found');

  // Recursively collect all descendant category IDs
  const collectDescendants = async (categoryId: number): Promise<number[]> => {
    const children = await this.prisma.category.findMany({
      where: { parentId: categoryId },
      select: { id: true },
    });
    const ids = children.map(c => c.id);

    for (const child of children) {
      ids.push(...await collectDescendants(child.id));
    }

    return ids;
  };

  const descendantIds = await collectDescendants(id);
  const allCategoryIds = [id, ...descendantIds];

  // Check for products assigned to any of the categories
  const assignedProducts = await this.prisma.product.findMany({
    where: { categoryId: { in: allCategoryIds } },
    select: {
      id: true,
      sku: true,
      title: true,
      categoryId: true,
    },
    take: 10,
  });

  if (assignedProducts.length > 0) {
    const preview = assignedProducts
      .map(p => `#${p.id} (${p.sku}) (${p.title}) → Category #${p.categoryId}`)
      .join(', ');

    throw new BadRequestException(
      `❌ Cannot delete: One or more categories (including children) are assigned to products: ${preview}. Please reassign them first.`
    );
  }

  // Delete children first (deepest first)
  for (const childId of descendantIds.reverse()) {
    await this.prisma.category.delete({ where: { id: childId } });
  }

  // Delete main category
  await this.prisma.category.delete({ where: { id } });

  return {
    message: 'Category deleted successfully',
  };
}


}
