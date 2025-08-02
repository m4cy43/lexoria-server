import {
  ItemsWithTotal,
  PaginatedResponse,
} from '../interfaces/pagination.interface';
import { QueryOptions } from '../interfaces/query.interface';

export function buildPaginatedResponse<T = any, S = any, F = any>(
  data: ItemsWithTotal<T>,
  meta: QueryOptions<S, F>,
): PaginatedResponse<T, S, F> {
  const { items, total } = data;
  const { pagination, filter, sort } = meta;
  const { page, limit } = pagination;

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  const itemsInPage = items.length;

  return {
    data: items,
    meta: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      itemsInPage,
      sortOptions: sort,
      filterOptions: filter,
      hasNextPage,
      hasPrevPage,
    },
  };
}
