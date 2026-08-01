import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiError } from '../errors/api-error';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    const errorSources: any[] = [];

    if (exception instanceof ApiError) {
      statusCode = exception.statusCode;
      message = exception.message;

      errorSources.push({
        type: 'ApiError',
        details: exception.message,
      });
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse() as any;

      let extractedMessage: string;

      if (Array.isArray(res?.message)) {
        extractedMessage = res.message.join(', ');
      } else {
        extractedMessage = res?.message || exception.message;
      }

      message = extractedMessage;

      errorSources.push({
        type: 'HttpException',
        details: extractedMessage,
      });
    } else if (exception instanceof Error) {
      message = exception.message;

      errorSources.push({
        type: 'UnknownError',
        details: exception.message,
      });
    }

    response.status(statusCode).json({
      success: false,
      message,
      errorSources,
      err: {
        statusCode,
      },
      stack:
        process.env.NODE_ENV === 'production'
          ? null
          : exception instanceof Error
            ? exception.stack
            : null,
    });
  }
}
