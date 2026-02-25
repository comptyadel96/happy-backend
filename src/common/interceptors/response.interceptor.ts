import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path?: string;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;

    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse<Response>();
        const statusCode = response.statusCode || 200;

        return {
          statusCode,
          message:
            data?.message || this.getDefaultMessage(statusCode, method, url),
          data: data?.data || data,
          timestamp: new Date().toISOString(),
          path: url,
        } as ApiResponse<any>;
      }),
    );
  }

  private getDefaultMessage(
    statusCode: number,
    method: string,
    url: string,
  ): string {
    const status = {
      200: 'Success',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error',
    };

    return status[statusCode] || 'OK';
  }
}
