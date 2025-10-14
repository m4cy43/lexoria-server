import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { BaseQueryDto } from '../common/dto/query.dto';
import { ItemsWithTotal } from '../common/interfaces/pagination.interface';
import { Author } from './entities/author.entity';

@Injectable()
export class AuthorService {
  constructor(
    @InjectRepository(Author)
    private authorRepository: Repository<Author>,
  ) {}

  async searchByRegex(query: BaseQueryDto): Promise<ItemsWithTotal<Author>> {
    const qb = this.authorRepository
      .createQueryBuilder('author')
      .select(['author.id', 'author.name'])
      .orderBy('name', 'ASC');

    if (query.search) {
      qb.where('author.name ILIKE :search', { search: `%${query.search}%` });
    }

    const [items, total] = await qb
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();

    return { items, total };
  }
}
