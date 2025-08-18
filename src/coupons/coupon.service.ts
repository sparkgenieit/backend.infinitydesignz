import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Prisma } from '@prisma/client';

const PLATFORM_FEE = 20;
const SHIPPING_FEE_DEFAULT = 80;

type NormalizedItem = {
  id?: number;
  productId: number;
  variantId?: number | null;
  quantity: number;
  product: {
    id: number;
    title: string;
    mrp: number | null;
    sellingPrice: number | null;
    brand?: { id: number } | null;
    categoryId: number;
  };
  variant?: {
    id: number;
    mrp: number | null;
    sellingPrice: number | null;
    size?: any;
    color?: any;
    images?: any[];
    productId: number;
  } | null;
};

@Injectable()
export class CouponService {
  constructor(private prisma: PrismaService) {}

  /** Create coupon with duplicate code protection */
  async create(data: CreateCouponDto) {
    try {
      const coupon = await this.prisma.coupon.create({ data });
      return { message: 'Coupon created successfully', data: coupon };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Coupon code already exists');
      }
      throw error;
    }
  }

  /** List all coupons */
  findAll() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  /** Find one coupon by ID */
  async findOne(id: number) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async findByCode(code: string) {
  const coupon = await this.prisma.coupon.findUnique({ where: { code } });
  if (!coupon) throw new NotFoundException('Coupon not found');
  return coupon;
}
  /** Update coupon with error handling */
  async update(id: number, data: UpdateCouponDto) {
    try {
      const updated = await this.prisma.coupon.update({ where: { id }, data });
      return { message: 'Coupon updated successfully', data: updated };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Coupon not found');
      }
      throw error;
    }
  }

  /** Delete coupon with existence check */
  async remove(id: number) {
    const exists = await this.prisma.coupon.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Coupon not found');
    await this.prisma.coupon.delete({ where: { id } });
    return { message: 'Coupon deleted successfully' };
  }

  /** Get a coupon by its code (active only) */
  private async getActiveCouponByCode(code: string) {
    const coupon = await this.prisma.coupon.findFirst({
      where: { code, status: true },
    });
    if (!coupon) throw new NotFoundException('Invalid or inactive coupon');
    return coupon;
  }

  // ───────────────────────────
  // Public: APPLY TO CART (uses current cart state)
  // ───────────────────────────
  async applyCouponToCart(userId: number, code: string) {
    const coupon = await this.getActiveCouponByCode(code);

    // persist selection for user (same behavior as before)
    await this.prisma.appliedCoupon.deleteMany({ where: { userId } });
    await this.prisma.appliedCoupon.create({
      data: { userId, couponId: coupon.id },
    });

    const items = await this.loadCartItemsNormalized(userId);
    if (!items.length) {
      throw new BadRequestException('Cart is empty or items are invalid');
    }

    const listSubCategoryName = await this.getListSubCategoryName(coupon);
    return this.computeCouponPricing(coupon, items, listSubCategoryName);
  }

  // ───────────────────────────
  // Public: APPLY TO SINGLE ITEM (BUY NOW current state)
  // ───────────────────────────
  async applyCouponForItem(userId: number, code: string) {
    const coupon = await this.getActiveCouponByCode(code);

    // persist selection for user (mirrors cart behavior)
    await this.prisma.appliedCoupon.deleteMany({ where: { userId } });
    await this.prisma.appliedCoupon.create({
      data: { userId, couponId: coupon.id },
    });

    const items = await this.loadBuyNowNormalized(userId);
    const listSubCategoryName = await this.getListSubCategoryName(coupon);
    return this.computeCouponPricing(coupon, items, listSubCategoryName);
  }

  // ───────────────────────────
  // PRIVATE HELPERS
  // ───────────────────────────

  /** Normalize full cart to pricing items */
  private async loadCartItemsNormalized(userId: number): Promise<NormalizedItem[]> {
    const raw = await this.prisma.cartItem.findMany({ where: { userId } });
    const items: NormalizedItem[] = [];

    for (const item of raw) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          brand: true,
          category: true,
          images: { where: { isMain: true }, select: { url: true, alt: true } },
        },
      });
      if (!product) continue;

      const variant = item.variantId
        ? await this.prisma.variant.findUnique({
            where: { id: item.variantId },
            include: {
              images: { where: { isMain: true }, select: { url: true, alt: true } },
              size: true,
              color: true,
            },
          })
        : null;

      items.push({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId ?? null,
        quantity: item.quantity,
        product: {
          id: product.id,
          title: product.title,
          mrp: product.mrp,
          sellingPrice: product.sellingPrice,
          brand: product.brand ? { id: product.brand.id } : null,
          categoryId: product.categoryId,
        },
        variant: variant
          ? {
              id: variant.id,
              mrp: variant.mrp,
              sellingPrice: variant.sellingPrice,
              size: variant.size,
              color: variant.color,
              images: variant.images,
              productId: variant.productId,
            }
          : null,
      });
    }

    return items;
  }

  /** Normalize current Buy Now item to pricing items */
  private async loadBuyNowNormalized(userId: number): Promise<NormalizedItem[]> {
    const buyNow = await this.prisma.buyNowItem.findUnique({ where: { userId } });
    if (!buyNow) throw new BadRequestException('No Buy Now item found');

    const product = await this.prisma.product.findUnique({
      where: { id: buyNow.productId },
      include: {
        brand: true,
        category: true,
        images: { where: { isMain: true }, select: { url: true, alt: true } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');

    const variant = buyNow.variantId
      ? await this.prisma.variant.findUnique({
          where: { id: buyNow.variantId },
          include: {
            images: { where: { isMain: true }, select: { url: true, alt: true } },
            size: true,
            color: true,
          },
        })
      : null;

    return [
      {
        productId: buyNow.productId,
        variantId: buyNow.variantId ?? null,
        quantity: buyNow.quantity,
        product: {
          id: product.id,
          title: product.title,
          mrp: product.mrp,
          sellingPrice: product.sellingPrice,
          brand: product.brand ? { id: product.brand.id } : null,
          categoryId: product.categoryId,
        },
        variant: variant
          ? {
              id: variant.id,
              mrp: variant.mrp,
              sellingPrice: variant.sellingPrice,
              size: variant.size,
              color: variant.color,
              images: variant.images,
              productId: variant.productId,
            }
          : null,
      },
    ];
  }

  /** Resolve category name for LIST_SUBMENU message, otherwise '' */
  private async getListSubCategoryName(coupon: any): Promise<string> {
    if (coupon?.type === 'LIST_SUBMENU' && coupon.listSubMenuId) {
      const list = await this.prisma.category.findUnique({
        where: { id: coupon.listSubMenuId },
      });
      return list?.title ?? '';
    }
    return '';
  }

  /** Single common calculator used by both cart & buy-now */
  private computeCouponPricing(
    coupon: any,
    items: NormalizedItem[],
    listSubCategoryName: string
  ) {
    let totalMRP = 0;
    let totalSellingPrice = 0;
    let eligibleAmount = 0;

    const responseItems = items.map((it) => {
      const useVariant = !!it.variant;

      const unitPrice = useVariant
        ? it.variant?.sellingPrice ?? it.product?.sellingPrice ?? 0
        : it.product?.sellingPrice ?? 0;

      const unitMrp = useVariant
        ? it.variant?.mrp ?? it.product?.mrp ?? 0
        : it.product?.mrp ?? 0;

      const price = unitPrice;
      const mrp = unitMrp;

      totalMRP += mrp * it.quantity;
      totalSellingPrice += price * it.quantity;

      const isBrandMatch =
        coupon.type === 'BRAND' &&
        coupon.brandId &&
        it.product?.brand?.id === coupon.brandId;

      const isListSubMatch =
        coupon.type === 'LIST_SUBMENU' &&
        coupon.listSubMenuId &&
        it.product?.categoryId === coupon.listSubMenuId;

      if (isBrandMatch || isListSubMatch) {
        eligibleAmount += price * it.quantity;
      }

      return {
        id: it.id,
        productId: it.productId,
        variantId: it.variantId ?? null,
        quantity: it.quantity,
        price,
        mrp,
        title: it.product?.title,
      };
    });

    // Min order check
    if (coupon.minOrderAmount && totalSellingPrice < coupon.minOrderAmount) {
      throw new BadRequestException(
        `Minimum order value ₹${coupon.minOrderAmount} required for this coupon`
      );
    }

    // LIST_SUBMENU mismatch error
    if (eligibleAmount === 0 && coupon.type === 'LIST_SUBMENU') {
      throw new BadRequestException(
        `This coupon works only for ‘${listSubCategoryName}’ category products.`
      );
    }

    if (eligibleAmount === 0) {
      eligibleAmount = totalSellingPrice;
    }

    // Discount calc
    let couponDiscount = 0;
    if (coupon.priceType === 'PERCENTAGE') {
      couponDiscount = (coupon.value / 100) * eligibleAmount;
    } else {
      couponDiscount = Math.min(coupon.value, eligibleAmount);
    }

    const platformFee = PLATFORM_FEE;
    const shippingFee = SHIPPING_FEE_DEFAULT;

    return {
      items: responseItems,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount: couponDiscount,
      },
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
}
