import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PRODUCT_IMAGE_PATH } from '../../config/constants';
import { unlink } from 'fs/promises';
import { join } from 'path';

const formatImageUrl = (fileName: string | null) =>
  fileName ? `${PRODUCT_IMAGE_PATH}${fileName}` : null;

@Injectable()
export class ImagesService {
  constructor(private readonly prisma: PrismaService) {}

  /**  Save all product & variant images from form upload */
  async saveImages(productId: string, files: Express.Multer.File[]) {
    const parsedProductId = parseInt(productId);
    if (isNaN(parsedProductId)) throw new BadRequestException('Invalid product ID');

    const imageData = [];

    const fileMap: Record<string, Express.Multer.File[]> = {};
    for (const file of files) {
      if (!fileMap[file.fieldname]) fileMap[file.fieldname] = [];
      fileMap[file.fieldname].push(file);
    }

    // 🧹 Delete old product-level images
    if (fileMap.main_image || fileMap.multiple_images) {
      await this.prisma.image.deleteMany({
        where: {
          productId: parsedProductId,
          variantId: null,
        },
      });
    }

    //  Save product-level images
    if (fileMap.main_image?.[0]) {
      imageData.push({
        url: fileMap.main_image[0].filename,
        productId: parsedProductId,
        isMain: true,
      });
    }

    if (fileMap.multiple_images) {
      for (const file of fileMap.multiple_images) {
        imageData.push({
          url: file.filename,
          productId: parsedProductId,
          isMain: false,
        });
      }
    }

    //  Handle variant images
    const variants = await this.prisma.variant.findMany({
      where: { productId: parsedProductId },
    });

    for (const variant of variants) {
      const mainKey = `variant_${variant.id}_main`;
      const multiKey = `variant_${variant.id}_multiple`;

      if (fileMap[mainKey] || fileMap[multiKey]) {
        await this.prisma.image.deleteMany({
          where: { variantId: variant.id },
        });
      }

      if (fileMap[mainKey]?.[0]) {
        imageData.push({
          url: fileMap[mainKey][0].filename,
          productId: parsedProductId,
          variantId: variant.id,
          isMain: true,
        });
      }

      if (fileMap[multiKey]) {
        for (const file of fileMap[multiKey]) {
          imageData.push({
            url: file.filename,
            productId: parsedProductId,
            variantId: variant.id,
            isMain: false,
          });
        }
      }
    }

    if (imageData.length > 0) {
      await this.prisma.image.createMany({ data: imageData });
    }

    return {
      message: 'Images uploaded and replaced successfully.',
      count: imageData.length,
    };
  }

  /** 📦 Get formatted image groups for a product (main, additional, by variant) */
  async getImagesByProduct(productId: number) {
    const images = await this.prisma.image.findMany({
      where: { productId },
    });

    const formatted = images.map((img) => ({
      ...img,
      url: formatImageUrl(img.url),
    }));

    const productImages = formatted.filter((img) => img.variantId === null);
    const mainProductImage = productImages.find((img) => img.isMain);
    const additionalProductImages = productImages.filter((img) => !img.isMain);

    const variants: Record<number, { main: any | null; additional: any[] }> = {};
    for (const img of formatted) {
      if (img.variantId != null) {
        if (!variants[img.variantId]) {
          variants[img.variantId] = { main: null, additional: [] };
        }
        if (img.isMain) {
          variants[img.variantId].main = img;
        } else {
          variants[img.variantId].additional.push(img);
        }
      }
    }

    return {
      main: mainProductImage || null,
      additional: additionalProductImages,
      variants,
    };
  }

  /** 🔍 Get raw images for a variant */
  async getImagesByVariant(variantId: number) {
    const images = await this.prisma.image.findMany({
      where: { variantId },
    });

    return images.map((img) => ({
      ...img,
      url: formatImageUrl(img.url),
    }));
  }

  /**  Update image file or isMain flag */
  async updateImage(
    id: number,
    imageFile?: Express.Multer.File,
    body?: { isMain?: string }
  ) {
    const image = await this.prisma.image.findUnique({ where: { id } });
    if (!image) throw new NotFoundException(`Image with ID ${id} not found`);

    const payload: any = {};

    if (imageFile) {
      const oldPath = join(__dirname, '../../..', 'public', PRODUCT_IMAGE_PATH, image.url);
      try {
        await unlink(oldPath);
      } catch {
        console.warn('⚠️ Old image not found or already deleted');
      }
      payload.url = imageFile.filename;
    }

    if (body?.isMain !== undefined) {
      payload.isMain = body.isMain === 'true';
    }

    const updated = await this.prisma.image.update({
      where: { id },
      data: payload,
    });

    return {
      message: 'Image updated successfully',
      data: {
        ...updated,
        url: formatImageUrl(updated.url),
      },
    };
  }

  /** Delete image by ID */
  async deleteImage(id: number) {
    const image = await this.prisma.image.findUnique({ where: { id } });
    if (!image) throw new NotFoundException(`Image with ID ${id} not found`);

    const filePath = join(__dirname, '../../..', 'public', PRODUCT_IMAGE_PATH, image.url);
    try {
      await unlink(filePath);
    } catch {
      console.warn('⚠️ File already deleted or not found');
    }

    await this.prisma.image.delete({ where: { id } });

    return {
      message: `Image with ID ${id} deleted successfully`,
    };
  }
}
