import { IsOptional, IsString } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/query.dto';
import { SortDirection } from 'typeorm';

export interface BookSort {
  title?: SortDirection;
  publishedDate?: SortDirection;
}

export interface BookFilters {
  categories?: string[];
  authors?: string[];
  publishers?: string | string[];
  publishedDateRange?: string[];
}

export class BookQueryDto extends BaseQueryDto<BookSort, BookFilters> {
  @IsString()
  @IsOptional()
  search?: string;
}
