import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseShape<T> {
  success: boolean;
  message: string;
  data: T;
  error: any;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseShape<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseShape<T>> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data;
        }
        return {
          success: true,
          message: 'Operation completed successfully',
          data: data || null,
          error: null,
        };
      }),
    );
  }
}
