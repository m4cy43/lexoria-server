import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { WithLengthColumnType } from 'typeorm/driver/types/ColumnTypes';

import { ConfigService } from '@nestjs/config';

import { createPostgresDataSourceOptions } from './postgres.config';

config();

const configService = new ConfigService();

export const PostgresDataSource = new DataSource(
  createPostgresDataSourceOptions(configService),
);

PostgresDataSource.driver.supportedDataTypes.push(
  'vector' as WithLengthColumnType,
);
PostgresDataSource.driver.withLengthColumnTypes.push(
  'vector' as WithLengthColumnType,
);
