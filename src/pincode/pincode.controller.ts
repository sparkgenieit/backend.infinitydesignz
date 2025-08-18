import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { PincodeService } from './pincode.service';
import { CheckPincodeDto } from './dto/check-pincode.dto';

@Controller('pincode')
export class PincodeController {
  constructor(private readonly pincodeService: PincodeService) {}

  // GET /pincode/500081
  @Get(':pincode')
  async checkByParam(@Param('pincode') pincode: string) {
    return this.pincodeService.check(pincode);
  }

  // POST /pincode/check  { "pincode": "500081" }
  @Post('check')
  async checkByBody(@Body() dto: CheckPincodeDto) {
    return this.pincodeService.check(dto.pincode);
  }
}
