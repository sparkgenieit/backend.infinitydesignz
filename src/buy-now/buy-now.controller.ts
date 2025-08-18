import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Req,
   UseGuards,
} from "@nestjs/common";
import { BuyNowService } from "./buy-now.service";
import { CreateBuyNowDto } from "./dto/create-buy-now.dto";
import { UpdateBuyNowDto } from "./dto/update-buy-now.dto";
import { AuthGuard } from "../auth/auth.guard";

/**
 * Buy Now controller
 * Everything is same style as Cart, except:
 *  - Single item only
 *  - No sync endpoint
 *  - No cart merge logic
 */
@Controller("buy-now")
@UseGuards(AuthGuard)
export class BuyNowController {
  constructor(private readonly buyNowService: BuyNowService) {}

  // Get the current Buy Now item for the authenticated user
  @Get()
  get(@Req() req: any) {
    return this.buyNowService.getBuyNow(req.user.id);
  }

  // Set/replace the Buy Now item (single item only)
  @Post()
  set(@Req() req: any, @Body() dto: CreateBuyNowDto) {
    return this.buyNowService.setBuyNow(req.user.id, dto);
  }

  // Update only the quantity (still single item)
  @Patch()
  update(@Req() req: any, @Body() dto: UpdateBuyNowDto) {
    return this.buyNowService.updateQuantity(req.user.id, dto);
  }

  // Clear the Buy Now item
  @Delete()
  clear(@Req() req: any) {
    return this.buyNowService.clear(req.user.id);
  }
}
