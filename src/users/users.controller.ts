import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@UseGuards(AuthGuard)
@Controller('user/profile')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ✅ Prefill profile form
  @Get()
  async getProfile(@Req() req) {
    return this.usersService.getUserById(req.user.id);
  }

  // ✅ Update profile with all modal fields
  @Put()
  async updateProfile(@Req() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }
}
