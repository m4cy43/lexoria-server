import * as bcrypt from 'bcrypt';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { Role, User } from 'src/user/interfaces/user.interface';

import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async signToken(user: User | JwtPayload, jwtSignOptions?: JwtSignOptions) {
    const payload: JwtPayload = {
      sub: 'id' in user ? user.id : user.sub,
      email: user.email,
      roles: user.roles || [Role.USER],
    };

    return this.jwtService.signAsync(payload, jwtSignOptions);
  }

  async hashPassword(password: string) {
    return await bcrypt.hash(password, 12);
  }

  async comparePasswordWithHash(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
  }
}
