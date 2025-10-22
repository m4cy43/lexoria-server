import { BookService } from 'src/book/book.service';
import { BookChunk } from 'src/book/entities/book-chunk.entity';
import { LocalEmbeddingService } from 'src/embedding/embedding.service';
import { OpenAiService } from 'src/openai/openai.service';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Author } from '../author/entities/author.entity';
import { Book } from '../book/entities/book.entity';
import { Category } from '../category/entities/category.entity';
import { Publisher } from '../publisher/entities/publisher.entity';
import { SearchLog } from '../user/entities/search-log.entity';
import { ImportService } from './import.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Book,
      Author,
      Publisher,
      Category,
      BookChunk,
      SearchLog,
    ]),
  ],
  providers: [ImportService, BookService, LocalEmbeddingService, OpenAiService],
})
export class ImportModule {}
