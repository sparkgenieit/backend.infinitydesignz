import { PartialType } from '@nestjs/mapped-types';
import { CreateUserSubscribeDto } from './create-user-subscribe.dto';

export class UpdateUserSubscribeDto extends PartialType(CreateUserSubscribeDto) {}
