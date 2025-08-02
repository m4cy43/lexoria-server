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

export interface QueryOptions<S = any, F = any> {
  page?: number;
  limit?: number;
  skip?: number;
  sort?: TSortOptions<S>;
  filter?: TFilterOptions<F>;
}

export type TSortOptions<T = any> = Partial<{
  [K in keyof T]: SortDirection;
}>;

export type TFilterOptions<T = any> = Partial<{
  [K in keyof T]: T[K] | FilterOperator<T[K]> | (T[K] | FilterOperator<T[K]>)[];
}>;

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}
