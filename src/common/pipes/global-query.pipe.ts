import * as qs from 'qs';

import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class GlobalQueryPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'query') {
      return value;
    }

    console.log(value);

    if (typeof value === 'string') {
      value = qs.parse(value, {
        allowDots: true,
        comma: true,
        parseArrays: true,
      });
    }

    const pagination = value?.pagination;
    if (pagination) {
      const page = Number(pagination.page ?? 1);
      const limit = Number(pagination.limit ?? 10);
      pagination.skip = (page - 1) * limit;
    }

    console.log(value);

    return value;
  }
}
