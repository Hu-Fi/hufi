import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import * as CaseConverter from '@/common/utils/case-converter';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();

    if (request.body) {
      request.body = this.transformRequestData(request.body);
    }

    if (request.query) {
      const transformedQuery = this.transformRequestData(request.query);
      /**
       * Starting from express v5 'req.query' is not writable property anymore
       * (https://expressjs.com/en/guide/migrating-5.html#req.query), so we have
       * to monkey patch it in order to transform it.
       */
      Object.defineProperty(request, 'query', {
        value: transformedQuery,
        configurable: true,
        enumerable: true,
        writable: true,
      });
    }

    if (request.params) {
      request.params = this.transformRequestData(request.params);
    }

    return next.handle().pipe(map((data) => this.transformResponseData(data)));
  }

  private transformRequestData(input: unknown): unknown {
    return CaseConverter.transformKeysFromSnakeToCamel(input);
  }

  private transformResponseData(input: unknown): unknown {
    if (input instanceof StreamableFile) {
      return input;
    }

    return CaseConverter.transformKeysFromCamelToSnake(input);
  }
}
