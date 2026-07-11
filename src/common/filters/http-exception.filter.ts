import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: any = null;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object') {
        const respObj = exceptionResponse as any;
        message =
          typeof respObj.message === 'string'
            ? respObj.message
            : Array.isArray(respObj.message)
              ? respObj.message[0]
              : message;
        code = respObj.error?.code || respObj.code || code;
        // Only expose validation details, not internal errors
        if (Array.isArray(respObj.message)) {
          details = respObj.message;
        }
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }
    } else {
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
      message = 'Internal server error';
    }

    response.status(status).json({
      success: false,
      message,
      data: null,
      error: {
        code,
        details,
      },
    });
  }
}
