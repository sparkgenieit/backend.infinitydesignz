// src/wishlist/wishlist.controller.ts

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  UseGuards
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  addToWishlist(@Req() req, @Body() dto: AddToWishlistDto) {
    return this.wishlistService.add(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getWishlist(@Req() req) {
    return this.wishlistService.getUserWishlist(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':productId')
  removeFromWishlist(@Req() req, @Param('productId') productId: number) {
    return this.wishlistService.remove(req.user.id, +productId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('move-to-cart/:productId')
  moveToCart(@Req() req, @Param('productId') productId: number) {
    return this.wishlistService.moveToCart(req.user.id, +productId);
  }
}
