import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';

import { TFilterOptions, TSortOptions } from '../interfaces/query.interface';

export class PaginationDto {
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;

  @Type(() => Number)
  @IsOptional()
  skip?: number;
}

export class BaseQueryDto<
  TSort extends object = any,
  TFilters extends object = any,
> {
  @IsOptional()
  @IsObject()
  sort?: TSortOptions<TSort>;

  @IsOptional()
  @IsObject()
  filters?: TFilterOptions<TFilters>;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination?: PaginationDto;
}
