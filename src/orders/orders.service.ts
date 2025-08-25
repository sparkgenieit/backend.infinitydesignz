import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { BuyNowDto } from "./dto/buy-now.dto";
// orders.service.ts
import { OrderStatus, PaymentStatus,OrderItemStatus  } from '@prisma/client';
import { UpdateOrderItemDto, RequestCancelItemDto } from './dto/update-order-item.dto';
const ORDER_FINAL_STATES: OrderStatus[] = ['DELIVERED', 'CANCELLED'] as any;

type UpdateOrderPayload =
  | string
  | {
      status?: OrderStatus | string;
      paymentStatus?: PaymentStatus | string;
      note?: string;
    };
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


type IncomingOrderItem = {
  productId: number;
  variantId?: number | null;
  quantity: number;
  price: number;   // per-unit price
  total: number;   // line total
};

function normalizeItems(input: unknown): IncomingOrderItem[] {
  if (Array.isArray(input)) return input as IncomingOrderItem[];

  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed as IncomingOrderItem[];
      if (parsed && typeof parsed === 'object') {
        return Object.values(parsed as Record<string, unknown>) as IncomingOrderItem[];
      }
      return [];
    } catch {
      return [];
    }
  }

  if (input && typeof input === 'object') {
    return Object.values(input as Record<string, unknown>) as IncomingOrderItem[];
  }

  return [];
}


@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

