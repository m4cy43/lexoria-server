import { BaseQueryDto } from 'src/common/dto/query.dto';
import { SortDirection } from 'typeorm';

export interface BookSort extends Record<string, SortDirection> {
  title?: SortDirection;
  publishedAt?: SortDirection;
}

export interface BookFilters {
  title?: string;
  category?: string | string[];
}

export class BookQueryDto extends BaseQueryDto<BookSort, BookFilters> {}
