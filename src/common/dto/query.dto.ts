import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';

import { FilterOperator } from '../interfaces/pagination.interface';

export class PaginationDto {
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;
}

export class BaseQueryDto<
  TSort extends object = any,
  TFilters extends object = any,
> {
  @IsOptional()
  @IsObject()
  sort?: Partial<TSort>;

  @IsOptional()
  @IsObject()
  filters?: Partial<{
    [K in keyof TFilters]:
      | TFilters[K]
      | FilterOperator<TFilters[K]>
      | (TFilters[K] | FilterOperator<TFilters[K]>)[];
  }>;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination?: PaginationDto;
}
