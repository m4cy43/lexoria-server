import * as qs from 'qs';

import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class GlobalQueryPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'query') {
      return value;
    }

    if (typeof value === 'string') {
      const qsConfig = {
        allowDots: true,
        comma: true,
        parseArrays: true,
        allowEmptyArrays: true,
      };
      value = qs.parse(value, qsConfig);
      console.log(qs.stringify(value, qsConfig));
    }

    const pagination = value?.pagination;
    if (pagination) {
      const page = Number(pagination.page ?? 1);
      const limit = Number(pagination.limit ?? 10);
      pagination.page = page;
      pagination.limit = limit;
      pagination.skip = (page - 1) * limit;
    }

    console.log(value);

    return value;
  }
}
