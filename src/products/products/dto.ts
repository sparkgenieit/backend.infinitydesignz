export class CreateProductsDto {
  sku: string;
  title: string;
  description?: string;
  brandId: number;

  //  Updated 3-level category support
  categoryId: number;
  

  colorId?: number;
  sizeId?: number;
  stock: number;
  mrp: number;
  sellingPrice: number;
  height?: number;
  width?: number;
  length?: number;
  searchKeywords?: string;
  status?: boolean;

  productDetails?: {
    model?: string;
    weight?: number;
    sla?: number;
    deliveryCharges?: number;
  };

  variants?: {
    sku: string;
    stock: number;
    mrp: number;
    sellingPrice: number;
    sizeId?: number;
    colorId?: number;
  }[];
}

export class UpdateProductsDto extends CreateProductsDto {}
