import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Get,
  Req,
  UseGuards,
  HttpCode,
  Request,
  Patch,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthRequestDto, RegisterRequestDto, VerifyOtpRequestDto, ProfileUpdateRequestDto } from './auth.dto';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Admin login
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateAdmin(body.email, body.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.authService.loginAdmin(user);
  }

  @Get('verify-token')
  @UseGuards(JwtAuthGuard)
  verifyToken(@Req() req: Request) {
    return { valid: true };
  }

  // OTP login
  @Post('/authenticate')
  @HttpCode(204)
  async authenticate(@Body() authRequestDto: AuthRequestDto) {
    await this.authService.authenticate(authRequestDto);
  }

  @Post('/resend-otp')
  @HttpCode(200)
  async resendOtp(@Body() resendOtpRequestDto: RegisterRequestDto) {
    await this.authService.resendOtp(resendOtpRequestDto);
  }

  @Post('/verify')
  @HttpCode(200)
  async verify(@Body() verifyOtpRequestDto: VerifyOtpRequestDto) {
    return this.authService.verifyOtp(verifyOtpRequestDto);
  }

  @Get('/profile')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

 
  @Delete('/logout')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  async logout(@Request() req: any) {
    await this.authService.logout(req.user.id);
  }

 
}
