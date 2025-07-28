import {
  Controller,
  Patch,
  Body,
  UseGuards,
  BadRequestException
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommonStatusService } from './common-status.service';
import { parseBooleanStatus } from '../utils/validate-status';

@Controller('common')
export class CommonStatusController {
  constructor(private readonly commonStatusService: CommonStatusService) {}

  @UseGuards(JwtAuthGuard)
  @Patch('bulk-update-status')
  async bulkUpdateStatus(
    @Body() body: {
      entity: string;
      ids: number[];
      status: boolean | string | number;
    }
  ) {
    const { entity, ids } = body;

    if (!entity || !ids?.length) {
      throw new BadRequestException('Entity and list of IDs are required.');
    }

    const status = parseBooleanStatus(body.status);
    return this.commonStatusService.bulkUpdateStatus(entity, ids, status);
  }
}
