import { BookService } from 'src/book/book.service';
import { Book } from 'src/book/entities/book.entity';
import { Repository } from 'typeorm';

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Favorite } from './entities/favorite.entity';
import { LastSeen } from './entities/lastseen.entity';
import { SearchLog, SearchType } from './entities/search-log.entity';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SearchLog)
    private readonly searchLogRepository: Repository<SearchLog>,
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    @InjectRepository(LastSeen)
    private readonly lastSeenRepository: Repository<LastSeen>,
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

  async logSearch(
    userId: string,
    searchType: SearchType,
    queryText: string,
    resultsCount: number,
    executionTimeMs: number,
  ): Promise<void> {
    const user = await this.getById(userId);

    await this.searchLogRepository.upsert(
      {
        user,
        searchType,
        queryText,
        resultsCount,
        executionTimeMs,
      },
      ['user', 'queryText'],
    );

    await this.searchLogRepository.query(
      `
      DELETE FROM search_logs
      WHERE "userId" = $1
      AND id NOT IN (
        SELECT id FROM search_logs
        WHERE "userId" = $1
        ORDER BY "createdAt" DESC
        LIMIT 10
      )
    `,
      [userId],
    );
  }

  private isUser(obj: unknown): obj is User {
    return typeof obj === 'object' && obj !== null && 'id' in obj;
  }

  async findUserLogs(userOrId: string | User, limit: number = 5) {
    const user = this.isUser(userOrId)
      ? userOrId
      : await this.getById(userOrId);

    const logs = await this.searchLogRepository.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'desc' },
      take: limit,
    });

    return logs;
  }

  async addToFavorite(user: User, book: Book) {
    const favorite = await this.favoriteRepository.findOneBy({
      user: { id: user.id },
      book: { id: book.id },
    });
    if (favorite) {
      await this.favoriteRepository.remove(favorite);
    } else {
      const newFavorite = this.favoriteRepository.create({ user, book });
      await this.favoriteRepository.save(newFavorite);
    }
    return { success: true };
  }

  async favoriteList(userOrId: string | User, limit: number = 5) {
    const user = this.isUser(userOrId)
      ? userOrId
      : await this.getById(userOrId);

    const logs = await this.favoriteRepository.find({
      relations: { book: true },
      where: { user: { id: user.id } },
      order: { createdAt: 'desc' },
      take: limit,
    });

    return logs;
  }

  async isInFavoriteList(userId: string, bookId: string) {
    const user = await this.getById(userId);
    return await this.favoriteRepository.findOneBy({
      user: { id: user.id },
      book: { id: bookId },
    });
  }

  async addToLastSeen(userOrId: string | User, book: Book, limit = 10) {
    const user = this.isUser(userOrId)
      ? userOrId
      : await this.getById(userOrId);

    const existing = await this.lastSeenRepository.findOne({
      where: { user: { id: user.id }, book: { id: book.id } },
    });

    if (existing) {
      await this.lastSeenRepository.remove(existing);
    }

    const newLastSeen = this.lastSeenRepository.create({ user, book });
    await this.lastSeenRepository.save(newLastSeen);

    await this.lastSeenRepository.query(
      `
      DELETE FROM last_seen
      WHERE "userId" = $1
      AND id NOT IN (
        SELECT id FROM last_seen
        WHERE "userId" = $1
        ORDER BY "createdAt" DESC
        LIMIT $2
      )
    `,
      [user.id, limit],
    );

    return { success: true };
  }

  async lastSeenList(userOrId: string | User, limit: number = 5) {
    const user = this.isUser(userOrId)
      ? userOrId
      : await this.getById(userOrId);

    const lastSeen = await this.lastSeenRepository.find({
      relations: { book: true },
      where: { user: { id: user.id } },
      order: { createdAt: 'desc' },
      take: limit,
    });

    return lastSeen;
  }
}
