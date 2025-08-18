import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  ParseIntPipe,
  NotFoundException,
} from "@nestjs/common";
import { AddressService } from "./address.service";
import { CreateAddressDto } from "./dto/create-address.dto";
import { UpdateAddressDto } from "./dto/update-address.dto";
import { AuthGuard } from "../auth/auth.guard";

import { User } from "@prisma/client";

@UseGuards(AuthGuard)
@Controller("user/addresses")
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  getAddresses(@Req() req) {
    return this.addressService.getAddresses(req.user.id);
  }

  @Post()
  createAddress(@Req() req, @Body() dto: CreateAddressDto) {
    return this.addressService.createAddress(req.user.id, dto);
  }

  @Put(":id")
  updateAddress(
    @Req() req,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateAddressDto
  ) {
    return this.addressService.updateAddress(req.user.id, id, dto);
  }

  @Delete(":id")
  deleteAddress(@Req() req, @Param("id", ParseIntPipe) id: number) {
    return this.addressService.deleteAddress(req.user.id, id);
  }
  @Get("default")
  getDefaultAddress(@Req() req) {
    return this.addressService.getDefaultAddress(req.user.id);
  }
  //  New: PATCH /user/addresses/:id/set-default
  @Patch("set-default/:id")
  async setDefaultAddress(@Req() req, @Param("id", ParseIntPipe) id: number) {
    const userId = req.user.id;
    const address = await this.addressService.setDefaultAddress(userId, id);
    if (!address) {
      throw new NotFoundException("Address not found or not owned by user");
    }
    return {
      message: "Default address set successfully",
      data: address,
    };
  }
}
