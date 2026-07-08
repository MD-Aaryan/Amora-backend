import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    // Sanitize URL: remove query params that may contain sensitive data
    const sanitizedUrl = url.split('?')[0];

    return next.handle().pipe(
      tap(() => {
        const delay = Date.now() - now;
        this.logger.log(`${method} ${sanitizedUrl} ${delay}ms`);
      }),
    );
  }
}
