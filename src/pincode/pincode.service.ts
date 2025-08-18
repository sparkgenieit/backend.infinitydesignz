import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Adjust if your path differs

@Injectable()
export class PincodeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Returns delivery availability for a pincode.
   * Response:
   * {
   *   pincode: string,
   *   available: boolean,
   *   area: { city: string; state: string } | null,
   *   codAvailable: boolean | null,
   *   etaDays: number | null,
   *   fee: number | null
   * }
   */
  async check(pincode: string) {
    const area = await this.prisma.serviceableArea.findUnique({
      where: { pincode },
      select: {
        pincode: true,
        city: true,
        state: true,
        isActive: true,
        codAvailable: true,
        deliveryEtaDays: true,
        lastMileFee: true,
      },
    });

    return {
      pincode,
      available: !!area?.isActive,
      area: area ? { city: area.city, state: area.state } : null,
      codAvailable: area?.codAvailable ?? null,
      etaDays: area?.deliveryEtaDays ?? null,
      fee: area?.lastMileFee ?? null,
    };
  }
}
