import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/query.dto';
import { SortDirection } from 'src/common/interfaces/query.interface';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class BookSort {
  @ApiPropertyOptional({ example: 'ASC' })
  @IsEnum(SortDirection)
  @IsOptional()
  title?: SortDirection;

  @ApiPropertyOptional({ example: 'DESC' })
  @IsEnum(SortDirection)
  @IsOptional()
  publishedDate?: SortDirection;

  @ApiPropertyOptional({ example: 'ASC' })
  @IsEnum(SortDirection)
  @IsOptional()
  categories?: SortDirection;

  @ApiPropertyOptional({ example: 'ASC' })
  @IsEnum(SortDirection)
  @IsOptional()
  authors?: SortDirection;

  @ApiPropertyOptional({ example: 'ASC' })
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
  @IsNumber()
  @Min(0)
  @Max(1)
  similarityThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  fuzzyThreshold?: number;
}
