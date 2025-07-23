import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createPostgresDataSourceOptions } from './postgres.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...createPostgresDataSourceOptions(configService),
        migrationsRun: false,
        logging: ['error', 'migration'],
      }),
    }),
  ],
})
export class PostgresModule {}
