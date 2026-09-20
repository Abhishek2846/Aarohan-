import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  status: string;
  data: T;
  statusCode: number;
  message: string;
  count?: number;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, any>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // If data is already enveloped with status, preserve and ensure data compatibility
        if (data && typeof data === 'object' && 'status' in data) {
          if (!('data' in data)) {
            return {
              ...data,
              data: data,
            };
          }
          return data;
        }

        const isArray = Array.isArray(data);
        return {
          status: 'SUCCESS',
          statusCode: context.switchToHttp().getResponse().statusCode,
          message: 'Success',
          count: isArray ? data.length : (data?.count !== undefined ? data.count : undefined),
          data: data,
        };
      }),
    );
  }
}
