import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { BuyNowDto } from "./dto/buy-now.dto";

type ListOrdersParams = {
  status?: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  orderId?: string;     // numeric "123" or "ORD00000123"
  dateFrom?: string;    // "YYYY-MM-DD" or ISO
  dateTo?: string;      // "YYYY-MM-DD" or ISO
  active?: boolean;     // Active/Inactive toggle
  orderFrom?: string;   // "web" | "app"
  page?: number;        // default 1
  pageSize?: number;    // default 10
};


@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

async placeOrder(dto: CreateOrderDto, userId: number) {
  const {
    addressId,
    couponId,
    items,
    subtotal,
    shippingFee,
    gst,
    totalAmount,
    note,
  } = dto;

  //  Validate user exists
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundException('User not found');

  //  Validate address exists and belongs to user
  const address = await this.prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!address) {
    throw new BadRequestException('Address not found or unauthorized');
  }

  //  Validate coupon (if provided)
  if (couponId) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id: couponId },
    });
    if (!coupon) {
      throw new BadRequestException(`Invalid coupon ID: ${couponId}`);
    }
  }

  //  Validate each product and (optional) variant
  for (const item of items) {
    const product = await this.prisma.product.findUnique({
      where: { id: item.productId },
    });
    if (!product) {
      throw new BadRequestException(`Product ID ${item.productId} not found`);
    }

    if (item.variantId !== undefined && item.variantId !== null) {
      const variant = await this.prisma.variant.findUnique({
        where: { id: item.variantId },
      });
      if (!variant) {
        throw new BadRequestException(`Variant ID ${item.variantId} not found`);
      }
    }
  }

  //  Create the order
  const order = await this.prisma.order.create({
    data: {
      user: { connect: { id: userId } },
      address: { connect: { id: addressId } },
      paymentMethod: 'COD',
      coupon: couponId ? { connect: { id: couponId } } : undefined,
      subtotal,
      shippingFee,
      gst,
      totalAmount,
      note,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
      },
      payment: {
        create: {
          method: 'COD',
          status: 'PENDING',
        },
      },
    },
    include: {
      items: true,
      payment: true,
    },
  });

  return order;
}


 async listOrdersDetails(userId: number) {
  const orders = await this.prisma.order.findMany({
    where: { userId },
    select: { id: true }, // only fetch IDs for detailed processing
    orderBy: { createdAt: "desc" },
  });

  const detailedOrders = await Promise.all(
    orders.map((order) => this.getOrderDetails(order.id))
  );

  return detailedOrders;
}


  async listUserOrders(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }


