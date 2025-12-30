import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Publisher } from './entities/publisher.entity';
import { PublisherController } from './publisher.controller';
import { PublisherService } from './publisher.service';

@Module({
  imports: [TypeOrmModule.forFeature([Publisher])],
  providers: [PublisherService],
  controllers: [PublisherController],
})
export class PublisherModule {}