async placeOrder(dto: CreateOrderDto, userId: number) {
  const {
    addressId,
    couponId,
    subtotal,
    shippingFee,
    gst,
    totalAmount,
    note,
    paymentMethod,
  } = dto as any;

  // Normalize & validate items (survives ValidationPipe + form-data cases)
  const itemsArr: IncomingOrderItem[] = normalizeItems((dto as any).items);
  if (!itemsArr.length) {
    throw new BadRequestException('Items must be a non-empty array');
  }
  for (const [idx, it] of itemsArr.entries()) {
    if (
      !it ||
      typeof it.productId !== 'number' ||
      typeof it.quantity !== 'number' ||
      it.quantity <= 0
    ) {
      throw new BadRequestException(`Invalid item at index ${idx}`);
    }
  }

  // Validate user
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundException('User not found');

  // Validate address belongs to user
  const address = await this.prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!address) {
    throw new BadRequestException('Address not found or unauthorized');
  }

  // Validate coupon (optional)
  if (couponId) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id: couponId },
    });
    if (!coupon) {
      throw new BadRequestException(`Invalid coupon ID: ${couponId}`);
    }
  }

  // Validate products/variants
  for (const item of itemsArr) {
    const product = await this.prisma.product.findUnique({
      where: { id: item.productId },
    });
    if (!product) {
      throw new BadRequestException(`Product ID ${item.productId} not found`);
    }

    if (item.variantId != null) {
      const variant = await this.prisma.variant.findUnique({
        where: { id: item.variantId },
      });
      if (!variant) {
        throw new BadRequestException(`Variant ID ${item.variantId} not found`);
      }
      if (variant.productId !== item.productId) {
        throw new BadRequestException(
          `Variant ${item.variantId} does not belong to product ${item.productId}`
        );
      }
    }
  }

  // Create order
  const order = await this.prisma.order.create({
    data: {
      user: { connect: { id: userId } },
      address: { connect: { id: addressId } },
      paymentMethod: paymentMethod ?? 'COD',
      coupon: couponId ? { connect: { id: couponId } } : undefined,
      subtotal,
      shippingFee,
      gst,
      totalAmount,
      note,
      items: {
        create: itemsArr.map((item) => ({
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
          price: item.price, // per-unit
          total: item.total, // line total before fees
        })),
      },
      payment: {
        create: {
          method: paymentMethod ?? 'COD',
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

// OrdersService.ts

// orders.service.ts
async getOrderDetails(orderId: number) {
  // 1) Fetch the order WITHOUT including user (avoid Prisma's required-rel error)
  const order = await this.prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              brand:  { select: { name: true } },
              images: { where: { isMain: true }, select: { url: true, alt: true } },
              color:  { select: { label: true } },
              size:   { select: { title: true } },
            },
          },
          variant: {
            include: {
              images: { where: { isMain: true }, select: { url: true, alt: true } },
              color:  { select: { label: true } },
              size:   { select: { title: true } },
            },
          },
        },
      },
      payment: true,
      address: true,
      coupon:  true,
      // 🚫 no `user` here
    },
  });

  if (!order) throw new NotFoundException('Order not found');

  // 2) Fetch user separately; handle orphaned order safely
  const userRecord = await this.prisma.user.findUnique({
    where: { id: order.userId },
    select: { id: true, name: true, phone: true, email: true },
  });

  const user = userRecord
    ? {
        id: userRecord.id,
        name: userRecord.name ?? null,
        mobile: userRecord.phone ?? null,
        email: userRecord.email ?? null,
      }
    : {
        id: order.userId,
        name: null,
        mobile: null,
        email: null,
      };

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
      size:  useVariant ? item.variant?.size?.title  : item.product?.size?.title,
      imageUrl: mainImage,
      imageAlt,
    };

    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      total: item.total,
      status: item.status,
      [useVariant ? 'variant' : 'product']: productData,
    };
  });

  // Fees (keep consistent with creation logic)
  const platformFee = 20;
  const shippingFee = Number(order.shippingFee) || 0;

  // Derive coupon discount from stored totals
  const storedFinal = Number(order.totalAmount) || 0;
  let couponDiscount = totalSellingPrice + platformFee + shippingFee - storedFinal;
  if (!order.coupon) couponDiscount = 0;
  couponDiscount = Math.max(
    0,
    Math.min(totalSellingPrice, Math.round(couponDiscount * 100) / 100)
  );

  return {
    id: order.id,
    status: order.status,
    orderNo: `ORD${String(order.id).padStart(8, '0')}`,
    orderFrom: order.orderFrom,
    createdAt: order.createdAt,
    user,                 // ✅ now always present, even if orphaned
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




async updateOrder(orderId: number, payload: UpdateOrderPayload) {
  // 0) Fetch current order & payment
  const existing = await this.prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });
  if (!existing) throw new NotFoundException('Order not found');

  // 1) Normalize input
  const body =
    typeof payload === 'string' ? { status: payload } : (payload ?? {});

  const nextStatusRaw = body.status?.toString().toUpperCase();
  const nextPayStatusRaw = body.paymentStatus?.toString().toUpperCase();

  // 2) Validate enums (if provided)
  const allowedOrder = Object.values(OrderStatus);
  const allowedPay = Object.values(PaymentStatus);

  let nextStatus: OrderStatus | undefined;
  if (nextStatusRaw) {
    if (!allowedOrder.includes(nextStatusRaw as OrderStatus)) {
      throw new BadRequestException(
        `Invalid order status "${nextStatusRaw}". Allowed: ${allowedOrder.join(', ')}`
      );
    }
    nextStatus = nextStatusRaw as OrderStatus;
  }

  let nextPayStatus: PaymentStatus | undefined;
  if (nextPayStatusRaw) {
    if (!allowedPay.includes(nextPayStatusRaw as PaymentStatus)) {
      throw new BadRequestException(
        `Invalid payment status "${nextPayStatusRaw}". Allowed: ${allowedPay.join(', ')}`
      );
    }
    nextPayStatus = nextPayStatusRaw as PaymentStatus;
  }

  // 3) Optional simple transition checks (customize as needed)
  // e.g., cannot DELIVERED from PENDING directly, etc. (commented; enable if you want)
  // const invalid =
  //   existing.status === 'PENDING' && nextStatus === 'DELIVERED';
  // if (invalid) throw new BadRequestException('Invalid status transition');

  // 4) Build updates
  const orderData: any = {};
  if (nextStatus) orderData.status = nextStatus;
  if (typeof body.note === 'string') orderData.note = body.note;

  // 5) Apply updates (order + optional payment) in a transaction
  await this.prisma.$transaction(async (tx) => {
    if (Object.keys(orderData).length > 0) {
      await tx.order.update({
        where: { id: orderId },
        data: orderData,
      });
    }

    // If explicit paymentStatus provided, update it
    if (nextPayStatus) {
      if (!existing.payment) {
        throw new BadRequestException('No payment record found for this order');
      }
      await tx.payment.update({
        where: { orderId },
        data: {
          status: nextPayStatus,
          paidAt:
            nextPayStatus === 'SUCCESS'
              ? new Date()
              : existing.payment.paidAt ?? null,
        },
      });
    }

    // Optional auto-rules (toggle as per your business logic)
    // Example: when marking order DELIVERED, auto mark COD as SUCCESS if still PENDING
    if (
      nextStatus === 'DELIVERED' &&
      existing.payment &&
      existing.payment.status === 'PENDING'
    ) {
      await tx.payment.update({
        where: { orderId },
        data: { status: 'SUCCESS', paidAt: new Date() },
      });
    }

    // Example: when CANCELLED and payment was SUCCESS, you might mark REFUNDED
    // if (nextStatus === 'CANCELLED' && existing.payment?.status === 'SUCCESS') {
    //   await tx.payment.update({
    //     where: { orderId },
    //     data: { status: 'REFUNDED' },
    //   });
    // }
  });

  // 6) Return the fresh order details (with user/address/items etc.)
  return this.getOrderDetails(orderId);
}

 /** User asks to cancel a single item (moves item to CANCEL_REQUESTED) */
  async requestCancelItem(
    itemId: number,
    body: RequestCancelItemDto,
    userId: number,
  ) {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { order: true },
    });
    if (!item) throw new NotFoundException('Order item not found');

    // Ownership check
    if (item.order.userId !== userId) {
      throw new ForbiddenException('You do not own this order');
    }

    // Ensure the item belongs to the provided orderId
    if (item.orderId !== body.orderId) {
      throw new BadRequestException('orderId does not match item’s order');
    }

    // Block if order in final state
    if (ORDER_FINAL_STATES.includes(item.order.status)) {
      throw new BadRequestException(`Order is ${item.order.status}; item cannot be changed`);
    }

    // Idempotency / state sanity
    if (item.status === OrderItemStatus.CANCEL_REQUESTED || item.status === OrderItemStatus.CANCELLED) {
      return item; // nothing to change
    }

    const updated = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: {
        status: OrderItemStatus.CANCEL_REQUESTED,
        moderationNote: body.note ?? item.moderationNote,
      },
    });

    return updated;
  }

  /** Admin approves or cancels an item (APPROVED / CANCELLED) */
  async updateOrderItemStatus(
    itemId: number,
    body: UpdateOrderItemDto,
    
  ) {
    // Require admin (adjust roles if needed)
  
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { order: { include: { items: { select: { id: true, status: true } } } } },
    });
    if (!item) throw new NotFoundException('Order item not found');

    if (item.orderId !== body.orderId) {
      throw new BadRequestException('orderId does not match item’s order');
    }

    // Block if order is in terminal state
    if (ORDER_FINAL_STATES.includes(item.order.status)) {
      throw new BadRequestException(`Order is ${item.order.status}; item cannot be changed`);
    }

    const next = body.status.toUpperCase() as 'APPROVED' | 'CANCELLED';
    const nextEnum =
      next === 'APPROVED' ? OrderItemStatus.APPROVED : OrderItemStatus.CANCELLED;

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedItem = await tx.orderItem.update({
        where: { id: itemId },
        data: {
          status: nextEnum,
          moderationNote: body.note ?? item.moderationNote,
         
        },
      });

      // If all items are CANCELLED after this change, mark order CANCELLED
      if (
        nextEnum === OrderItemStatus.CANCELLED &&
        item.order.items.every((it) => (it.id === itemId ? true : it.status === OrderItemStatus.CANCELLED))
      ) {
        await tx.order.update({
          where: { id: item.orderId },
          data: { status: 'CANCELLED' },
        });
      }

      return updatedItem;
    });

    return updated;
  }

}
