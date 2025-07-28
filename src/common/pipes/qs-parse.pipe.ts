import * as qs from 'qs';

import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class QsParsePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'string') {
      return qs.parse(value, {
        allowDots: true,
        comma: true,
      });
    }
    return value;
  }
}
