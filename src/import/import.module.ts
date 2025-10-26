import { BookService } from 'src/book/book.service';
import { BookChunk } from 'src/book/entities/book-chunk.entity';
import { LocalEmbeddingService } from 'src/embedding/embedding.service';
import { OpenAiService } from 'src/openai/openai.service';
import { Favorite } from 'src/user/entities/favorite.entity';
import { LastSeen } from 'src/user/entities/lastseen.entity';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';

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
      Favorite,
      LastSeen,
      User,
    ]),
  ],
  providers: [
    ImportService,
    BookService,
    LocalEmbeddingService,
    OpenAiService,
    UserService,
  ],
})
export class ImportModule {}
