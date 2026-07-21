import {
  Injectable,
  Logger,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { finalize } from 'rxjs';

interface ObservedRequest {
  readonly correlationId?: string;
  readonly method: string;
  readonly url: string;
}

interface ObservedResponse {
  readonly statusCode: number;
}

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = performance.now();
    const http = context.switchToHttp();
    const request = http.getRequest<ObservedRequest>();
    const response = http.getResponse<ObservedResponse>();

    return next.handle().pipe(
      finalize(() => {
        this.logger.log({
          correlationId: request.correlationId,
          durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
          event: 'request.completed',
          method: request.method,
          path: request.url,
          statusCode: response.statusCode,
        });
      }),
    );
  }
}
