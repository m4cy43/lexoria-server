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

  prepareVectorString(book: Partial<Book>): string {
    return `${book.title} ${book.description || ''}`.trim();
  }

  async attachEmbedding(book: Partial<Book>): Promise<void> {
    const text = this.prepareVectorString(book);
    if (text) {
      book.embedding = await this.openAiService.generateEmbedding(text);
    }
  }

  async createBook(data: Partial<Book>): Promise<Book> {
    const book = this.bookRepository.create(data);

    await this.attachEmbedding(book);

    return this.bookRepository.save(book);
  }

  async updateMissingEmbeddingForBook(id: string): Promise<Book> {
    const book = await this.bookRepository.findOne({
      where: { id },
    });

    await this.attachEmbedding(book);
    if (book.embedding) {
      await this.bookRepository.save(book);
    }

    return book;
  }

  async updateAllMissingEmbeddings(batchSize = 100): Promise<string> {
    const books = await this.bookRepository.find({
      where: { embedding: null },
    });
    let counter = 0;

    for (let i = 0; i < books.length; i += batchSize) {
      const batch = books.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (book) => {
          const text = this.prepareVectorString(book);
          if (!text) return;

          try {
            book.embedding = await this.openAiService.generateEmbedding(text);
          } catch (e) {
            console.error(
              `❌ Failed embedding for book ${book.id}:`,
              e.message,
            );
            return;
          }
        }),
      );

      await this.bookRepository.save(batch.filter((b) => b.embedding));
      counter += batch.filter((b) => b.embedding).length;
    }

    return `✅ Updated embeddings: ${counter}`;
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

    qb.select([
      'book.id',
      'book.title',
      'book.publishedDate',
      'book.imageUrl',
      'author.id',
      'author.name',
      'category.id',
      'category.name',
      'publisher.id',
      'publisher.name',
    ]);

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
    const embeddingVector = Array.isArray(embedding)
      ? `[${embedding.join(',')}]`
      : embedding;

    const filterConditions: string[] = [];
    const filterParams: any[] = [];
    let paramIndex = 0;

    if (queryDto.filter?.categories?.length) {
      filterConditions.push(`EXISTS (
      SELECT 1 FROM book_categories bc 
      WHERE bc.book = b.id AND bc.category = ANY($${++paramIndex})
    )`);
      filterParams.push(queryDto.filter.categories);
    }

    if (queryDto.filter?.authors?.length) {
      filterConditions.push(`EXISTS (
      SELECT 1 FROM book_authors ba 
      WHERE ba.book = b.id AND ba.author = ANY($${++paramIndex})
    )`);
      filterParams.push(queryDto.filter.authors);
    }

    if (queryDto.filter?.publishers?.length) {
      filterConditions.push(`b."publisherId" = ANY($${++paramIndex})`);
      filterParams.push(queryDto.filter.publishers);
    }

    if (queryDto.filter?.publishedDateRange?.length === 2) {
      filterConditions.push(
        `b."publishedDate" BETWEEN $${++paramIndex} AND $${++paramIndex}`,
      );
      filterParams.push(
        queryDto.filter.publishedDateRange[0],
        queryDto.filter.publishedDateRange[1],
      );
    }

    if (
      queryDto.similarityThreshold !== undefined &&
      queryDto.similarityThreshold !== null
    ) {
      filterConditions.push(
        `(1 - (b.embedding <=> $0::vector)) >= $${++paramIndex}`,
      );
      filterParams.push(queryDto.similarityThreshold);
    }

    const whereClause =
      filterConditions.length > 0
        ? `WHERE ${filterConditions.join(' AND ')}`
        : '';

    // Main query parameters: embedding first, then filters, then pagination
    const mainQueryParams = [
      embeddingVector,
      ...filterParams,
      queryDto.limit,
      queryDto.skip,
    ];

    // Shift all parameters by 1 because embedding is $1, so filters start from $2
    const adjustedWhereClause = whereClause.replace(
      /\$(\d+)/g,
      (match, num) => {
        return `$${parseInt(num) + 1}`;
      },
    );

    const sql = `
    WITH filtered_books AS (
      SELECT 
        b.id, 
        b.title, 
        b."publishedDate", 
        b."imageUrl", 
        b."publisherId", 
        b.embedding,
        (1 - (b.embedding <=> $1::vector)) AS "similarityScore",
        (b.embedding <-> $1::vector) AS distance
      FROM books b
      ${adjustedWhereClause}
      ORDER BY b.embedding <-> $1::vector
      LIMIT $${filterParams.length + 2} OFFSET $${filterParams.length + 3}
    )
    SELECT 
      fb.id,
      fb.title,
      fb."publishedDate",
      fb."imageUrl",
      fb."similarityScore",
      fb.distance,
      COALESCE(
        JSON_AGG(DISTINCT jsonb_build_object('id', a.id, 'name', a.name))
        FILTER (WHERE a.id IS NOT NULL), '[]'
      ) AS authors,
      COALESCE(
        JSON_AGG(DISTINCT jsonb_build_object('id', c.id, 'name', c.name))
        FILTER (WHERE c.id IS NOT NULL), '[]'
      ) AS categories,
      jsonb_build_object('id', p.id, 'name', p.name) AS publisher
    FROM filtered_books fb
    LEFT JOIN book_authors ba ON ba.book = fb.id
    LEFT JOIN authors a ON a.id = ba.author
    LEFT JOIN book_categories bc ON bc.book = fb.id
    LEFT JOIN categories c ON c.id = bc.category
    LEFT JOIN publishers p ON p.id = fb."publisherId"
    GROUP BY fb.id, fb.title, fb."publishedDate", fb."imageUrl", fb."similarityScore", fb.distance, fb.embedding, p.id, p.name
    ORDER BY fb.embedding <-> $1::vector
  `;

    const books = await this.dataSource.query(sql, mainQueryParams);

    let countSql: string;
    let countParams: any[];

    if (
      queryDto.similarityThreshold !== undefined &&
      queryDto.similarityThreshold !== null
    ) {
      countSql = `
      SELECT COUNT(DISTINCT b.id) AS total
      FROM books b
      ${adjustedWhereClause}
    `;
      countParams = [embeddingVector, ...filterParams];
    } else {
      countSql = `
      SELECT COUNT(DISTINCT b.id) AS total
      FROM books b
      ${whereClause}
    `;
      countParams = filterParams;
    }
    const totalRes = await this.dataSource.query(countSql, countParams);
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
