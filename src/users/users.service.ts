import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto'; // ✅ DTO for modal

function parseDob(input?: string): Date | undefined {
  if (!input) return undefined;

  // Try ISO first
  const direct = new Date(input);
  if (!isNaN(direct.getTime())) return direct;

  // Try dd/MM/yyyy
  const m = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (!isNaN(d.getTime())) return d;
  }

  throw new BadRequestException('Invalid dateOfBirth format. Use YYYY-MM-DD or dd/MM/yyyy.');
}

// ---- helpers to format Prisma P2002 messages safely ----
function uniqueTargetToLabel(err: any): string {
  const t = err?.meta?.target; // can be string | string[] | undefined
  if (Array.isArray(t)) return t.join(', ');
  if (typeof t === 'string') return t;
  return 'unique field';
}
function humanizeConstraint(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes('email')) return 'email';
  if (lower.includes('phone') || lower.includes('mobile')) return 'mobile number';
  if (lower.includes('username')) return 'username';
  return label;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  //  Get user by mobile (used in OTP login)
  async findByMobileNumber(mobileNumber: string) {
    return this.prisma.user.findUnique({
      where: { phone: mobileNumber },
    });
  }

  //  Create user after successful OTP verification
  async create(mobileNumber: string, role: string) {
    return this.prisma.user.create({
      data: {
        phone: mobileNumber,
        role: 'CUSTOMER',
      },
    });
  }

  //  Find token (for JWT AuthGuard)
  async findToken(token: string) {
    return this.prisma.user.findFirst({
      where: { token },
    });
  }

  //  Get user by ID (used in profile logic)
  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  //  Update profile from modal (all fields)
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const data: Prisma.UserUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.mobile !== undefined) data.phone = dto.mobile;
    if (dto.alternateMobile !== undefined) (data as any).alternateMobile = dto.alternateMobile;
    if (dto.gender !== undefined) (data as any).gender = dto.gender as any;
    if (dto.dateOfBirth !== undefined) (data as any).dateOfBirth = parseDob(dto.dateOfBirth)!;

    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          alternateMobile: true,
          gender: true,
          dateOfBirth: true,
          profilePicture: true,
          updatedAt: true,
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        const raw = uniqueTargetToLabel(e);        // handles string | string[] | undefined
        const label = humanizeConstraint(raw);     // nicer field name
        throw new BadRequestException(`Another account already uses this ${label}.`);
      }
      throw e;
    }
  }

  //  Update user (generic, for internal usage)
async updateUser(userId: number, dto: Partial<UpdateUserDto>) {
  const data: Prisma.UserUpdateInput = {};

  // Basic text fields
  if (dto.name !== undefined) data.name = dto.name;
  if (dto.email !== undefined) data.email = dto.email;

  // Phones — accept both 'phone' and alias 'mobile'
  if (dto.phone !== undefined) (data as any).phone = dto.phone;
  if (dto.mobile !== undefined) (data as any).phone = dto.mobile;
  if (dto.alternateMobile !== undefined) (data as any).alternateMobile = dto.alternateMobile;

  // Enums / misc
  if (dto.gender !== undefined) (data as any).gender = dto.gender as any;
  if (dto.role !== undefined) (data as any).role = dto.role;
  if (dto.status !== undefined) (data as any).status = dto.status;
  if (dto.profilePicture !== undefined) (data as any).profilePicture = dto.profilePicture;

  // Dates
  if (dto.dateOfBirth !== undefined) {
    (data as any).dateOfBirth = (function parseDob(input?: string): Date | undefined {
      if (!input) return undefined;

      // ISO first
      const direct = new Date(input);
      if (!isNaN(direct.getTime())) return direct;

      // dd/MM/yyyy
      const m = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (m) {
        const [, dd, mm, yyyy] = m;
        const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
        if (!isNaN(d.getTime())) return d;
      }
      throw new BadRequestException('Invalid dateOfBirth format. Use YYYY-MM-DD or dd/MM/yyyy.');
    })(dto.dateOfBirth)!;
  }

  // Token (optional but allowed)
  if (dto.token !== undefined) (data as any).token = dto.token;

  // Defensive: if whitelist removed everything or keys are wrong, fail early
  if (Object.keys(data).length === 0) {
    throw new BadRequestException(
      'No valid fields to update. Ensure keys match UpdateUserDto and Content-Type is application/json.',
    );
  }

  return this.prisma.user.update({
    where: { id: userId },
    data,
  });
}


  //  Change password
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

  //  Upload profile picture
  async uploadProfilePicture(userId: number, filename: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { profilePicture: filename },
    });
  }
}
