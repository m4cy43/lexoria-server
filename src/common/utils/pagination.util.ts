import {
  ItemsWithTotal,
  PaginatedResponse,
  QueryOptions,
} from '../interfaces/pagination.interface';

export function buildPaginatedResponse<T>(
  data: ItemsWithTotal<T>,
  meta: QueryOptions,
): PaginatedResponse<T> {
  const { items, total } = data;
  const { pagination, filters, sort } = meta;
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
      filterOptions: filters,
      hasNextPage,
      hasPrevPage,
    },
  };
}
