import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((response) => {
        if (res.headersSent) {
          return response;
        }

        if (response && typeof response === 'object' && 'message' in response) {
          return {
            statusCode: res.statusCode,
            success: true,
            message: response.message,
            meta: response.meta,
            data: response.data ?? null,
          };
        }

        return {
          statusCode: res.statusCode,
          success: true,
          message: 'Request successful',
          data: response,
        };
      }),
    );
  }
}
