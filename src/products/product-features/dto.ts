export class CreateProductFeatureDto {
  productId: number;
  featureListId: number;
  value: string;
}
export class UpdateProductFeatureDto {
  featureListId: number;
  value: string;
}
