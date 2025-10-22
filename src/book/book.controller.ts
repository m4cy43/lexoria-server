import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { ItemsWithTotal } from 'src/common/interfaces/pagination.interface';
import { buildPaginatedResponse } from 'src/common/utils/pagination.util';
import { OpenAiService } from 'src/openai/openai.service';
import { SearchType } from 'src/user/entities/search-log.entity';
import { User } from 'src/user/entities/user.entity';

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
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async bookList(
    @Query() query: BookQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    console.log(user.sub, query);

    const { searchType, search } = query;
    const startTime = Date.now();
    let list;

    if (!query.search) {
      list = await this.bookService.searchByText(query);
    } else if (searchType === SearchType.VECTOR) {
      const embedding = await this.openAiService.generateEmbedding(search);
      list = await this.bookService.searchByVector(embedding, query);
    } else if (searchType === SearchType.FUZZY) {
      list = await this.bookService.searchByFuzzy(search, query);
    } else if (searchType === SearchType.HYBRID) {
      const embedding = await this.openAiService.generateEmbedding(search);
      list = await this.bookService.searchByHybrid(embedding, search, query);
    } else if (searchType === SearchType.RAG) {
      const embedding = await this.openAiService.generateEmbedding(search);

      query.chunkLoadLimit ??= 3;
      query.similarityThreshold ??= 0.35;
      query.limit = undefined;
      query.skip = undefined;

      list = await this.bookService.searchByVector(embedding, query);

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

Now recommend books to the user.
Remember: output only JSON, example:
[
  { "id": "book-uuid-123", "reason": "Why this fits" },
  { "id": "book-uuid-456", "reason": "Why this fits" }
]`;

      const llmRaw = await this.openAiService.askLLM(systemPrompt, userPrompt);

      let recommended: Array<Book & { reason: string }> = [];
      try {
        recommended = JSON.parse(llmRaw);
      } catch (e) {
        console.error('Failed to parse LLM output:', llmRaw, e);
      }

      const recommendedBooks = recommended
        .map((r) => {
          const book = list.items.find((b) => b.id === r.id);
          return book ? { ...book, reason: r.reason } : null;
        })
        .filter(Boolean);

      const executionTimeMs = Date.now() - startTime;
      const resultsCount = list.items?.length ?? 0;

      // await this.bookService.logSearch(
      //   user.sub,
      //   (searchType as SearchType) || SearchType.TEXT,
      //   search || '',
      //   resultsCount,
      //   executionTimeMs,
      // );

      console.log(
        user.sub,
        (searchType as SearchType) || SearchType.TEXT,
        search || '',
        resultsCount,
        executionTimeMs,
      );

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
    const resultsCount = list.items?.length ?? 0;

    // await this.bookService.logSearch(
    //   user.sub,
    //   (searchType as SearchType) || SearchType.TEXT,
    //   search || '',
    //   resultsCount,
    //   executionTimeMs,
    // );

    console.log(
      user.sub,
      (searchType as SearchType) || SearchType.TEXT,
      search || '',
      resultsCount,
      executionTimeMs,
    );

    return buildPaginatedResponse(list, query);
  }

  @Get(':id')
  async bookDetails(@Param('id') id: string) {
    return await this.bookService.getById(id);
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
