import { LocalEmbeddingService } from 'src/embedding/embedding.service';
import { OpenAiService } from 'src/openai/openai.service';
import { Favorite } from 'src/user/entities/favorite.entity';
import { SearchLog } from 'src/user/entities/search-log.entity';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BookController } from './book.controller';
import { BookService } from './book.service';
import { BookChunk } from './entities/book-chunk.entity';
import { Book } from './entities/book.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book, BookChunk, User, SearchLog, Favorite]),
  ],
  providers: [BookService, OpenAiService, LocalEmbeddingService, UserService],
  controllers: [BookController],
})
export class BookModule {}
