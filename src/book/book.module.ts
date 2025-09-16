import { LocalEmbeddingService } from 'src/embedding/embedding.service';
import { OpenAiService } from 'src/openai/openai.service';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BookController } from './book.controller';
import { BookService } from './book.service';
import { BookChunk } from './entities/book-chunk.entity';
import { Book } from './entities/book.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Book, BookChunk])],
  providers: [BookService, OpenAiService, LocalEmbeddingService],
  controllers: [BookController],
})
export class BookModule {}
