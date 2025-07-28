import { QueryOptions } from 'src/common/interfaces/pagination.interface';
import { QsParsePipe } from 'src/common/pipes/qs-parse.pipe';

import { Controller, Get, Param, Query } from '@nestjs/common';

import { BookService } from './book.service';

@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get()
  async bookList(@Query(new QsParsePipe()) query: QueryOptions) {
    return { message: 'Not implemented yet!', query };
  }

  @Get(':id')
  async bookDetails(@Param('id') id: string) {
    return await this.bookService.getById(id);
  }
}
