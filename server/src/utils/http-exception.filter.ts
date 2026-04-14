import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { EntityNotFoundError } from 'typeorm';
import { TypeORMError } from 'typeorm/error/TypeORMError';

import { BaseError } from './base-error';

@Catch()
export class HttpExceptionFilter extends BaseExceptionFilter implements ExceptionFilter {
  public catch(exception: Error, host: ArgumentsHost): void {
    let error: Error = new InternalServerErrorException();

    if (exception instanceof BaseError) {
      console.log(exception.serialize());
    } else {
      console.log(JSON.stringify({ message: exception.message, stack: exception.stack }));
    }

    if (exception instanceof HttpException) {
      error = exception;
    } else if (exception instanceof TypeORMError) {
      if (exception instanceof EntityNotFoundError) {
        error = new NotFoundException(exception.message);
      } else {
        error = new BadRequestException(exception.message);
      }
    } else if (exception instanceof BaseError) {
      error = new BadRequestException(exception.message);
    }

    return super.catch(error, host);
  }
}
