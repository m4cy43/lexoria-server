import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import {
  PaginationOptions,
  SortDirection,
} from './interfaces/pagination.interace';

@Injectable()
export class PaginationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): PaginationOptions {
    const rawPage = value.page ?? '1';
    const rawLimit = value.limit ?? '10';

    const page = parseInt(rawPage, 10);
    const limit = parseInt(rawLimit, 10);

    if (isNaN(page) || page < 1) {
      throw new BadRequestException(`"page" must be a positive integer`);
    }

    if (isNaN(limit) || limit < 1) {
      throw new BadRequestException(`"limit" must be a positive integer`);
    }

    const skip = (page - 1) * limit;

    let sort: PaginationOptions['sort'];
    if (value.sort) {
      sort = {};
      const parts = value.sort.split(',');

      for (const part of parts) {
        const [field, dirRaw] = part.trim().split(':');
        const direction = dirRaw?.toUpperCase() as SortDirection;

        if (!field || !['ASC', 'DESC'].includes(direction)) {
          throw new BadRequestException(
            `"sort" must be a comma-separated list like "name:ASC,createdAt:DESC"`,
          );
        }

        sort[field] = direction;
      }
    }

    return { page, limit, skip, ...(sort ? { sort } : {}) };
  }
}
