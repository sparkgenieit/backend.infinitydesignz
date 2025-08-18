export class CreateOrderDto {
  addressId: number;
  couponId?: number;
  subtotal: number;
  shippingFee: number;
  gst: number;
  totalAmount: number;
  note?: string;
  items: {
    productId: number;
    variantId?: number;
    quantity: number;
    price: number;
    total: number;
  }[];
}
