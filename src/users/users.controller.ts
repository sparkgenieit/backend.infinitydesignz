import {
  Controller,
  Post,
  Body,
  Patch,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
//import { AuthGuard } from '../auth/auth.guard';
import { extname } from 'path';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  register(@Body() dto: CreateUserDto) {
    return this.usersService.register(dto);
  }

 // @UseGuards(AuthGuard)
  @Patch('profile')
  updateProfile(@Body() dto: UpdateUserDto, @Req() req) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

 // @UseGuards(AuthGuard)
  @Patch('change-password')
  changePassword(@Body() dto: ChangePasswordDto, @Req() req) {
    return this.usersService.changePassword(req.user.id, dto);
  }

  //@UseGuards(AuthGuard)
  @Post('upload-profile-picture')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/profile-pictures',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  uploadPicture(@UploadedFile() file: Express.Multer.File, @Req() req) {
    return this.usersService.uploadProfilePicture(req.user.id, file.filename);
  }
}
