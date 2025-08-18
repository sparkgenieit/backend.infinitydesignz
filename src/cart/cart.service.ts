
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { SyncCartDto } from './dto/sync-cart.dto';
import { PRODUCT_IMAGE_PATH } from '../config/constants';

const formatImageUrl = (fileName: string | null) =>
  fileName ? `${PRODUCT_IMAGE_PATH}${fileName}` : null;

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async addToCart(userId: number, dto: AddToCartDto) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundException('User not found');

  const product = await this.prisma.product.findUnique({
    where: { id: dto.productId },
  });
  if (!product) throw new NotFoundException('Product not found');

  // Optional variant check
  let variantId: number | null = null;
  if (dto.variantId && dto.variantId > 0) {
    const variant = await this.prisma.variant.findUnique({
      where: { id: dto.variantId },
    });
    if (!variant) throw new NotFoundException(`Variant ID ${dto.variantId} not found.`);
    variantId = dto.variantId;
  }

  // 🔍 Look for existing match (with or without variant)
  const existing = await this.prisma.cartItem.findFirst({
    where: {
      userId,
      productId: dto.productId,
      variantId: variantId ?? null,
    },
  });

  let item;
  if (existing) {
    // 🔁 Update quantity if match found
    item = await this.prisma.cartItem.update({
      where: { id: existing.id },
      data: {
        quantity: existing.quantity + dto.quantity,
      },
    });
  } else {
    // ➕ Create new cart item
    item = await this.prisma.cartItem.create({
      data: {
        userId,
        productId: dto.productId,
        variantId: variantId,
        quantity: dto.quantity,
      },
    });
  }

 return {
  message: ' Added to cart successfully.',
  data: await this.getUserCart(userId),
};
}

async getUserCart(userId: number) {
  const allCartItems = await this.prisma.cartItem.findMany({
    where: { userId },
  });

  const filteredCartItems = [];

  for (const item of allCartItems) {
    const product = await this.prisma.product.findUnique({
      where: { id: item.productId },
      include: {
        images: { where: { isMain: true }, select: { url: true, alt: true } },
        brand: { select: { name: true } },
        color: { select: { label: true } },
        size: { select: { title: true } },
      },
    });

    if (!product) continue; // skip deleted products

    const variant = item.variantId
      ? await this.prisma.variant.findUnique({
          where: { id: item.variantId },
          include: {
            images: { where: { isMain: true }, select: { url: true, alt: true } },
            size: { select: { title: true } },
            color: { select: { label: true } },
          },
        })
      : null;

    filteredCartItems.push({ ...item, product, variant });
  }

  let totalMRP = 0;
  let totalSellingPrice = 0;

  const items = filteredCartItems.map((item) => {
    const useVariant = item.variant !== null;

    const mainImage = useVariant
      ? item.variant?.images?.[0]?.url || item.product?.images?.[0]?.url || null
      : item.product?.images?.[0]?.url || null;

    const imageAlt = useVariant
      ? item.variant?.images?.[0]?.alt || item.product?.images?.[0]?.alt || ''
      : item.product?.images?.[0]?.alt || '';

    const formattedImageUrl = formatImageUrl(mainImage);

    const price = useVariant
      ? item.variant?.sellingPrice ?? item.product?.sellingPrice
      : item.product?.sellingPrice;

    const mrp = useVariant
      ? item.variant?.mrp ?? item.product?.mrp
      : item.product?.mrp;

    totalMRP += (mrp || 0) * item.quantity;
    totalSellingPrice += (price || 0) * item.quantity;

    const productData = {
      title: item.product?.title,
      brand: item.product?.brand?.name,
      price,
      mrp,
      color: useVariant
        ? item.variant?.color?.label
        : item.product?.color?.label,
      size: useVariant
        ? item.variant?.size?.title
        : item.product?.size?.title,
      imageUrl: formattedImageUrl,
      imageAlt,
    };

    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      [useVariant ? 'variant' : 'product']: productData,
    };
  });

  // ✅ Fetch applied coupon (if not yet used in order)
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


  async removeFromCart(userId: number, cartId: number) {
    const cart = await this.prisma.cartItem.findUnique({
      where: { id: cartId },
    });

    if (!cart || cart.userId !== userId) {
      throw new NotFoundException('Cart item not found or unauthorized');
    }

    await this.prisma.cartItem.delete({
      where: { id: cartId },
    });

  return {
  message: 'Removed from cart successfully.',
  data: await this.getUserCart(userId),
};
  }

  async updateCart(userId: number, cartId:number,dto: UpdateCartDto) {
    const cart = await this.prisma.cartItem.findFirst({
      where: {
        userId,
       id: cartId,
      },
    });

    if (!cart) {
      throw new NotFoundException('Cart item not found');
    }

await this.prisma.cartItem.update({
  where: { id: cart.id },
  data: {
    quantity: dto.quantity,
  },
});

return {
  message: ' Cart updated successfully.',
  data: await this.getUserCart(userId),
};
  }

async syncGuestCart(userId: number, dto: SyncCartDto) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundException('User not found');

  for (const guestItem of dto.items) {
    let productId = guestItem.productId;

    //  Check if variant exists and get real productId
    if (guestItem.variantId) {
      const variant = await this.prisma.variant.findUnique({
        where: { id: guestItem.variantId },
        select: { productId: true },
      });

      if (!variant) {
        throw new NotFoundException(`Invalid variant ID: ${guestItem.variantId}`);
      }

      productId = variant.productId;
    }

    // 🔍 Check for existing item in user's cart (product + variant match)
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        userId,
        productId,
        variantId: guestItem.variantId ?? null,
      },
    });

    if (existingItem) {
      // 🔁 Update quantity
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + guestItem.quantity,
        },
      });
    } else {
      // ➕ Add new cart item
      await this.prisma.cartItem.create({
        data: {
          userId,
          productId,
          variantId: guestItem.variantId ?? null,
          quantity: guestItem.quantity,
        },
      });
    }
  }

  return {
    message: ' Guest cart synced successfully with merge.',
    data: await this.getUserCart(userId),
  };
}


}