async listOrders(params: ListOrdersParams = {}) {
  const {
    status,
    paymentStatus,
    orderId,
    dateFrom,
    dateTo,
    active,
    orderFrom,
    page = 1,
    pageSize = 10,
  } = params;

  const AND: any[] = [];

  // Delivery Status (Order.status)
  if (status) {
    AND.push({ status });
  }

  // Payment Status
  if (paymentStatus) {
    AND.push({ payment: { is: { status: paymentStatus } } });
  }

  // Order ID search
  if (orderId && orderId.trim()) {
    const raw = orderId.trim().toUpperCase();
    const numeric = Number(raw.replace(/^ORD/, ''));
    if (!Number.isNaN(numeric)) {
      AND.push({ id: numeric });
    }
  }

  // Date filter
  if (dateFrom || dateTo) {
    const createdAt: any = {};
    if (dateFrom) createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      createdAt.lte = end;
    }
    AND.push({ createdAt });
  }

  // Active/Inactive
  if (typeof active === 'boolean') {
    if (active) {
      AND.push({ NOT: { status: 'CANCELLED' as const } });
    } else {
      AND.push({ status: 'CANCELLED' as const });
    }
  }

  // Order From
  if (orderFrom) {
    AND.push({ orderFrom });
  }

  const where = AND.length ? { AND } : undefined;

  // Pagination
  const take = Math.max(1, Number(pageSize));
  const skip = Math.max(0, (Number(page) - 1) * take);

  // Total count
  const total = await this.prisma.order.count({ where });

  // Fetch data
  const rows = await this.prisma.order.findMany({
    where,
    include: {
      items: { select: { quantity: true } },
      payment: { select: { status: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  });

  // Map to grid shape
  const data = rows.map((o) => {
    const qty = (o.items ?? []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
    const orderNo = `ORD${String(o.id).padStart(8, '0')}`;
    return {
      id: o.id,
      orderNo,
      qty,
      orderDate: o.createdAt,
      price: o.totalAmount,
      orderFrom: o.orderFrom,
      paymentStatus: o.payment?.status ?? null,
      status: o.status,
    };
  });

  return {
    data,
    pagination: {
      total,
      page: Number(page),
      pageSize: take,
      totalPages: Math.max(1, Math.ceil(total / take)),
    },
  };
}


 async generateInvoice(orderId: number) {
  const order = await this.getOrderDetails(orderId);
  return {
    invoiceNumber: `INV-${order.id}`,
    date: order.createdAt,
    items: order.items,
    totalAmount: order.priceSummary.finalPayable,
    shipping: order.priceSummary.shippingFee,
    gst: order.priceSummary.totalAfterDiscount * 0.18, // or fetch real GST if available
  };
}

async getOrderDetails(orderId: number) {
  const order = await this.prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              brand: { select: { name: true } },
              images: { where: { isMain: true }, select: { url: true, alt: true } },
              color: { select: { label: true } },
              size: { select: { title: true } },
            },
          },
          variant: {
            include: {
              images: { where: { isMain: true }, select: { url: true, alt: true } },
              color: { select: { label: true } },
              size: { select: { title: true } },
            },
          },
        },
      },
      payment: true,
      address: true,
      coupon: true,
    },
  });

  if (!order) throw new NotFoundException('Order not found');

  let totalMRP = 0;
  let totalSellingPrice = 0;

  const items = order.items.map((item) => {
    const useVariant = item.variant !== null;

    const price = Number(item.price) || 0; // per-unit price saved on item
    const mrp = useVariant
      ? Number(item.variant?.mrp ?? item.product?.mrp ?? 0)
      : Number(item.product?.mrp ?? 0);

    totalMRP += mrp * item.quantity;
    totalSellingPrice += price * item.quantity;

    const mainImage = useVariant
      ? item.variant?.images?.[0]?.url || item.product?.images?.[0]?.url || null
      : item.product?.images?.[0]?.url || null;

    const imageAlt = useVariant
      ? item.variant?.images?.[0]?.alt || item.product?.images?.[0]?.alt || ''
      : item.product?.images?.[0]?.alt || '';

    const productData = {
      title: item.product?.title,
      brand: item.product?.brand?.name,
      price,
      mrp,
      color: useVariant ? item.variant?.color?.label : item.product?.color?.label,
      size: useVariant ? item.variant?.size?.title : item.product?.size?.title,
      imageUrl: mainImage,
      imageAlt,
    };

    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      total: item.total,
      [useVariant ? 'variant' : 'product']: productData,
    };
  });

  // 🔖 Fees (keep in sync with order creation logic)
  const platformFee = 20;
  const shippingFee = Number(order.shippingFee) || 0;

  // ✅ Derive coupon discount from stored totals (no re-validation)
  // finalPayable = totalSellingPrice - couponDiscount + platformFee + shippingFee
  // ⇒ couponDiscount = totalSellingPrice + platformFee + shippingFee - order.totalAmount
  const storedFinal = Number(order.totalAmount) || 0;
  let couponDiscount = totalSellingPrice + platformFee + shippingFee - storedFinal;
  // Safety clamp
  if (!order.coupon) couponDiscount = 0; // no coupon linked → no discount shown
  couponDiscount = Math.max(0, Math.min(totalSellingPrice, Math.round(couponDiscount * 100) / 100));

  return {
    id: order.id,
    createdAt: order.createdAt,
    address: order.address,
    payment: order.payment,
    coupon: order.coupon
      ? {
          code: order.coupon.code,
          discount: couponDiscount,
        }
      : null,
    items,
    priceSummary: {
      totalMRP,
      discountOnMRP: totalMRP - totalSellingPrice,
      couponDiscount,
      totalAfterDiscount: totalSellingPrice - couponDiscount,
      platformFee,
      shippingFee,
      finalPayable: totalSellingPrice - couponDiscount + platformFee + shippingFee,
    },
  };
}

