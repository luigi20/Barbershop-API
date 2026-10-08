import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { AppError } from '@modules/utils/app_error';

@Catch(AppError)
export class ManagementAppErrorFilter implements ExceptionFilter<AppError> {
  catch(exception: AppError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(exception.statusCode).json({
      statusCode: exception.statusCode,
      message: exception.message,
    });
  }
}
