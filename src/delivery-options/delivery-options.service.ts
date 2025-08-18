import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeliveryOptionDto } from './dto/create-delivery-option.dto';
import { UpdateDeliveryOptionDto } from './dto/update-delivery-option.dto';

@Injectable()
export class DeliveryOptionsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.deliveryOption.findMany();
  }

  findOne(id: number) {
    return this.prisma.deliveryOption.findUnique({ where: { id } });
  }

  create(dto: CreateDeliveryOptionDto) {
    return this.prisma.deliveryOption.create({ data: dto });
  }

  update(id: number, dto: UpdateDeliveryOptionDto) {
    return this.prisma.deliveryOption.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: number) {
    return this.prisma.deliveryOption.delete({ where: { id } });
  }
}