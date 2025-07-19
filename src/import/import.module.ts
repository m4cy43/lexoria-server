import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from '../book/entities/book.entity';
import { Author } from '../author/entities/author.entity';
import { Publisher } from '../publisher/entities/publisher.entity';
import { Genre } from '../genre/entities/genre.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Book, Author, Publisher, Genre])],
  providers: [ImportService],
})
export class ImportModule {}
