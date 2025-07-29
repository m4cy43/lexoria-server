import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtRefreshGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    const refreshSecret = this.configService.get<string>('REFRESH_JWT_SECRET');

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: refreshSecret,
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
