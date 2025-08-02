import { ItemsWithTotal } from 'src/common/interfaces/pagination.interface';
import { Repository } from 'typeorm';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { BookQueryDto } from './dto/books-query.dto';
import { Book } from './entities/book.entity';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {}

  async getById(id: string): Promise<Book> {
    const book = await this.bookRepository.findOne({
      where: { id: id },
      relations: { authors: true, categories: true, publisher: true },
    });
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} have not found`);
    }

    return book;
  }

  async getList(queryDto: BookQueryDto): Promise<ItemsWithTotal<Book>> {
    const { search, limit, skip, sort, filter } = queryDto;

    const queryBuilder = this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.authors', 'author')
      .leftJoinAndSelect('book.categories', 'category')
      .leftJoinAndSelect('book.publisher', 'publisher')
      .orderBy();

    if (search) {
      queryBuilder.andWhere(
        '(book.title ILIKE :search OR book.description ILIKE :search OR author.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (filter?.categories?.length) {
      queryBuilder.andWhere('category.id IN (:...categoryIds)', {
        categoryIds: filter.categories,
      });
    }

    if (filter?.authors?.length) {
      queryBuilder.andWhere('author.id IN (:...authorIds)', {
        authorIds: filter.authors,
      });
    }

    if (filter?.publishers?.length) {
      queryBuilder.andWhere('publisher.id IN (:...publisherIds)', {
        publisherIds: filter.publishers,
      });
    }

    if (filter?.publishedDateRange?.length === 2) {
      queryBuilder.andWhere(
        'book.publishedDate BETWEEN :startDate AND :endDate',
        {
          startDate: filter.publishedDateRange[0],
          endDate: filter.publishedDateRange[1],
        },
      );
    }

    if (sort) {
      const sortEntries = Object.entries(sort);
      sortEntries.forEach(([field, direction], index) => {
        const orderMethod = index === 0 ? 'orderBy' : 'addOrderBy';

        switch (field) {
          case 'title':
            queryBuilder[orderMethod]('book.title', direction);
            break;
          case 'publishedDate':
            queryBuilder[orderMethod]('book.publishedDate', direction);
            break;
          case 'categories':
            queryBuilder[orderMethod]('category.name', direction);
            break;
          case 'authors':
            queryBuilder[orderMethod]('author.name', direction);
            break;
          case 'publishers':
            queryBuilder[orderMethod]('publisher.name', direction);
            break;
        }
      });
    } else {
      queryBuilder.orderBy('book.title', 'ASC');
    }

    const [items, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }
}
