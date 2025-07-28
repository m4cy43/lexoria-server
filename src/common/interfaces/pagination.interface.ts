import { SortDirection } from 'typeorm';

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export interface SortOptions {
  [field: string]: SortDirection;
}

export interface FilterOperator<T = any> {
  eq?: T;
  ne?: T;
  gt?: T;
  gte?: T;
  lt?: T;
  lte?: T;
  like?: string;
  in?: T[];
  between?: [T, T];
}

export interface FilterOptions {
  [field: string]: FilterOperator | any;
}

export interface QueryOptions {
  pagination?: PaginationOptions;
  sort?: SortOptions;
  filters?: FilterOptions;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  itemsInPage?: number;
  sortOptions?: SortOptions;
  filterOptions?: FilterOptions;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ItemsWithTotal<T> {
  items: T[];
  total: number;
}
