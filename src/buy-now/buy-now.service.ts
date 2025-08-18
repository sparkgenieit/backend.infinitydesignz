import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PRODUCT_IMAGE_PATH } from '../config/constants';
import { CreateBuyNowDto } from './dto/create-buy-now.dto';
import { UpdateBuyNowDto } from './dto/update-buy-now.dto';

const formatImageUrl = (fileName: string | null | undefined) =>
  fileName ? `${PRODUCT_IMAGE_PATH}${fileName}` : null;

@Injectable()
export class BuyNowService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Replica of Cart's getUserCart response:
   * {
   *   items: [...],
   *   priceSummary: {
   *     totalMRP, discountOnMRP, couponDiscount, totalAfterDiscount,
   *     platformFee, shippingFee, finalPayable
   *   }
   * }
   */
  async getBuyNow(userId: number) {
    const rawItem = await this.prisma.buyNowItem.findUnique({
      where: { userId },
      include: {
        product: {
          include: {
            brand: true,
            color: true,
            size: true,
            images: true, // [{ url, alt }]
          },
        },
        variant: {
          include: {
            color: true,
            size: true,
            images: true, // [{ url, alt }]
          },
        },
      },
    });

    if (!rawItem) {
      const platformFee = 20;
      const shippingFee = 80;
      return {
        items: [],
        priceSummary: {
          totalMRP: 0,
          discountOnMRP: 0,
          couponDiscount: 0,
          totalAfterDiscount: 0,
          platformFee,
          shippingFee,
          finalPayable: platformFee + shippingFee,
        },
      };
    }

    const useVariant = rawItem.variant !== null;

    const mainImage = useVariant
      ? rawItem.variant?.images?.[0]?.url ||
        rawItem.product?.images?.[0]?.url ||
        null
      : rawItem.product?.images?.[0]?.url || null;

    const imageAlt = useVariant
      ? rawItem.variant?.images?.[0]?.alt ||
        rawItem.product?.images?.[0]?.alt ||
        ''
      : rawItem.product?.images?.[0]?.alt || '';

    const formattedImageUrl = formatImageUrl(mainImage);

    const price = useVariant
      ? rawItem.variant?.sellingPrice ?? rawItem.product?.sellingPrice
      : rawItem.product?.sellingPrice;

    const mrp = useVariant
      ? rawItem.variant?.mrp ?? rawItem.product?.mrp
      : rawItem.product?.mrp;

    const productData = {
      title: rawItem.product?.title,
      brand: rawItem.product?.brand?.name,
      price,
      mrp,
      color: useVariant
        ? rawItem.variant?.color?.label
        : rawItem.product?.color?.label,
      size: useVariant
        ? rawItem.variant?.size?.title
        : rawItem.product?.size?.title,
      imageUrl: formattedImageUrl,
      imageAlt,
    };

    const items = [
      {
        id: rawItem.id, // buyNowItem id
        productId: rawItem.productId,
        variantId: rawItem.variantId,
        quantity: rawItem.quantity,
        [useVariant ? 'variant' : 'product']: productData,
      },
    ];

    // --- price summary (replicated from Cart) ---
    let totalMRP = (mrp || 0) * rawItem.quantity;
    let totalSellingPrice = (price || 0) * rawItem.quantity;

    const appliedCoupon = await this.prisma.appliedCoupon.findFirst({
      where: { userId, orderId: null },
      include: { coupon: true },
    });

    let couponDiscount = 0;

    if (appliedCoupon?.coupon?.status) {
      const coupon = appliedCoupon.coupon;
      const now = new Date();
      const isValidDate =
        (!coupon.fromDate || coupon.fromDate <= now) &&
        (!coupon.toDate || coupon.toDate >= now);

      const meetsMinOrder = totalSellingPrice >= coupon.minOrderAmount;

      if (isValidDate && meetsMinOrder) {
        const eligibleAmount = totalSellingPrice;
        couponDiscount =
          coupon.priceType === 'PERCENTAGE'
            ? (coupon.value / 100) * eligibleAmount
            : Math.min(coupon.value, eligibleAmount);
      }
    }

    const platformFee = 20;
    const shippingFee = 80;

    return {
      items,
      priceSummary: {
        totalMRP,
        discountOnMRP: totalMRP - totalSellingPrice,
        couponDiscount,
        totalAfterDiscount: totalSellingPrice - couponDiscount,
        platformFee,
        shippingFee,
        finalPayable:
          totalSellingPrice - couponDiscount + platformFee + shippingFee,
      },
    };
  }

  /**
   * Set/replace the Buy Now item for the user.
   * Mirrors Cart "add" behavior and returns the same response shape.
   */
  async setBuyNow(userId: number, dto: CreateBuyNowDto) {
    // Validate variant belongs to product (avoid prisma.productVariant accessor)
    if (dto.variantId) {
      const productWithVariant = await this.prisma.product.findFirst({
        where: { id: dto.productId, variants: { some: { id: dto.variantId } } },
        select: { id: true },
      });
      if (!productWithVariant) {
        throw new BadRequestException(
          'Variant does not belong to the provided product',
        );
      }
    }

    await this.prisma.buyNowItem.upsert({
      where: { userId },
      create: {
        userId,
        productId: dto.productId,
        variantId: dto.variantId ?? null,
        quantity: dto.quantity ?? 1,
      },
      update: {
        productId: dto.productId,
        variantId: dto.variantId ?? null,
        quantity: dto.quantity ?? 1,
      },
    });

    return {
      message: 'Added to cart successfully.',
      data: await this.getBuyNow(userId),
    };
  }

  /**
   * Update quantity of Buy Now item; response mirrors Cart.
   */
  async updateBuyNow(userId: number, dto: UpdateBuyNowDto) {
    const existing = await this.prisma.buyNowItem.findUnique({ where: { userId } });
    if (!existing) {
      throw new NotFoundException('Cart item not found or unauthorized');
    }

    await this.prisma.buyNowItem.update({
      where: { userId },
      data: {
        quantity:
          typeof dto.quantity === 'number' ? dto.quantity : existing.quantity,
      },
    });

    return {
      message: 'Cart updated successfully.',
      data: await this.getBuyNow(userId),
    };
  }

  /**
   * Alias to satisfy controllers calling updateQuantity.
   */
  async updateQuantity(userId: number, dto: UpdateBuyNowDto) {
    return this.updateBuyNow(userId, dto);
  }

  /**
   * Clear Buy Now item; returns the same cart-like payload (empty items + priceSummary).
   */
  async clear(userId: number) {
    const existing = await this.prisma.buyNowItem.findUnique({ where: { userId } });
    if (existing) {
      await this.prisma.buyNowItem.delete({ where: { userId } });
    }
    return {
      message: 'Removed from cart successfully.',
      data: await this.getBuyNow(userId),
    };
  }
}
