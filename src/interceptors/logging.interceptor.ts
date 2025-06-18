import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    console.log(`[Request] ${method} ${url}`);
    if (request.body && Object.keys(request.body).length > 0) {
      console.log('[Request Body]', JSON.stringify(request.body));
    }

    return next.handle().pipe(
      tap((response) => {
        const responseTime = Date.now() - now;
        console.log(`[Response] ${method} ${url} ${responseTime}ms`);
        console.log('[Response Body]', JSON.stringify(response));
      }),
    );
  }
}
