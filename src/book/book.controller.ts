import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { ItemsWithTotal } from 'src/common/interfaces/pagination.interface';
import { buildPaginatedResponse } from 'src/common/utils/pagination.util';
import { LocalEmbeddingService } from 'src/embedding/embedding.service';
import { OpenAiService } from 'src/openai/openai.service';
import { SearchType } from 'src/user/entities/search-log.entity';
import { UserService } from 'src/user/user.service';

import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { BookService } from './book.service';
import { BookQueryDto } from './dto/books-query.dto';
import { Book } from './interfaces/book.interface';

@Controller('books')
export class BookController {
  constructor(
    private readonly openAiService: OpenAiService,
    private readonly bookService: BookService,
    private readonly userService: UserService,
    private readonly localEmbeddingService: LocalEmbeddingService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async bookList(
    @Query() query: BookQueryDto,
    @CurrentUser() userPayload: JwtPayload,
  ) {
    console.log(userPayload.sub, query, query.filter);

    const user = await this.userService.getById(userPayload.sub);

    const { searchType, search } = query;
    const startTime = Date.now();
    let list;

    if (!query.search) {
      // Try to make recommendations
      list = await this.bookService.recommendForUser(user, query);

      if (!list.items.length) {
        list = await this.bookService.searchByText(query);
      }
    } else if (searchType === SearchType.VECTOR) {
      const userInterestVector =
        await this.bookService.userInterestVector(user);
      const searchVector = await this.openAiService.generateEmbedding(search);
      const embedding = await this.localEmbeddingService.meanVector([
        { vector: searchVector, weight: 0.8 },
        { vector: userInterestVector, weight: 0.2 },
      ]);
      list = await this.bookService.searchByVector(embedding, query);
    } else if (searchType === SearchType.FUZZY) {
      list = await this.bookService.searchByFuzzy(search, query);
    } else if (searchType === SearchType.HYBRID_FAST) {
      const userInterestVector =
        await this.bookService.userInterestVector(user);
      const searchVector = await this.openAiService.generateEmbedding(search);
      const embedding = await this.localEmbeddingService.meanVector([
        { vector: searchVector, weight: 0.8 },
        { vector: userInterestVector, weight: 0.2 },
      ]);
      list = await this.bookService.searchByHybrid(embedding, search, query);
    } else if (searchType === SearchType.HYBRID) {
      const userInterestVector =
        await this.bookService.userInterestVector(user);
      const searchVector = await this.openAiService.generateEmbedding(search);
      const embedding = await this.localEmbeddingService.meanVector([
        { vector: searchVector, weight: 0.8 },
        { vector: userInterestVector, weight: 0.2 },
      ]);
      list = await this.bookService.searchByHybrid(embedding, search, query);
    } else if (searchType === SearchType.RAG) {
      const userInterestVector =
        await this.bookService.userInterestVector(user);
      const searchVector = await this.openAiService.generateEmbedding(search);
      const embedding = await this.localEmbeddingService.meanVector([
        { vector: searchVector, weight: 0.8 },
        { vector: userInterestVector, weight: 0.2 },
      ]);

      query.chunkLoadLimit ??= 3;
      query.similarityThreshold ??= 0.35;
      query.limit = 20;
      query.skip = undefined;

      list = await this.bookService.searchByVector(embedding, query);

      console.log(list);

      const globalChunkLimit = query.totalChunksLimit ?? 10;

      const topChunks = list.items
        .flatMap((b) =>
          (b.chunks ?? []).map((c, idx) => ({
            bookId: b.id,
            bookTitle: b.title,
            text: `Book ID: ${b.id}\nTitle: "${b.title}"\nChunk ${idx + 1}:\n${c.content}`,
            score: c.similarityScore,
          })),
        )
        .sort((a, b) => b.score - a.score)
        .slice(0, globalChunkLimit);

      let context = topChunks.map((c) => c.text).join('\n\n');
      const maxContextLength = 8000;
      if (context.length > maxContextLength) {
        context = context.slice(0, maxContextLength);
      }

      const systemPrompt = `You are a helpful librarian assistant.
Recommend the most relevant books based on the provided context.
Only recommend books that are in the list.
Always return results as a valid JSON array of objects with fields: "id" and "reason".`;

      const userPrompt = `User query: "${search}".
Relevant book content:
${context}

Now recommend reasonable amount of books (2-5) to the user.
Remember: output only JSON, example:
[
  { "id": "book-uuid-123", "reason": "Why this fits" },
  { "id": "book-uuid-456", "reason": "Why this fits" }
]`;

      const llmRaw = await this.openAiService.askLLM(systemPrompt, userPrompt);

      let recommended: Array<{ id: string; reason: string }> = [];

      const parsed =
        this.safeJsonParse<Array<{ id: string; reason: string }>>(llmRaw);
      if (parsed) {
        recommended = parsed;
      } else {
        console.warn('Falling back to empty list or retrying...');
      }

      const recommendedBooks = recommended
        .map((r) => {
          const book = list.items.find((b) => b.id === r.id);
          return book ? { ...book, reason: r.reason } : null;
        })
        .filter(Boolean);

      const executionTimeMs = Date.now() - startTime;
      const resultsCount = list.total ?? 0;

      if (query.search) {
        await this.userService.logSearch(
          user,
          (searchType as SearchType) || SearchType.TEXT,
          search || '',
          resultsCount,
          executionTimeMs,
        );
      }

      return {
        ...buildPaginatedResponse(list, query),
        recommended: recommendedBooks,
      };
    } else {
      list = await this.bookService.searchByText(query);
    }

    if (!list) {
      throw new BadRequestException(`Unknown search type: ${searchType}`);
    }

    const executionTimeMs = Date.now() - startTime;
    const resultsCount = list.total ?? 0;

    if (query.search) {
      await this.userService.logSearch(
        user,
        (searchType as SearchType) || SearchType.TEXT,
        search || '',
        resultsCount,
        executionTimeMs,
      );
    }

    return buildPaginatedResponse(list, query);
  }

  safeJsonParse<T = any>(raw: string): T | null {
    try {
      // Remove code fences like ```json or ```
      const cleaned = raw
        .trim()
        .replace(/^```(?:json)?/, '') // remove starting ```json
        .replace(/```$/, '') // remove ending ```
        .trim();

      return JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      return null;
    }
  }

  @Post(':id/favorite')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async setFavorite(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const book = await this.bookService.getById(id);
    const user = await this.userService.getById(currentUser.sub);

    return await this.userService.addToFavorite(user, book);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async bookDetails(
    @Param('id') id: string,
    @Query() query: any,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const { limit = 5 } = query;

    const book = await this.bookService.getById(id);
    const preparedString = this.bookService.prepareVectorString(book);
    const embedding =
      await this.openAiService.generateEmbedding(preparedString);
    const similarBooks = await this.bookService.searchByVector(embedding, {
      similarityThreshold: 0.1,
      limit: limit + 1,
    });
    const isFavorite = await this.userService.isInFavoriteList(
      currentUser.sub,
      id,
    );

    // Add last seen - fire and forget
    void this.userService
      .addToLastSeen(currentUser.sub, book)
      .catch((e) => console.log(e));

    return {
      ...book,
      similarBooks: similarBooks.items
        .filter((b) => b.id !== book.id)
        .slice(0, limit),
      isFavorite: isFavorite ? true : false,
    };
  }

  @Post('update-missing-embedding/all')
  async updateAllMissingEmbeddings() {
    const message = await this.bookService.updateMissingEmbeddings();
    return { message };
  }

  @Post('update-missing-embedding/:id')
  async updateMissingEmbeddings(@Param('id') id: string) {
    return await this.bookService.updateEmbeddingsForBooks([
      ...id.split(',').map((x) => x.trim()),
    ]);
  }
}
