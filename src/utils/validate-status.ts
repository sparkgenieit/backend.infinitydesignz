import { BadRequestException } from '@nestjs/common';

export function parseBooleanStatus(input: any): boolean {
  if (input === true || input === 'true') return true;
  if (input === false || input === 'false') return false;

  throw new BadRequestException('Invalid status value: must be true or false');
}
