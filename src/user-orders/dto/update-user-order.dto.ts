import { PartialType } from '@nestjs/mapped-types';
import { CreateUserOrderDto } from './create-user-order.dto';

export class UpdateUserOrderDto extends PartialType(CreateUserOrderDto) {}
