import { randomUUID } from 'node:crypto';

import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';

interface MutableRequest {
  correlationId?: string;
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
}

interface MutableResponse {
  setHeader(name: string, value: string): void;
}

@Injectable()
export class CorrelationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<MutableRequest>();
    const response = http.getResponse<MutableResponse>();
    const receivedHeader = request.headers['x-correlation-id'];
    const correlationId =
      typeof receivedHeader === 'string' && receivedHeader.trim().length > 0
        ? receivedHeader
        : randomUUID();

    request.correlationId = correlationId;
    response.setHeader('x-correlation-id', correlationId);

    return next.handle();
  }
}