/** Place a single-item order directly from PDP ("Buy Now") using client-provided discount */
async buyNow(dto: BuyNowDto, userId: number) {
  const {
    productId,
    variantId,
    quantity = 1,
    addressId,
    note,
    couponId,               // optional: link order -> coupon
    couponDiscount = 0,     // final discount already computed on UI
  } = dto;

  if (!productId || !addressId) {
    throw new BadRequestException('productId and addressId are required');
  }
  if (quantity <= 0) {
    throw new BadRequestException('Quantity must be at least 1');
  }

  // Validate user & address
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundException('User not found');

  const address = await this.prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) {
    throw new BadRequestException('Invalid address');
  }

  // Load product & optional variant
  const product = await this.prisma.product.findUnique({
    where: { id: productId },
    include: { brand: true, size: true, color: true },
  });
  if (!product) throw new NotFoundException('Product not found');

  const variant = variantId
    ? await this.prisma.variant.findUnique({ where: { id: variantId } })
    : null;

  if (variantId && !variant) {
    throw new BadRequestException(`Variant ID ${variantId} not found`);
  }
  if (variant && variant.productId !== product.id) {
    throw new BadRequestException('Variant does not belong to the product');
  }

  // Stock check
  if (variant) {
    if (variant.stock !== null && variant.stock < quantity) {
      throw new BadRequestException('Requested quantity not available');
    }
  } else {
    if (product.stock !== null && product.stock < quantity) {
      throw new BadRequestException('Requested quantity not available');
    }
  }

  // Pricing
  const unitPrice = (variant?.sellingPrice ?? product.sellingPrice);
  const subtotal  = unitPrice * quantity;

  // Trust UI discount, but cap to [0, subtotal]
  const safeDiscount = Math.max(0, Math.min(subtotal, Number(couponDiscount) || 0));

  // Fees (match cart logic)
  const platformFee = 20;
  const shippingFee = 80;

  const totalAfterDiscount = Math.max(0, subtotal - safeDiscount);
  const gst = Math.round(totalAfterDiscount * 0.18 * 100) / 100;
  const totalAmount = totalAfterDiscount + platformFee + shippingFee;

  // If a couponId was supplied, verify existence (no revalidation of rules/amount)
// If a couponId was supplied, verify existence (no revalidation of rules/amount)
let couponConnect: { connect: { id: number } } | undefined;

if (couponId != null) { // covers undefined & null
  const id = Number(couponId);
  if (!Number.isFinite(id)) {
    throw new BadRequestException('couponId must be a number');
  }

  const coupon = await this.prisma.coupon.findFirst({
    where: { id, status: true },
    select: { id: true },
  });

  if (!coupon) {
    throw new BadRequestException(`Invalid or inactive coupon ID: ${couponId}`);
  }

  couponConnect = { connect: { id } };
}

  // Create order
  const order = await this.prisma.order.create({
    data: {
      user: { connect: { id: userId } },
      address: { connect: { id: addressId } },
      paymentMethod: 'COD',
      coupon: couponConnect,                 // only connects if verified above
      subtotal,
      shippingFee,
      gst,
      totalAmount,
      note,
      items: {
        create: [{
          productId,
          variantId: variantId ?? null,
          quantity,
          price: unitPrice,                  // per-unit
          total: subtotal,                   // before fees/discount
        }],
      },
      payment: {
        create: { method: 'COD', status: 'PENDING' },
      },
    },
    include: { items: true, payment: true },
  });

  // Decrement stock
  if (variant) {
    await this.prisma.variant.update({
      where: { id: variant.id },
      data: { stock: variant.stock !== null ? Math.max(0, variant.stock - quantity) : null },
    });
  } else {
    await this.prisma.product.update({
      where: { id: product.id },
      data: { stock: product.stock !== null ? Math.max(0, product.stock - quantity) : null },
    });
  }

  return this.getOrderDetails(order.id);
}


}
