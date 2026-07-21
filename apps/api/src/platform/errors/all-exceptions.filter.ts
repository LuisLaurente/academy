import {
  type ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
  type ExceptionFilter,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

interface CorrelatedRequest {
  readonly correlationId?: string;
  readonly url: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(@Inject(HttpAdapterHost) private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const context = host.switchToHttp();
    const request = context.getRequest<CorrelatedRequest>();
    const response = context.getResponse<unknown>();
    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = this.resolvePublicMessage(exception, statusCode);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error({
        correlationId: request.correlationId,
        error: exception instanceof Error ? exception.message : 'Unknown error',
        event: 'request.failed',
        path: request.url,
        statusCode,
      });
    }

    httpAdapter.reply(
      response,
      {
        correlationId: request.correlationId,
        message,
        path: request.url,
        statusCode,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }

  private resolvePublicMessage(exception: unknown, statusCode: number): string | string[] {
    if (!(exception instanceof HttpException)) {
      return 'Internal server error';
    }

    const body = exception.getResponse();

    if (typeof body === 'string') {
      return body;
    }

    if (typeof body === 'object' && body !== null && 'message' in body) {
      const message = body.message;

      if (typeof message === 'string' || this.isStringArray(message)) {
        return message;
      }
    }

    return HttpStatus[statusCode] ?? 'Request failed';
  }

  private isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
  }
}
