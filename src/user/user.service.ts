import { Repository } from 'typeorm';

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchLog, SearchType } from './entities/search-log.entity';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SearchLog)
    private readonly searchLogRepository: Repository<SearchLog>,
  ) {}

  async getById(userId: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User ${userId} has not been found`);
    }

    return user;
  }

  async getByEmail(
    email: string,
    includePassword: boolean = false,
  ): Promise<User> {
    let user: User | null;

    if (includePassword) {
      user = await this.userRepository
        .createQueryBuilder('user')
        .where('user.email = :email', { email })
        .addSelect('user.password')
        .getOne();
    } else {
      user = await this.userRepository.findOne({
        where: { email },
      });
    }

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async create(user: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: user.email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const newUser = this.userRepository.create(user);
    return this.userRepository.save(newUser);
  }

  async update(id: string, user: UpdateUserDto): Promise<void> {
    await this.getById(id);

    if (user.email) {
      const existingUser = await this.getByEmail(user.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('User with this email already exists');
      }
    }

    await this.userRepository.update(id, user);
  }

  /**
   * Logs search actions to the database
   */
  async logSearch(
    userId: string,
    searchType: SearchType,
    queryText: string,
    resultsCount: number,
    executionTimeMs: number,
  ): Promise<void> {
    const user = await this.getById(userId);

    const log = this.searchLogRepository.create({
      searchType,
      queryText,
      resultsCount,
      executionTimeMs,
      user: user,
    });

    await this.searchLogRepository.save(log);
  }

  async findUserLogs(userId: string) {
    const user = await this.getById(userId);

    const logs = await this.searchLogRepository.find({
      where: { user: user },
      order: { createdAt: 'desc' },
      take: 5,
    });

    return logs;
  }
}
