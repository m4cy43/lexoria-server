export enum Role {
  USER = 'user',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  iconUrl?: string;
  roles: Role[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
