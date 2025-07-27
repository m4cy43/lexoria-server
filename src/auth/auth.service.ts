import * as bcrypt from 'bcrypt';
import { JwtPayload } from 'src/jwt/interfaces/jwt-payload.interface';
import { Role, User } from 'src/user/interfaces/user.interface';

import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async signToken(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles || [Role.USER],
    };

    const token = await this.jwtService.signAsync(payload);

    return token;
  }

  async verifyToken(token: string) {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async hashPassword(password: string) {
    return await bcrypt.hash(password, 12);
  }

  async comparePasswordWithHash(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
  }
}
