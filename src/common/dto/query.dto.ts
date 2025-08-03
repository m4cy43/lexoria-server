import { Type } from 'class-transformer';
import { IsOptional, IsString, Max, Min } from 'class-validator';

import { IntersectionType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @Type(() => Number)
  @IsOptional()
  @Max(100)
  limit?: number = 10;

  @Type(() => Number)
  @IsOptional()
  skip?: number = 0;
}

export class SearchQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class BaseQueryDto extends IntersectionType(
  PaginationDto,
  SearchQueryDto,
) {}
