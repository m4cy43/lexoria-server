import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Author } from '../author/entities/author.entity';
import { Book } from '../book/entities/book.entity';
import { Genre } from '../genre/entities/genre.entity';
import { Publisher } from '../publisher/entities/publisher.entity';
import { ImportService } from './import.service';

@Module({
  imports: [TypeOrmModule.forFeature([Book, Author, Publisher, Genre])],
  providers: [ImportService],
})
export class ImportModule {}
