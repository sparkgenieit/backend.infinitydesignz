import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { PRODUCT_IMAGE_PATH } from '../config/constants'; // ✅ Make sure this import exists at top

const formatImageUrl = (fileName: string | null) =>
  fileName ? `${PRODUCT_IMAGE_PATH}${fileName}` : null;

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async add(userId: number, dto: AddToWishlistDto) {
  try {
    // ✅ Check if user exists
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // ✅ Check if product exists
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException(' Product not found');

    // ✅ Determine the correct variantId
    let variantId = dto.variantId ?? 0;

    if (!dto.variantId || dto.variantId === 0) {
      // Get first variant of the product
      const firstVariant = await this.prisma.variant.findFirst({
        where: { productId: dto.productId },
        orderBy: { id: 'asc' },
      });

      if (!firstVariant) {
        throw new NotFoundException('❌ No variants found for this product.');
      }

      variantId = firstVariant.id;
    } else {
      // Variant was supplied — validate it exists
      const variant = await this.prisma.variant.findUnique({
        where: { id: dto.variantId },
      });

      if (!variant) {
        throw new NotFoundException(`❌ Variant ID ${dto.variantId} not found.`);
      }
    }

    // ✅ Upsert into wishlist
    const item = await this.prisma.wishlist.upsert({
      where: {
        userId_productId_variantId: {
          userId,
          productId: dto.productId,
          variantId,
        },
      },
      update: {
        productId: dto.productId,
        variantId,
      },
      create: {
        userId,
        productId: dto.productId,
        variantId,
      },
    });

    return {
      message: '✅ Added to wishlist successfully.',
      data: item,
    };
  } catch (error) {
    throw new BadRequestException(`❌ Failed to add to wishlist: \n${error.message}`);
  }
}

async getUserWishlist(userId: number) {
  const list = await this.prisma.wishlist.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          images: {
            where: { isMain: true },
            select: {
              url: true,
              alt: true,
            },
          },
          brand: {
            select: { name: true },
          },
        },
      },
      variant: {
        include: {
          images: {
            where: { isMain: true },
            select: {
              url: true,
              alt: true,
            },
          },
          size: true,
          color: true,
        },
      },
    },
  });

  return list.map((item) => {
    const image =
      item.variant?.images?.[0]?.url ||
      item.product?.images?.[0]?.url ||
      null;

    const imageAlt =
      item.variant?.images?.[0]?.alt ||
      item.product?.images?.[0]?.alt ||
      '';

    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      title: item.product?.title,
      brand: item.product?.brand?.name,
      price: item.variant?.sellingPrice || item.product?.sellingPrice,
      mrp: item.variant?.mrp || item.product?.mrp,
      color: item.variant?.color?.label,
      size: item.variant?.size?.title,
      imageUrl: formatImageUrl(image),
      imageAlt: imageAlt,
    };
  });
}

async remove(userId: number, wishlistId: number) {
  const wishlist = await this.prisma.wishlist.findUnique({
    where: { id: wishlistId },
  });

  if (!wishlist || wishlist.userId !== userId) {
    throw new NotFoundException('❌ Wishlist item not found or unauthorized');
  }

  await this.prisma.wishlist.delete({
    where: { id: wishlistId },
  });

  return { message: '✅ Removed from wishlist successfully.' };
}

  async moveToCart(userId: number, productId: number) {
    const item = await this.prisma.wishlist.findFirst({
      where: {
        userId,
        productId,
      },
    });

    if (!item) throw new NotFoundException('❌ Wishlist item not found.');

    await this.remove(userId, productId);

    // TODO: Replace with actual cart service logic
    return { message: '🛒 Moved to cart successfully.' };
  }
}
