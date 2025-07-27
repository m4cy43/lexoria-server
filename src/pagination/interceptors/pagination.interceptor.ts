import { Observable, map } from 'rxjs';

import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import {
  ItemsWithTotal,
  PaginatedResponse,
  PaginationOptions,
} from './interfaces/pagination.interace';

@Injectable()
export class PaginationInterceptor<T> implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<PaginatedResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const pagination: PaginationOptions | undefined = request.pagination;

    if (!pagination) {
      throw new BadRequestException('Pagination options not found in request');
    }

    return next
      .handle()
      .pipe(
        map((data: ItemsWithTotal<T>) =>
          this.buildPaginatedResponse(data, pagination),
        ),
      );
  }

  private buildPaginatedResponse<T>(
    data: ItemsWithTotal<T>,
    meta: PaginationOptions,
  ): PaginatedResponse<T> {
    const { items, total } = data;
    const { page, limit, sort } = meta;

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
        hasNextPage,
        hasPrevPage,
      },
    };
  }
}
