import { config } from 'dotenv';
import { DataSource } from 'typeorm';

import { ConfigService } from '@nestjs/config';

import { createPostgresDataSourceOptions } from './postgres.config';

config();

const configService = new ConfigService();

export const PostgresDataSource = new DataSource(
  createPostgresDataSourceOptions(configService),
);
