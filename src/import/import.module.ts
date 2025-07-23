import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Author } from '../author/entities/author.entity';
import { Book } from '../book/entities/book.entity';
import { Category } from '../category/entities/category.entity';
import { Publisher } from '../publisher/entities/publisher.entity';
import { ImportService } from './import.service';

@Module({
  imports: [TypeOrmModule.forFeature([Book, Author, Publisher, Category])],
  providers: [ImportService],
})
export class ImportModule {}
