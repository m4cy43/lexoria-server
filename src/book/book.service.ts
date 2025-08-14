import { ItemsWithTotal } from 'src/common/interfaces/pagination.interface';
import { OpenAiService } from 'src/openai/openai.service';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { BookQueryDto } from './dto/books-query.dto';
import { Book } from './entities/book.entity';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Book) private readonly bookRepository: Repository<Book>,
    private readonly dataSource: DataSource,
    private readonly openAiService: OpenAiService,
  ) {}

  async createBook(data: Partial<Book>): Promise<Book> {
    const book = this.bookRepository.create(data);

    const text = `${book.title} ${book.description || ''}`.trim();
    if (text) {
      book.embedding = await this.openAiService.generateEmbedding(text);
    }

    return this.bookRepository.save(book);
  }

  async updateMissingEmbeddingForBook(id: string): Promise<Book> {
    const book = await this.bookRepository.findOne({
      where: { id },
    });

    const text = `${book.title} ${book.description || ''}`.trim();
    if (text) {
      book.embedding = await this.openAiService.generateEmbedding(text);
      await this.bookRepository.save(book);
    }

    return book;
  }

  async getById(id: string): Promise<Book> {
    const book = await this.bookRepository.findOne({
      where: { id },
      relations: { authors: true, categories: true, publisher: true },
    });
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} have not found`);
    }

    return book;
  }

  async searchByText(queryDto: BookQueryDto): Promise<ItemsWithTotal<Book>> {
    const qb = this.buildBaseQuery(queryDto);

    if (queryDto.search) {
      qb.andWhere(
        '(book.title ILIKE :search OR book.description ILIKE :search OR author.name ILIKE :search)',
        { search: `%${queryDto.search}%` },
      );
    }

    return this.executeWithPagination(qb, queryDto);
  }

  async searchByVector(
    embedding: number[],
    queryDto: BookQueryDto,
  ): Promise<ItemsWithTotal<Book>> {
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (queryDto.filter?.categories?.length) {
      whereClauses.push(`c.id = ANY($${params.length + 1})`);
      params.push(queryDto.filter.categories);
    }
    if (queryDto.filter?.authors?.length) {
      whereClauses.push(`a.id = ANY($${params.length + 1})`);
      params.push(queryDto.filter.authors);
    }
    if (queryDto.filter?.publishers?.length) {
      whereClauses.push(`p.id = ANY($${params.length + 1})`);
      params.push(queryDto.filter.publishers);
    }

    const filterSql = whereClauses.length
      ? `WHERE ${whereClauses.join(' AND ')}`
      : '';

    const sql = `
    SELECT b.*
    FROM books b
    LEFT JOIN book_authors ba ON ba.book = b.id
    LEFT JOIN authors a ON a.id = ba.author
    LEFT JOIN book_categories bc ON bc.book = b.id
    LEFT JOIN categories c ON c.id = bc.category
    LEFT JOIN publishers p ON p.id = b."publisherId"
    ${filterSql}
    ORDER BY b.embedding <-> $${params.length + 1}
    LIMIT $${params.length + 2} OFFSET $${params.length + 3}
  `;

    let embeddingVector = embedding;
    if (embedding && Array.isArray(embedding)) {
      embeddingVector = JSON.stringify(embedding) as any;
    }

    params.push(embeddingVector, queryDto.limit, queryDto.skip);

    const books = await this.dataSource.query(sql, params);

    const countSql = `
    SELECT COUNT(DISTINCT b.id) AS total
    FROM books b
    LEFT JOIN book_authors ba ON ba.book = b.id
    LEFT JOIN authors a ON a.id = ba.author
    LEFT JOIN book_categories bc ON bc.book = b.id
    LEFT JOIN categories c ON c.id = bc.category
    LEFT JOIN publishers p ON p.id = b."publisherId"
    ${filterSql}
  `;
    const totalRes = await this.dataSource.query(
      countSql,
      params.slice(0, params.length - 3),
    );
    const total = Number(totalRes[0]?.total || 0);

    return { items: books, total };
  }

  private buildBaseQuery(queryDto: BookQueryDto): SelectQueryBuilder<Book> {
    const qb = this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.authors', 'author')
      .leftJoinAndSelect('book.categories', 'category')
      .leftJoinAndSelect('book.publisher', 'publisher');

    if (queryDto.filter?.categories?.length) {
      qb.andWhere('category.id IN (:...categoryIds)', {
        categoryIds: queryDto.filter.categories,
      });
    }
    if (queryDto.filter?.authors?.length) {
      qb.andWhere('author.id IN (:...authorIds)', {
        authorIds: queryDto.filter.authors,
      });
    }
    if (queryDto.filter?.publishers?.length) {
      qb.andWhere('publisher.id IN (:...publisherIds)', {
        publisherIds: queryDto.filter.publishers,
      });
    }
    if (queryDto.filter?.publishedDateRange?.length === 2) {
      qb.andWhere('book.publishedDate BETWEEN :startDate AND :endDate', {
        startDate: queryDto.filter.publishedDateRange[0],
        endDate: queryDto.filter.publishedDateRange[1],
      });
    }

    if (queryDto.sort) {
      Object.entries(queryDto.sort).forEach(([field, direction], index) => {
        const method = index === 0 ? 'orderBy' : 'addOrderBy';
        switch (field) {
          case 'title':
            qb[method]('book.title', direction);
            break;
          case 'publishedDate':
            qb[method]('book.publishedDate', direction);
            break;
          case 'categories':
            qb[method]('category.name', direction);
            break;
          case 'authors':
            qb[method]('author.name', direction);
            break;
          case 'publishers':
            qb[method]('publisher.name', direction);
            break;
        }
      });
    } else {
      qb.orderBy('book.title', 'ASC');
    }

    return qb;
  }

  private async executeWithPagination(
    qb: SelectQueryBuilder<Book>,
    queryDto: BookQueryDto,
  ): Promise<ItemsWithTotal<Book>> {
    const [items, total] = await qb
      .skip(queryDto.skip)
      .take(queryDto.limit)
      .getManyAndCount();

    return { items, total };
  }
}
