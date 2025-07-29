import * as bcrypt from 'bcrypt';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { Role, User } from 'src/user/interfaces/user.interface';

import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async signToken(user: User | JwtPayload, jwtSignOptions?: JwtSignOptions) {
    let payload: JwtPayload;

    if ('id' in user) {
      payload = {
        sub: user.id,
        email: user.email,
        roles: user.roles || [Role.USER],
      };
    } else {
      payload = {
        sub: user.sub,
        email: user.email,
        roles: user.roles || [Role.USER],
      };
    }

    const token = jwtSignOptions
      ? await this.jwtService.signAsync(payload, jwtSignOptions)
      : await this.jwtService.signAsync(payload);

    return token;
  }

  async hashPassword(password: string) {
    return await bcrypt.hash(password, 12);
  }

  async comparePasswordWithHash(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
  }
}
