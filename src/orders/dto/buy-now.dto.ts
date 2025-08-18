export class BuyNowDto {
  productId: number;
  variantId?: number;
  quantity: number;       // default handled server-side if missing
  addressId: number;
  note?: string;
 
 couponId?: number;          // optional: for linking order->coupon
couponDiscount?: number;    // final discount computed once on UI

}
