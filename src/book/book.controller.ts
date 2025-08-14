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
import { Book } from './entities/book.entity';

@Controller('books')
export class BookController {
  constructor(
    private readonly openAiService: OpenAiService,
    private readonly bookService: BookService,
  ) {}

  @Get()
  async bookList(@Query() query: BookQueryDto) {
    let list: ItemsWithTotal<Book>;
    const { searchType, search } = query;
    if (searchType === 'vector') {
      const embedding = await this.openAiService.generateEmbedding(search);
      list = await this.bookService.searchByVector(embedding, query);
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

  @Post('update-missing-embedding/:id')
  async updateMissingEmbeddings(@Param('id') id: string) {
    return await this.bookService.updateMissingEmbeddingForBook(id);
  }
}
