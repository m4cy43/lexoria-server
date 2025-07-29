import { JwtPayload as BaseJwtPayload } from 'jsonwebtoken';
import { Role } from 'src/user/interfaces/user.interface';

export interface JwtPayload extends BaseJwtPayload {
  email: string;
  roles: Role[];
}
