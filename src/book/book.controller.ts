import { buildPaginatedResponse } from 'src/common/utils/pagination.util';

import { Controller, Get, Param, Query } from '@nestjs/common';

import { BookService } from './book.service';
import { BookQueryDto } from './dto/books-query.dto';

@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get()
  async bookList(@Query() query: BookQueryDto) {
    const list = await this.bookService.getList(query);
    return buildPaginatedResponse(list, query);
  }

  @Get(':id')
  async bookDetails(@Param('id') id: string) {
    return await this.bookService.getById(id);
  }
}
