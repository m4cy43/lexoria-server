import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
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
  @ApiPropertyOptional({
    example: ['b2df5f27-21e3-4e3e-9a1a-beb97f8f8735'],
    description: 'Array of category UUIDs',
  })
  @IsArray()
  @IsOptional()
  categories?: string[];

  @ApiPropertyOptional({
    example: ['8f6b8a1a-9e26-4f6a-9f0b-9b7a8c34e7e0'],
    description: 'Array of author UUIDs',
  })
  @IsArray()
  @IsOptional()
  authors?: string[];

  @ApiPropertyOptional({
    example: ['6a7f2a7a-9c7e-4b0f-98d7-24b4b9d4a8f2'],
    description: 'Array of publisher UUIDs',
  })
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
  similarityThreshold?: number = 0.001;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  fuzzyThreshold?: number = 0.001;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  chunkLoadLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  totalChunksLimit?: number;
}
