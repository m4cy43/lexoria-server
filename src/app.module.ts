import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { AuthorModule } from './author/author.module';
import { BookModule } from './book/book.module';
import { GenreModule } from './genre/genre.module';
import { ImportModule } from './import/import.module';
import { PostgresModule } from './postgres/postgres.module';
import { PublisherModule } from './publisher/publisher.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    PostgresModule,
    ConfigModule.forRoot({ isGlobal: true }),
    UserModule,
    AuthModule,
    BookModule,
    GenreModule,
    AuthorModule,
    PublisherModule,
    ImportModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
