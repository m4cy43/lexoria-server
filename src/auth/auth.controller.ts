import { CookieOptions, Response } from 'express';
import * as ms from 'ms';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { User } from 'src/user/interfaces/user.interface';
import { UserService } from 'src/user/user.service';

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private accessSecret: string;
  private accessExpiresIn: ms.StringValue;
  private refreshSecret: string;
  private refreshExpiresIn: ms.StringValue;
  private isProd: boolean;

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    this.accessSecret = this.configService.get<string>('ACCESS_JWT_SECRET');
    this.accessExpiresIn = this.configService.get<ms.StringValue>(
      'ACCESS_JWT_EXPIRES_IN',
      '15m',
    );
    this.refreshSecret = this.configService.get<string>('REFRESH_JWT_SECRET');
    this.refreshExpiresIn = this.configService.get<ms.StringValue>(
      'REFRESH_JWT_EXPIRES_IN',
      '7d',
    );
    this.isProd = this.configService.get<string>('NODE_ENV') === 'production';
  }

  private async signTokens(payload: User | JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.authService.signToken(payload, {
        secret: this.accessSecret,
        expiresIn: this.accessExpiresIn,
      }),
      this.authService.signToken(payload, {
        secret: this.refreshSecret,
        expiresIn: this.refreshExpiresIn,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private getCookieOptions(expiresIn: ms.StringValue): CookieOptions {
    return {
      httpOnly: true,
      maxAge: ms(expiresIn),
      sameSite: 'none',
      // secure: this.isProd,
      secure: true,
    };
  }

  private setTokensInCookies(
    res: Response,
    {
      accessToken,
      refreshToken,
    }: { accessToken: string; refreshToken: string },
  ) {
    res.cookie(
      'accessToken',
      accessToken,
      this.getCookieOptions(this.accessExpiresIn),
    );
    res.cookie(
      'refreshToken',
      refreshToken,
      this.getCookieOptions(this.refreshExpiresIn),
    );
  }

  @Post('register')
  async register(
    @Res({ passthrough: true }) res: Response,
    @Body() body: RegisterDto,
  ) {
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

    const tokens = await this.signTokens(user);
    await this.setTokensInCookies(res, tokens);
    return tokens;
  }

  @Post('login')
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() body: LoginDto,
  ) {
    const { email, password } = body;

    const user = await this.userService.getByEmail(email, true);

    const isPasswordCorrect = await this.authService.comparePasswordWithHash(
      password,
      user.password,
    );

    if (!isPasswordCorrect) {
      throw new UnauthorizedException(`Invalid credentials`);
    }

    const tokens = await this.signTokens(user);
    await this.setTokensInCookies(res, tokens);
    return tokens;
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refresh(
    @CurrentUser() payload: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.signTokens(payload);
    await this.setTokensInCookies(res, tokens);
    return tokens;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('accessToken', this.getCookieOptions(this.accessExpiresIn));
    res.clearCookie(
      'refreshToken',
      this.getCookieOptions(this.refreshExpiresIn),
    );

    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() payload: JwtPayload) {
    const user = await this.userService.getById(payload.sub);
    return {
      user,
      payload,
    };
  }
}
