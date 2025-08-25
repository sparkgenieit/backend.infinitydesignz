import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import { CartService } from "./cart.service";
import { AddToCartDto } from "./dto/add-to-cart.dto";
import { UpdateCartDto } from "./dto/update-cart.dto";
import { SyncCartDto } from "./dto/sync-cart.dto";
import { AuthGuard } from "../auth/auth.guard";

@Controller("cart")
@UseGuards(AuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() req) {
    return this.cartService.getUserCart(req.user.id);
  }

  @Post()
  addToCart(@Req() req, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(req.user.id, dto);
  }

  @Patch(":cartId")
  updateCart(
    @Req() req,
    @Param("cartId", ParseIntPipe) cartId: number, //  Force cartId to be a number
    @Body() dto: UpdateCartDto
  ) {
    return this.cartService.updateCart(req.user.id, cartId, dto);
  }

  
  @Delete("clear")
clearCart(@Req() req) {
  return this.cartService.clearCart(req.user.id);
}

  @Delete(":cartId")
  removeItem(@Req() req, @Param("cartId", ParseIntPipe) cartId: number) {
    return this.cartService.removeFromCart(req.user.id, cartId);
  }

  @Post("sync")
  syncCart(@Req() req, @Body() dto: SyncCartDto) {
    return this.cartService.syncGuestCart(req.user.id, dto);
  }

}
