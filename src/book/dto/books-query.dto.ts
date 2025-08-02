import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { BaseQueryDto, PaginationDto } from 'src/common/dto/query.dto';
import { SortDirection } from 'src/common/interfaces/query.interface';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class BookSort {
  @ApiPropertyOptional({ example: 'asc' })
  @IsEnum(SortDirection)
  @IsOptional()
  title?: SortDirection;

  @ApiPropertyOptional({ example: 'asc' })
  @IsEnum(SortDirection)
  @IsOptional()
  publishedDate?: SortDirection;

  @ApiPropertyOptional({ example: 'asc' })
  @IsEnum(SortDirection)
  @IsOptional()
  categories?: SortDirection;

  @ApiPropertyOptional({ example: 'asc' })
  @IsEnum(SortDirection)
  @IsOptional()
  authors?: SortDirection;

  @ApiPropertyOptional({ example: 'asc' })
  @IsEnum(SortDirection)
  @IsOptional()
  publishers?: SortDirection;
}

export class BookFilters {
  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  categories?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  authors?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  publishers?: string[];

  @ApiPropertyOptional({ example: ['2000-01-01', '2000-11-30'] })
  @IsArray()
  @ArrayMaxSize(2)
  @IsOptional()
  publishedDateRange?: Date[];
}

export class BookQueryDto extends BaseQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => BookSort)
  sort?: BookSort;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => BookFilters)
  filter?: BookFilters;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination?: PaginationDto;
}
