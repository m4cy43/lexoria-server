import { DataSource } from 'typeorm';
import { WithLengthColumnType } from 'typeorm/driver/types/ColumnTypes';

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
      dataSourceFactory: async (options) => {
        const dataSource = new DataSource(options);

        dataSource.driver.supportedDataTypes.push(
          'vector' as WithLengthColumnType,
        );
        dataSource.driver.withLengthColumnTypes.push(
          'vector' as WithLengthColumnType,
        );

        await dataSource.initialize();

        return dataSource;
      },
    }),
  ],
})
export class PostgresModule {}
