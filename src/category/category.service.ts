import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { BaseQueryDto } from '../common/dto/query.dto';
import { ItemsWithTotal } from '../common/interfaces/pagination.interface';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async searchByRegex(query: BaseQueryDto): Promise<ItemsWithTotal<Category>> {
    const qb = this.categoryRepository
      .createQueryBuilder('category')
      .select(['category.id', 'category.name'])
      .orderBy('name', 'ASC');

    if (query.search) {
      qb.where('category.name ILIKE :search', { search: `%${query.search}%` });
    }

    const [items, total] = await qb
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();

    return { items, total };
  }
}
