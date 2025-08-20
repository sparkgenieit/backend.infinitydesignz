import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Gender /*, Role */ } from '@prisma/client';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

type SortOrder = 'asc' | 'desc';

/** Local helper: parse DoB in ISO or dd/MM/yyyy */
function parseDob(input?: any): Date | undefined {
  if (input === undefined || input === null || input === '') return undefined;
  if (input instanceof Date) return isNaN(input.getTime()) ? undefined : input;

  const txt = String(input);
  const iso = new Date(txt);
  if (!isNaN(iso.getTime())) return iso;

  const m = txt.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (!isNaN(d.getTime())) return d;
  }
  throw new BadRequestException('Invalid dateOfBirth format. Use YYYY-MM-DD or dd/MM/yyyy.');
}

/** Local helper: normalize role string->enum if provided */
function normalizeRole(role?: any): UserRole | undefined {
  if (!role) return undefined;
  const key = String(role).toUpperCase().trim();
  return (UserRole as any)[key] as UserRole | undefined;
}
    function normalizeGender(gender?: any): Gender | null {
  // allow explicit clearing
  if (gender === null || gender === undefined || gender === '') return null;

  // already a valid enum value?
  const enumVals = Object.values(Gender) as string[];
  if (enumVals.includes(gender as any)) return gender as Gender;

  const s = String(gender).trim().toLowerCase();
  if (s === 'male' || s === 'm') return Gender.Male;
  if (s === 'female' || s === 'f') return Gender.Female;
  return Gender.Other;
}

@UseGuards(JwtAuthGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  /** Ensure only admins hit these routes */
  private assertAdmin(req: any) {
    const role: string | undefined = req?.user?.role;
    const allowed = new Set<string>(['ADMIN', 'SUPER_ADMIN']);
    if (!role || !allowed.has(String(role).toUpperCase())) {
      throw new ForbiddenException('Admin access required');
    }
  }

  /** Parse boolean-ish query values */
  private parseBool(v: any): boolean | undefined {
    if (v === undefined || v === null || v === '') return undefined;
    const s = String(v).toLowerCase().trim();
    if (['true', '1', 'yes', 'y'].includes(s)) return true;
    if (['false', '0', 'no', 'n'].includes(s)) return false;
    return undefined;
  }

  // ───────────────────────── CREATE ─────────────────────────
  @Post()
  async createUser( @Body() dto: CreateUserDto) {
   // Build create data explicitly; hash password if provided
    const data: Prisma.UserCreateInput = {
      phone: (dto as any).phone, // required by schema
      name: (dto as any).name ?? null,
      email: (dto as any).email ?? null,
      password: (dto as any).password
        ? await bcrypt.hash((dto as any).password, 10)
        : null,
      role: normalizeRole((dto as any).role) ?? UserRole.CUSTOMER,
      token: null,
      profilePicture: (dto as any).profilePicture ?? null,
      // optionals present in your schema:
      alternateMobile: (dto as any).alternateMobile ?? null,
      gender: normalizeGender((dto as any).gender),
      dateOfBirth: parseDob((dto as any).dateOfBirth),
      status: (dto as any).status === false ? false : true, // default true
    };

    try {
      const user = await this.prisma.user.create({
        data,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          profilePicture: true,
          alternateMobile: true,
          gender: true,
          dateOfBirth: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return user;
    } catch (e: any) {
      // Handle unique constraint (e.g., phone/email)
      if (e?.code === 'P2002') {
        const target = Array.isArray(e?.meta?.target)
          ? e.meta.target.join(', ')
          : e?.meta?.target || 'unique field';
        throw new BadRequestException(`Another account already uses this ${target}.`);
      }
      throw e;
    }
  }

  // ───────────────────────── LIST ─────────────────────────
  @Get()
  async listUsers(
    @Query('page') pageQ?: string,
    @Query('take') takeQ?: string,
    @Query('search') search?: string,
    @Query('role') roleQ?: string,
    @Query('status') statusQ?: string,
    @Query('sortBy') sortByQ?: string,
    @Query('order') orderQ?: SortOrder,
  ) {
    

    const page = Math.max(parseInt(pageQ ?? '1', 10) || 1, 1);
    const takeRaw = Math.max(parseInt(takeQ ?? '10', 10) || 10, 1);
    const take = Math.min(takeRaw, 100);
    const skip = (page - 1) * take;

    const status = this.parseBool(statusQ);
    const roleEnum = normalizeRole(roleQ);

    const sortable = new Set<keyof Prisma.UserOrderByWithRelationInput>([
      'id',
      'name',
      'email',
      'phone',
      'role',
      'status',
      'createdAt',
      'updatedAt',
    ]);
    const sortBy = (sortable.has(sortByQ as any) ? sortByQ : 'createdAt') as
      | keyof Prisma.UserOrderByWithRelationInput
      | undefined;
    const order: SortOrder = orderQ === 'asc' || orderQ === 'desc' ? orderQ : 'desc';

    const where: Prisma.UserWhereInput = {};
    if (status !== undefined) where.status = status;
    if (roleEnum) (where as any).role = roleEnum;

    const term = (search ?? '').trim();
    if (term) {
      // Keep compatible with your generated client (no `mode`)
      where.OR = [
        { name: { contains: term } },
        { email: { contains: term } },
        { phone: { contains: term } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: sortBy ? { [sortBy]: order } : undefined,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          profilePicture: true,
          alternateMobile: true,
          gender: true,
          dateOfBirth: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      page,
      take,
      total,
      totalPages: Math.max(Math.ceil(total / take), 1),
      sortBy,
      order,
      filters: { search: term || undefined, role: roleEnum || undefined, status },
    };
  }

  // ───────────────────────── READ ─────────────────────────
  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserById(id);
  }

  // ───────────────────────── UPDATE ─────────────────────────
  @Patch(':id')
  async adminUpdateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {

    // Block password/token changes here; use dedicated flows
    if ('password' in (dto as any) || 'token' in (dto as any)) {
      throw new BadRequestException('Password/token cannot be updated via this endpoint.');
    }

    // Normalize/parse fields before delegating to service
    const patch: any = { ...dto };

    if (patch.role) {
      const roleEnum = normalizeRole(patch.role);
      if (!roleEnum) throw new BadRequestException('Invalid role');
      patch.role = roleEnum;
    }
    if (patch.dateOfBirth !== undefined) {
      patch.dateOfBirth = parseDob(patch.dateOfBirth);
    }
    if (patch.gender !== undefined) {
      patch.gender = normalizeGender(patch.gender);
    }
    // Allow toggling status explicitly if provided
    if (patch.status !== undefined) {
      patch.status = Boolean(patch.status);
    }

    try {
      return await this.usersService.updateUser(id, patch);
    } catch (e: any) {
      if (e?.code === 'P2002') {
        const target = Array.isArray(e?.meta?.target)
          ? e.meta.target.join(', ')
          : e?.meta?.target || 'unique field';
        throw new BadRequestException(`Another account already uses this ${target}.`);
      }
      throw e;
    }
  }

  @Delete(':id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    await this.prisma.user.delete({ where: { id } });
    return { success: true, id };
  }
}
