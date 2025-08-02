import { TFilterOptions, TSortOptions } from './query.interface';

export interface PaginationMeta<S = any, F = any> {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  itemsInPage?: number;
  sortOptions?: TSortOptions<S>;
  filterOptions?: TFilterOptions<F>;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface PaginatedResponse<T = any, S = any, F = any> {
  data: T[];
  meta: PaginationMeta<S, F>;
}

export interface ItemsWithTotal<T = any> {
  items: T[];
  total: number;
}
