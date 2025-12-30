import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { BaseQueryDto } from '../common/dto/query.dto';
import { ItemsWithTotal } from '../common/interfaces/pagination.interface';
import { Publisher } from './entities/publisher.entity';

@Injectable()
export class PublisherService {
  constructor(
    @InjectRepository(Publisher)
    private publisherRepository: Repository<Publisher>,
  ) {}

  async searchByRegex(query: BaseQueryDto): Promise<ItemsWithTotal<Publisher>> {
    const qb = this.publisherRepository
      .createQueryBuilder('publisher')
      .select(['publisher.id', 'publisher.name'])
      .orderBy('name', 'ASC');

    if (query.search) {
      qb.where('publisher.name ILIKE :search', { search: `%${query.search}%` });
    }

    const [items, total] = await qb
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();

    return { items, total };
  }
}
