import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async add(userId: number, dto: AddToWishlistDto) {
    try {
      const item = await this.prisma.wishlist.upsert({
        where: {
          userId_productId_variantId: {
            userId,
            productId: dto.productId,
            variantId: dto.variantId ?? 0,
          },
        },
        update: {
          quantity: dto.quantity ?? 1,
          size: dto.size,
        },
        create: {
          userId,
          productId: dto.productId,
          variantId: dto.variantId ?? 0,
          quantity: dto.quantity ?? 1,
          size: dto.size,
        },
      });

      return {
        message: 'Added to wishlist successfully.',
        data: item,
      };
    } catch (error) {
      throw new BadRequestException(`❌ Failed to add to wishlist: ${error.message}`);
    }
  }

  async getUserWishlist(userId: number) {
    const list = await this.prisma.wishlist.findMany({
      where: { userId },
      include: { product: true },
    });

    return {
      message: 'Wishlist fetched successfully.',
      data: list,
    };
  }

  async remove(userId: number, productId: number) {
    const result = await this.prisma.wishlist.deleteMany({
      where: {
        userId,
        productId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('❌ No wishlist item found to remove.');
    }

    return { message: 'Removed from wishlist successfully.' };
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

    // NOTE: Simulating cart addition logic here.
    return { message: '🛒 Moved to cart successfully.' };
  }
}
