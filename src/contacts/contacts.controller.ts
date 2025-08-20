import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('contacts')
@UseGuards(JwtAuthGuard) // keep consistent with your Brands module
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  // CREATE
  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.contactsService.create(dto);
  }

  // LIST with filters/pagination (for your search + Active/Inactive buttons)
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') statusRaw?: string,
    @Query('page') pageRaw?: string,
    @Query('take') takeRaw?: string,
  ) {
    const page = pageRaw ? Number(pageRaw) : undefined;
    const take = takeRaw ? Number(takeRaw) : undefined;
    const status =
      typeof statusRaw === 'string'
        ? statusRaw.toLowerCase() === 'true'
          ? true
          : statusRaw.toLowerCase() === 'false'
          ? false
          : undefined
        : undefined;

    return this.contactsService.findAll({ search, status, page, take });
  }

  // GET BY ID
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contactsService.findOne(id);
  }

  // UPDATE
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContactDto) {
    return this.contactsService.update(id, dto);
  }

  // SET STATUS (for Active/Inactive toggle)
  @Patch(':id/status')
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: boolean,
  ) {
    return this.contactsService.setStatus(id, status);
  }

  // DELETE
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contactsService.remove(id);
  }
}
