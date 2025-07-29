import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    const accessSecret = this.configService.get<string>('ACCESS_JWT_SECRET');

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: accessSecret,
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractToken(request: any): string | undefined {
    const cookieToken =
      request.cookies?.accessToken || request.cookies?.jwtToken;
    if (cookieToken) {
      return cookieToken;
    }

    const [type, headerToken] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? headerToken : undefined;
  }
}
