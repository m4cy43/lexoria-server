import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AuthModule } from './auth/auth.module';
import { AuthorModule } from './author/author.module';
import { BookModule } from './book/book.module';
import { CategoryModule } from './category/category.module';
import { ImportModule } from './import/import.module';
import { PostgresModule } from './postgres/postgres.module';
import { PublisherModule } from './publisher/publisher.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    PostgresModule,
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      global: true,
    }),
    UserModule,
    AuthModule,
    BookModule,
    CategoryModule,
    AuthorModule,
    PublisherModule,
    ImportModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
