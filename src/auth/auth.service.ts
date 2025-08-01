import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
//import { Msg91Service } from 'src/msg91';
import { UsersService } from "../users/users.service";
import {
  AuthRequestDto,
  ResendOtpRequestDto,
  VerifyOtpRequestDto,
  VerifyOtpResponseDto,
  ProfileResponseDto,
} from "./auth.dto";
import { plainToInstance } from "class-transformer";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    //  private readonly msg91Service: Msg91Service,
    private readonly usersService: UsersService
  ) {}

  // 🔒 Admin login
  async validateAdmin(email: string, pass: string): Promise<any> {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPass = process.env.ADMIN_PASSWORD;
    if (email === adminEmail && pass === adminPass) {
      return { email };
    }
    return null;
  }

  async loginAdmin(user: any) {
    const payload = { email: user.email };
    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }),
    };
  }

  // 🔐 Send OTP
  async authenticate(authRequestDto: AuthRequestDto) {
    try {
      const { mobileNumber } = authRequestDto;
      const isTestAccount =
        mobileNumber === process.env.TEST_ACCOUNT_MOBILE &&
        process.env.ENABLE_TEST_ACCOUNT === "true";

      if (!isTestAccount) {
        //  await this.msg91Service.sendOtp(mobileNumber);
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        "Failed to authenticate user: " + error.message
      );
    }
  }

  async resendOtp(resendOtpRequestDto: ResendOtpRequestDto) {
    // await this.msg91Service.sendOtp(resendOtpRequestDto.mobileNumber);
  }

  // 🔐 Verify OTP & login or create user
  async verifyOtp(
    verifyOtpRequestDto: VerifyOtpRequestDto
  ): Promise<VerifyOtpResponseDto> {
    try {
      const { mobileNumber, otp } = verifyOtpRequestDto;

      const isTestAccount =
        mobileNumber === process.env.TEST_ACCOUNT_MOBILE &&
        process.env.ENABLE_TEST_ACCOUNT === "true";

      if (!isTestAccount) {
        //  await this.msg91Service.verifyOtp(mobileNumber, otp);
      }

      let user = await this.usersService.findByMobileNumber(mobileNumber);

      if (!user) {
        user = await this.usersService.create(mobileNumber, "CUSTOMER");
      }

      const access_token = this.jwtService.sign(
        { id: user.id },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: process.env.JWT_EXPIRES_IN || "1d", // Fallback to 1 day if env is missing
        }
      );

      await this.usersService.updateUser(user.id, { token: access_token });

      return { access_token };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException("Failed to verify user");
    }
  }

  // 🔍 Profile
  async getProfile(userId: number): Promise<ProfileResponseDto> {
    const user = await this.usersService.getUserById(userId);
    if (!user) throw new UnauthorizedException("Unauthorized");

    return plainToInstance(ProfileResponseDto, user, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }

  // 🚪 Logout
  async logout(userId: number) {
    const user = await this.usersService.getUserById(userId);
    if (!user) throw new UnauthorizedException("Unauthorized");

    await this.usersService.updateUser(userId, { token: null });
  }
}
