import { ItemsWithTotal } from 'src/common/interfaces/pagination.interface';
import { buildPaginatedResponse } from 'src/common/utils/pagination.util';
import { OpenAiService } from 'src/openai/openai.service';

import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { BookService } from './book.service';
import { BookQueryDto } from './dto/books-query.dto';

@Controller('books')
export class BookController {
  constructor(
    private readonly openAiService: OpenAiService,
    private readonly bookService: BookService,
  ) {}

  @Get()
  async bookList(@Query() query: BookQueryDto) {
    let list;
    const { searchType, search } = query;
    if (!query.search) {
      list = await this.bookService.searchByText(query);
    } else if (searchType === 'vector') {
      const embedding = await this.openAiService.generateEmbedding(search);
      list = await this.bookService.searchByVector(embedding, query);
    } else if (searchType === 'fuzzy') {
      list = await this.bookService.searchByFuzzy(search, query);
    } else if (searchType === 'hybrid') {
      const embedding = await this.openAiService.generateEmbedding(search);
      list = await this.bookService.searchByHybrid(embedding, search, query);
    } else if (searchType === 'rag') {
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
      console.log('LLM raw output:', llmRaw);

      let recommended: { id: string; reason: string }[] = [];
      try {
        recommended = JSON.parse(llmRaw);
      } catch (e) {
        console.error('Failed to parse LLM output:', llmRaw, e);
      }

      const recommendedBooks = recommended
        .map((r) => {
          const book = list.items.find((b) => b.id === r.id);
          return book
            ? { id: book.id, title: book.title, reason: r.reason }
            : null;
        })
        .filter(Boolean);

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
