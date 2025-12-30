import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseQueryDto } from '../common/dto/query.dto';
import { buildPaginatedResponse } from '../common/utils/pagination.util';
import { PublisherService } from './publisher.service';

@ApiTags('publishers')
@Controller('publishers')
export class PublisherController {
  constructor(private readonly publisherService: PublisherService) {}

  @Get()
  @ApiOperation({ summary: 'Search publishers by name using regex' })
  async search(@Query() query: BaseQueryDto) {
    const list = await this.publisherService.searchByRegex(query);
    return buildPaginatedResponse(list, query);
  }
}
