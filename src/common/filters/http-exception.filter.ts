import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException
      ? exception.getResponse()
      : null;

    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: any = null;

    if (exceptionResponse && typeof exceptionResponse === 'object') {
      const respObj = exceptionResponse as any;
      message = typeof respObj.message === 'string' ? respObj.message : (Array.isArray(respObj.message) ? respObj.message[0] : message);
      code = respObj.error?.code || respObj.code || code;
      details = respObj.error?.details || respObj.details || (Array.isArray(respObj.message) ? respObj.message : null);
    } else if (exception instanceof Error) {
      message = exception.message;
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
