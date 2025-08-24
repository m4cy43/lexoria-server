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

  private buildFilters(queryDto: BookQueryDto, startIndex = 1) {
    const params: any[] = [];
    const filterConditions: string[] = [];
    let nextParamIndex = startIndex;

    if (queryDto.filter?.categories?.length) {
      filterConditions.push(`EXISTS (
        SELECT 1 FROM book_categories bc 
        WHERE bc.book = b.id AND bc.category = ANY($${nextParamIndex})
      )`);
      params.push(queryDto.filter.categories);
      nextParamIndex++;
    }

    if (queryDto.filter?.authors?.length) {
      filterConditions.push(`EXISTS (
        SELECT 1 FROM book_authors ba 
        WHERE ba.book = b.id AND ba.author = ANY($${nextParamIndex})
      )`);
      params.push(queryDto.filter.authors);
      nextParamIndex++;
    }

    if (queryDto.filter?.publishers?.length) {
      filterConditions.push(`b."publisherId" = ANY($${nextParamIndex})`);
      params.push(queryDto.filter.publishers);
      nextParamIndex++;
    }

    if (queryDto.filter?.publishedDateRange?.length === 2) {
      filterConditions.push(
        `b."publishedDate" BETWEEN $${nextParamIndex} AND $${nextParamIndex + 1}`,
      );
      params.push(
        queryDto.filter.publishedDateRange[0],
        queryDto.filter.publishedDateRange[1],
      );
      nextParamIndex += 2;
    }

    return {
      params,
      filterConditions,
      nextParamIndex,
    };
  }

  async searchByVector(
    embedding: number[],
    queryDto: BookQueryDto,
  ): Promise<ItemsWithTotal<Book>> {
    const embeddingVector = Array.isArray(embedding)
      ? `[${embedding.join(',')}]`
      : embedding;

    const { params, filterConditions, nextParamIndex } = this.buildFilters(
      queryDto,
      2,
    );

    const allParams = [embeddingVector, ...params];

    if (
      queryDto.similarityThreshold !== undefined &&
      queryDto.similarityThreshold !== null
    ) {
      filterConditions.push(
        `(1 - (b.embedding <=> $1::vector)) >= $${nextParamIndex}`,
      );
      allParams.push(queryDto.similarityThreshold);
    }

    const limitParamIndex = allParams.length + 1;
    const offsetParamIndex = allParams.length + 2;
    allParams.push(queryDto.limit, queryDto.skip);

    const whereClause =
      filterConditions.length > 0
        ? `WHERE ${filterConditions.join(' AND ')}`
        : '';

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
        ${whereClause}
        ORDER BY b.embedding <-> $1::vector
        LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
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

    const books = await this.dataSource.query(sql, allParams);

    const countParams = queryDto.similarityThreshold
      ? allParams.slice(0, -2)
      : allParams.slice(1, -2);
    const countSql = `
      SELECT COUNT(DISTINCT b.id) AS total
      FROM books b
      ${whereClause}
    `;

    const totalRes = await this.dataSource.query(countSql, countParams);
    const total = Number(totalRes[0]?.total || 0);

    return { items: books, total };
  }

  async searchByFuzzy(
    query: string,
    queryDto: BookQueryDto,
  ): Promise<ItemsWithTotal<Book>> {
    const { params, filterConditions, nextParamIndex } = this.buildFilters(
      queryDto,
      2,
    );

    const allParams = [query, ...params];

    const fuzzyCondition = `(b.title % $1 OR EXISTS (
      SELECT 1 FROM book_authors ba 
      JOIN authors a ON a.id = ba.author 
      WHERE ba.book = b.id AND a.name % $1
    ) OR EXISTS (
      SELECT 1 FROM book_categories bc 
      JOIN categories c ON c.id = bc.category 
      WHERE bc.book = b.id AND c.name % $1
    ))`;

    let currentNextParamIndex = nextParamIndex;
    if (
      queryDto.fuzzyThreshold !== undefined &&
      queryDto.fuzzyThreshold !== null
    ) {
      filterConditions.push(`GREATEST(
        similarity(b.title, $1),
        COALESCE((
          SELECT MAX(similarity(a.name, $1))
          FROM book_authors ba
          JOIN authors a ON a.id = ba.author
          WHERE ba.book = b.id
        ), 0),
        COALESCE((
          SELECT MAX(similarity(c.name, $1))
          FROM book_categories bc
          JOIN categories c ON c.id = bc.category
          WHERE bc.book = b.id
        ), 0)
      ) >= $${currentNextParamIndex}`);
      allParams.push(queryDto.fuzzyThreshold);
      currentNextParamIndex++;
    }

    const whereClause =
      filterConditions.length > 0
        ? `WHERE ${fuzzyCondition} AND ${filterConditions.join(' AND ')}`
        : `WHERE ${fuzzyCondition}`;

    const limitParamIndex = allParams.length + 1;
    const offsetParamIndex = allParams.length + 2;
    allParams.push(queryDto.limit, queryDto.skip);

    const sql = `
      WITH scored_books AS (
        SELECT 
          b.id, 
          b.title, 
          b."publishedDate", 
          b."imageUrl", 
          b."publisherId",
          GREATEST(
            similarity(b.title, $1),
            COALESCE((
              SELECT MAX(similarity(a.name, $1))
              FROM book_authors ba
              JOIN authors a ON a.id = ba.author
              WHERE ba.book = b.id
            ), 0),
            COALESCE((
              SELECT MAX(similarity(c.name, $1))
              FROM book_categories bc
              JOIN categories c ON c.id = bc.category
              WHERE bc.book = b.id
            ), 0)
          ) AS "fuzzyScore"
        FROM books b
        ${whereClause}
      ),
      filtered_books AS (
        SELECT 
          id, title, "publishedDate", "imageUrl", "publisherId", "fuzzyScore"
        FROM scored_books
        ORDER BY "fuzzyScore" DESC
        LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
      )
      SELECT 
        fb.id, 
        fb.title, 
        fb."publishedDate", 
        fb."imageUrl",
        fb."fuzzyScore",
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
      GROUP BY fb.id, fb.title, fb."publishedDate", fb."imageUrl", fb."fuzzyScore", p.id, p.name
      ORDER BY fb."fuzzyScore" DESC
    `;

    const books = await this.dataSource.query(sql, allParams);

    const countSql = `
      SELECT COUNT(DISTINCT b.id) AS total
      FROM books b
      ${whereClause}
    `;

    const countParams = allParams.slice(0, -2);
    const totalRes = await this.dataSource.query(countSql, countParams);

    return { items: books, total: Number(totalRes[0]?.total || 0) };
  }

  async searchByHybrid(
    embedding: number[],
    query: string,
    queryDto: BookQueryDto,
  ): Promise<ItemsWithTotal<Book>> {
    const embeddingVector = Array.isArray(embedding)
      ? `[${embedding.join(',')}]`
      : embedding;

    const { params, filterConditions, nextParamIndex } = this.buildFilters(
      queryDto,
      3,
    );

    const allParams = [embeddingVector, query, ...params];

    const fuzzyCondition = `(b.title % $2 OR EXISTS (
      SELECT 1 FROM book_authors ba 
      JOIN authors a ON a.id = ba.author 
      WHERE ba.book = b.id AND a.name % $2
    ) OR EXISTS (
      SELECT 1 FROM book_categories bc 
      JOIN categories c ON c.id = bc.category 
      WHERE bc.book = b.id AND c.name % $2
    ))`;

    let currentNextParamIndex = nextParamIndex;
    if (
      queryDto.similarityThreshold !== undefined &&
      queryDto.similarityThreshold !== null
    ) {
      filterConditions.push(
        `(1 - (b.embedding <=> $1::vector)) >= $${currentNextParamIndex}`,
      );
      allParams.push(queryDto.similarityThreshold);
      currentNextParamIndex++;
    }

    if (
      queryDto.fuzzyThreshold !== undefined &&
      queryDto.fuzzyThreshold !== null
    ) {
      filterConditions.push(`GREATEST(
        similarity(b.title, $2),
        COALESCE((
          SELECT MAX(similarity(a.name, $2))
          FROM book_authors ba
          JOIN authors a ON a.id = ba.author
          WHERE ba.book = b.id
        ), 0),
        COALESCE((
          SELECT MAX(similarity(c.name, $2))
          FROM book_categories bc
          JOIN categories c ON c.id = bc.category
          WHERE bc.book = b.id
        ), 0)
      ) >= $${currentNextParamIndex}`);
      allParams.push(queryDto.fuzzyThreshold);
      currentNextParamIndex++;
    }

    const whereClause =
      filterConditions.length > 0
        ? `WHERE ${fuzzyCondition} AND ${filterConditions.join(' AND ')}`
        : `WHERE ${fuzzyCondition}`;

    const limitParamIndex = allParams.length + 1;
    const offsetParamIndex = allParams.length + 2;
    allParams.push(queryDto.limit, queryDto.skip);

    const sql = `
      WITH scored_books AS (
        SELECT 
          b.id, 
          b.title, 
          b."publishedDate", 
          b."imageUrl", 
          b."publisherId",
          (1 - (b.embedding <=> $1::vector)) AS "similarityScore",
          (b.embedding <-> $1::vector) AS distance,
          GREATEST(
            similarity(b.title, $2),
            COALESCE((
              SELECT MAX(similarity(a.name, $2))
              FROM book_authors ba
              JOIN authors a ON a.id = ba.author
              WHERE ba.book = b.id
            ), 0),
            COALESCE((
              SELECT MAX(similarity(c.name, $2))
              FROM book_categories bc
              JOIN categories c ON c.id = bc.category
              WHERE bc.book = b.id
            ), 0)
          ) AS "fuzzyScore"
        FROM books b
        ${whereClause}
      ),
      filtered_books AS (
        SELECT 
          *,
          ("similarityScore" * 0.6 + "fuzzyScore" * 0.4) AS "hybridScore"
        FROM scored_books
        ORDER BY "hybridScore" DESC
        LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
      )
      SELECT 
        fb.id, 
        fb.title, 
        fb."publishedDate", 
        fb."imageUrl",
        fb."similarityScore", 
        fb.distance, 
        fb."fuzzyScore",
        fb."hybridScore",
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
      GROUP BY fb.id, fb.title, fb."publishedDate", fb."imageUrl", 
              fb."similarityScore", fb.distance, fb."fuzzyScore", fb."hybridScore", 
              p.id, p.name
      ORDER BY fb."hybridScore" DESC
    `;

    const books = await this.dataSource.query(sql, allParams);

    let countParamIndex = 1;
    const countParams = [query];

    const needsEmbedding =
      queryDto.similarityThreshold !== undefined &&
      queryDto.similarityThreshold !== null;

    let embeddingParamIndex = null;
    if (needsEmbedding) {
      countParams.push(embeddingVector);
      embeddingParamIndex = ++countParamIndex;
    }

    const {
      params: countFilterParams,
      filterConditions: countFilterConditions,
    } = this.buildFilters(queryDto, countParamIndex + 1);

    countParams.push(...countFilterParams);
    countParamIndex += countFilterParams.length;

    const countFuzzyCondition = `(b.title % $1 OR EXISTS (
      SELECT 1 FROM book_authors ba 
      JOIN authors a ON a.id = ba.author 
      WHERE ba.book = b.id AND a.name % $1
    ) OR EXISTS (
      SELECT 1 FROM book_categories bc 
      JOIN categories c ON c.id = bc.category 
      WHERE bc.book = b.id AND c.name % $1
    ))`;

    if (needsEmbedding) {
      countFilterConditions.push(
        `(1 - (b.embedding <=> $${embeddingParamIndex}::vector)) >= $${countParamIndex + 1}`,
      );
      countParams.push(queryDto.similarityThreshold.toString());
      countParamIndex++;
    }

    if (
      queryDto.fuzzyThreshold !== undefined &&
      queryDto.fuzzyThreshold !== null
    ) {
      countFilterConditions.push(`GREATEST(
        similarity(b.title, $1),
        COALESCE((
          SELECT MAX(similarity(a.name, $1))
          FROM book_authors ba
          JOIN authors a ON a.id = ba.author
          WHERE ba.book = b.id
        ), 0),
        COALESCE((
          SELECT MAX(similarity(c.name, $1))
          FROM book_categories bc
          JOIN categories c ON c.id = bc.category
          WHERE bc.book = b.id
        ), 0)
      ) >= $${countParamIndex + 1}`);
      countParams.push(queryDto.fuzzyThreshold.toString());
    }

    const countWhereClause =
      countFilterConditions.length > 0
        ? `WHERE ${countFuzzyCondition} AND ${countFilterConditions.join(' AND ')}`
        : `WHERE ${countFuzzyCondition}`;

    const countSql = `
      SELECT COUNT(DISTINCT b.id) AS total
      FROM books b
      ${countWhereClause}
    `;

    const totalRes = await this.dataSource.query(countSql, countParams);

    return { items: books, total: Number(totalRes[0]?.total || 0) };
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
