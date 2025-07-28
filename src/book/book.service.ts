import { Repository } from 'typeorm';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Book } from './entities/book.entity';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {}

  async getById(id: string): Promise<Book> {
    const book = await this.bookRepository.findOne({
      where: { id: id },
      relations: { authors: true, categories: true, publisher: true },
    });
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} have not found`);
    }

    return book;
  }
}
