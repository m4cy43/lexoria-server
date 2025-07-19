import { Module } from '@nestjs/common';
import { PostgresModule } from './postgres/postgres.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { BookModule } from './book/book.module';
import { GenreModule } from './genre/genre.module';
import { AuthorModule } from './author/author.module';
import { PublisherModule } from './publisher/publisher.module';
import { ImportModule } from './import/import.module';

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
