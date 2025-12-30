import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseQueryDto } from '../common/dto/query.dto';
import { buildPaginatedResponse } from '../common/utils/pagination.util';
import { CategoryService } from './category.service';

@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Search categories by name using regex' })
  async search(@Query() query: BaseQueryDto) {
    const list = await this.categoryService.searchByRegex(query);
    return buildPaginatedResponse(list, query);
  }
}
