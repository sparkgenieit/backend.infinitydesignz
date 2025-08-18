import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { BuyNowDto } from './dto/buy-now.dto';
import { AuthGuard } from '../auth/auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ───────────────────────── USER ENDPOINTS ─────────────────────────

  @UseGuards(AuthGuard)
  @Post('place')
  placeOrder(@Body() dto: CreateOrderDto, @Req() req: any) {
    return this.ordersService.placeOrder(dto, req.user.id);
  }

  @UseGuards(AuthGuard)
  @Get('user')
  listUserOrders(@Req() req: any) {
    return this.ordersService.listUserOrders(req.user.id);
  }

  @UseGuards(AuthGuard)
  @Get('invoice/:id')
  generateInvoice(@Param('id') id: string) {
    return this.ordersService.generateInvoice(+id);
  }

  // Buy Now – single item checkout
  @UseGuards(AuthGuard)
  @Post('buy-now')
  buyNow(@Body() dto: BuyNowDto, @Req() req: any) {
    return this.ordersService.buyNow(dto, req.user.id);
  }

  // ───────────────────────── ADMIN/LIST WITH FILTERS ─────────────────────────
  // Example:
  // GET /orders?status=DELIVERED&paymentStatus=SUCCESS&orderId=ORD00001234&dateFrom=2025-02-01&dateTo=2025-02-28&active=true&orderFrom=web&page=1&pageSize=10
  @UseGuards(JwtAuthGuard)
  @Get()
  listOrders(@Query() q: any) {
    return this.ordersService.listOrders({
      status: q.status,                   // PENDING | CONFIRMED | SHIPPED | DELIVERED | CANCELLED
      orderId: q.orderId,                 // e.g. ORD00001234
      dateFrom: q.dateFrom,               // YYYY-MM-DD or ISO
      dateTo: q.dateTo,                   // YYYY-MM-DD or ISO
      orderFrom: q.orderFrom,             // "web" | "app" | "pos"
      page: q.page ? Number(q.page) : undefined,
      pageSize: q.pageSize ? Number(q.pageSize) : undefined,
    });
  }

  // ───────────────────────── MUST BE LAST TO AVOID COLLISIONS ─────────────────
  @UseGuards(AuthGuard)
  @Get(':id')
  getOrder(@Param('id') id: string) {
    return this.ordersService.getOrderDetails(+id);
  }
}
