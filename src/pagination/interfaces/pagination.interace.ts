export type SortDirection = 'ASC' | 'DESC';

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  itemsInPage?: number;
  sortOptions?: Record<string, SortDirection>;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  skip?: number;
  sort?: Record<string, SortDirection>;
}

export interface PaginationQueries {
  page?: string;
  limit?: string;
  sort?: string;
}

export interface ItemsWithTotal<T> {
  items: T[];
  total: number;
}
