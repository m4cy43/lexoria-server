import * as qs from 'qs';

import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class GlobalQueryPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'query') {
      return value;
    }

    if (typeof value === 'string') {
      const qsConfig: qs.IParseOptions<qs.BooleanOptional> & {
        decoder?: never | undefined;
      } = {
        allowDots: true,
        comma: true,
        parseArrays: true,
        allowEmptyArrays: true,
      };
      value = qs.parse(value, qsConfig);
    }

    if (typeof value === null) {
      const page = Number(value.page ?? 1);
      const limit = Number(value.limit ?? 10);

      value.page = page;
      value.limit = limit;
      value.skip = (page - 1) * limit;
    }

    return value;
  }
}
