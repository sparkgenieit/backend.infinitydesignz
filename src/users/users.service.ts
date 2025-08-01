import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  

  // ✅ Get user by mobile (used in OTP login)
  async findByMobileNumber(mobileNumber: string) {
    return this.prisma.user.findUnique({
      where: { phone: mobileNumber },
    });
  }

  // ✅ Create user after successful OTP verification
  async create(mobileNumber: string, role: string) {
    return this.prisma.user.create({
      data: {
        phone: mobileNumber,
        role:"CUSTOMER",
      },
    });
  }

  // ✅ Find token (for JWT AuthGuard)
  async findToken(token: string) {
    return this.prisma.user.findFirst({
      where: { token },
    });
  }

  // ✅ Get user by ID (used in profile logic)
  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ✅ Update profile (used in AuthService updateProfile)
  async updateUser(userId: number, dto: Partial<UpdateUserDto>) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }

  // ✅ Change password (if you support it in future)
  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password || !(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new BadRequestException('Invalid current password');
    }
    const newHashed = await bcrypt.hash(dto.newPassword, 10);
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: newHashed },
    });
  }

  // ✅ Upload profile picture
  async uploadProfilePicture(userId: number, filename: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { profilePicture: filename },
    });
  }
}
