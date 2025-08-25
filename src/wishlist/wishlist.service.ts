import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { PRODUCT_IMAGE_PATH } from '../config/constants';

const formatImageUrl = (fileName: string | null) =>
  fileName ? `${PRODUCT_IMAGE_PATH}${fileName}` : null;

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async add(userId: number, dto: AddToWishlistDto) {
    try {
      // 1) Ensure user exists
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      // 2) Resolve product by id OR sku (and validate)
      const productId =
        typeof dto.productId === 'string'
          ? Number(dto.productId)
          : dto.productId;

      if ((productId === undefined || Number.isNaN(productId) || productId <= 0) && !dto.sku) {
        throw new BadRequestException('productId or sku is required');
      }

      const product = await this.prisma.product.findUnique({
        where: productId && productId > 0 ? { id: productId } : { sku: dto.sku! },
      });
      if (!product) throw new NotFoundException('Product not found');

      // 3) Optional variant resolution (only if provided and >0)
      let variantId: number | null = null;
      if (dto.variantId !== undefined && dto.variantId !== null) {
        const vId = typeof dto.variantId === 'string' ? Number(dto.variantId) : dto.variantId;
        if (!Number.isFinite(vId) || vId <= 0) {
          throw new BadRequestException('variantId, if provided, must be a positive number');
        }
        const variant = await this.prisma.variant.findUnique({ where: { id: vId } });
        if (!variant) throw new NotFoundException(`Variant ID ${vId} not found`);
        variantId = vId;
      }

      // 4) Upsert wishlist item (prevent duplicates for same user/product/variant)
      const existing = await this.prisma.wishlist.findFirst({
        where: { userId, productId: product.id, variantId },
      });

      const item = existing
        ? await this.prisma.wishlist.update({
            where: { id: existing.id },
            data: { productId: product.id, variantId },
          })
        : await this.prisma.wishlist.create({
            data: { userId, productId: product.id, variantId },
          });

      return { message: 'Added to wishlist successfully.', data: item };
    } catch (error: any) {
      // Surface clean message, keep original for logs if you have one
      throw new BadRequestException(`Failed to add to wishlist: ${error.message}`);
    }
  }

  async getUserWishlist(userId: number) {
    const list = await this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: { where: { isMain: true }, select: { url: true, alt: true } },
            brand: { select: { name: true } },
            color: { select: { label: true } },
            size: { select: { title: true } },
          },
        },
        variant: {
          include: {
            images: { where: { isMain: true }, select: { url: true, alt: true } },
            size: { select: { title: true } },
            color: { select: { label: true } },
          },
        },
      },
    });

    return list.map((item) => {
      const useVariant = item.variantId !== null;

      const mainImage = useVariant
        ? item.variant?.images?.[0]?.url || item.product?.images?.[0]?.url || null
        : item.product?.images?.[0]?.url || null;

      const imageAlt = useVariant
        ? item.variant?.images?.[0]?.alt || item.product?.images?.[0]?.alt || ''
        : item.product?.images?.[0]?.alt || '';

      const formattedImageUrl = formatImageUrl(mainImage);

      const response: any = {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
      };

      if (useVariant) {
        response.variant = {
          title: item.product?.title,
          brand: item.product?.brand?.name,
          price: item.variant?.sellingPrice ?? item.product?.sellingPrice,
          mrp: item.variant?.mrp ?? item.product?.mrp,
          color: item.variant?.color?.label ?? null,
          size: item.variant?.size?.title ?? null,
          imageUrl: formattedImageUrl,
          imageAlt,
        };
      } else {
        response.product = {
          title: item.product?.title,
          brand: item.product?.brand?.name,
          price: item.product?.sellingPrice,
          mrp: item.product?.mrp,
          color: item.product?.color?.label ?? null,
          size: item.product?.size?.title ?? null,
          imageUrl: formattedImageUrl,
          imageAlt,
        };
      }

      return response;
    });
  }

  async remove(userId: number, wishlistId: number) {
    const wishlist = await this.prisma.wishlist.findUnique({ where: { id: wishlistId } });
    if (!wishlist || wishlist.userId !== userId) {
      throw new NotFoundException('Wishlist item not found or unauthorized');
    }
    await this.prisma.wishlist.delete({ where: { id: wishlistId } });
    return { message: 'Removed from wishlist successfully.' };
  }

  async moveToCart(userId: number, productId: number) {
    const item = await this.prisma.wishlist.findFirst({ where: { userId, productId } });
    if (!item) throw new NotFoundException('Wishlist item not found.');
    await this.remove(userId, item.id);
    return { message: '🛒 Moved to cart successfully.' };
  }
}
