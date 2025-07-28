export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export interface SortOptions {
  [field: string]: SortDirection;
}

export interface FilterOperator {
  eq?: any;
  ne?: any;
  gt?: any;
  gte?: any;
  lt?: any;
  lte?: any;
  like?: string;
  in?: any[];
  between?: [any, any];
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
