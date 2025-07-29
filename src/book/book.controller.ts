import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

import { BookService } from './book.service';
import { BookQueryDto } from './dto/books-query.dto';

@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get()
  @ApiQuery({ type: BookQueryDto })
  async bookList(@Query() query: BookQueryDto) {
    return { message: 'Not implemented yet!', query };
  }

  @Get(':id')
  async bookDetails(@Param('id') id: string) {
    return await this.bookService.getById(id);
  }
}
