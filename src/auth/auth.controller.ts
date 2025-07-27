import { UserService } from 'src/user/user.service';

import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const { password, passwordConfirm } = body;

    if (password !== passwordConfirm) {
      throw new BadRequestException(
        `Password and password confirm (repeat) should be the same`,
      );
    }

    const hashedPassword = await this.authService.hashPassword(password);

    const user = await this.userService.create({
      ...body,
      password: hashedPassword,
    });

    const token = await this.authService.signToken(user);

    return { accessToken: token };
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    const { email, password } = body;

    const user = await this.userService.getByEmail(email, true);

    const isPasswordCorrect = await this.authService.comparePasswordWithHash(
      password,
      user.password,
    );

    if (!isPasswordCorrect) {
      throw new UnauthorizedException(`Invalid credentials`);
    }

    const token = await this.authService.signToken(user);

    return { accessToken: token };
  }
}
