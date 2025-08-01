import { Controller, Get, Param, Query } from '@nestjs/common';

import { BookService } from './book.service';
import { BookQueryDto } from './dto/books-query.dto';

@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get()
  async bookList(@Query() query: BookQueryDto) {
    return { message: 'Not implemented yet!', query };
  }

  @Get(':id')
  async bookDetails(@Param('id') id: string) {
    return await this.bookService.getById(id);
  }
}
