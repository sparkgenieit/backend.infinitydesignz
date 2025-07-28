import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StylesService {
  constructor(private prisma: PrismaService) { }

  create(data: any) {
    return this.prisma.style.create({ data });
  }

  findAll() {
    return this.prisma.style.findMany();
  }

  findOne(id: number) {
    return this.prisma.style.findUnique({ where: { id } });
  }

  update(id: number, data: any) {
    return this.prisma.style.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.style.delete({ where: { id } });
  }
}