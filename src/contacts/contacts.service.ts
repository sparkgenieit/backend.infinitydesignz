import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  /** Create a new contact */
  create(dto: CreateContactDto) {
    return this.prisma.contact.create({
      data: {
        name: dto.name,
        email: dto.email,
        mobile: dto.mobile,
        subject: dto.subject,
        description: dto.description,
        status: dto.status ?? true,
      },
    });
  }

  /**
   * List contacts with optional:
   * - search (name/email/mobile/subject/description)
   * - status (true/false)
   * - pagination (page, take)
   */
  async findAll(params: {
    search?: string;
    status?: boolean;
    page?: number;
    take?: number;
  }) {
    const { search, status } = params;
    const page = Math.max(1, params.page ?? 1);
    const take = Math.min(100, Math.max(1, params.take ?? 10));
    const skip = (page - 1) * take;

    const where: any = {};
    if (typeof status === 'boolean') where.status = status;
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return { items, total, page, take };
  }

  /** Get one contact by ID */
  async findOne(id: number) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact) throw new NotFoundException(`Contact ${id} not found`);
    return contact;
  }

  /** Update a contact */
  async update(id: number, dto: UpdateContactDto) {
    await this.ensureExists(id);
    return this.prisma.contact.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        mobile: dto.mobile,
        subject: dto.subject,
        description: dto.description,
        status: dto.status,
      },
    });
  }

  /** Set status (Active/Inactive) */
  async setStatus(id: number, status: boolean) {
    await this.ensureExists(id);
    return this.prisma.contact.update({
      where: { id },
      data: { status },
    });
  }

  /** Delete a contact (hard delete) */
  async remove(id: number) {
    await this.ensureExists(id);
    await this.prisma.contact.delete({ where: { id } });
    return { message: 'Contact deleted successfully' };
  }

  private async ensureExists(id: number) {
    const exists = await this.prisma.contact.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Contact ${id} not found`);
  }
}
