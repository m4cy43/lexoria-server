import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseQueryDto } from '../common/dto/query.dto';
import { buildPaginatedResponse } from '../common/utils/pagination.util';
import { AuthorService } from './author.service';

@ApiTags('authors')
@Controller('authors')
export class AuthorController {
  constructor(private readonly authorService: AuthorService) {}

  @Get()
  @ApiOperation({ summary: 'Search authors by name using regex' })
  async search(@Query() query: BaseQueryDto) {
    const list = await this.authorService.searchByRegex(query);
    return buildPaginatedResponse(list, query);
  }
}
