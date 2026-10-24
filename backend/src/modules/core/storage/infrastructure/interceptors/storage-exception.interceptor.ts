import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import {
  StorageDomainException,
  StorageNodeHasDataException,
  StorageNodeIdExistsException,
  StorageNodeNotFoundException,
  StorageNodeUnreachableException,
  InvalidStorageInputException,
} from '../../domain/exceptions';

@Injectable()
export class StorageExceptionInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      catchError((error: unknown) => {
        if (!(error instanceof StorageDomainException)) {
          return throwError(() => error);
        }

        const { status, code } = this.mapExceptionToStatusAndCode(error);
        const details = error.details;

        return throwError(
          () =>
            new HttpException(
              {
                code,
                message: error.message,
                ...(details !== undefined ? { details } : {}),
              },
              status,
            ),
        );
      }),
    );
  }

  private mapExceptionToStatusAndCode(error: StorageDomainException): {
    status: number;
    code: string;
  } {
    if (error instanceof StorageNodeNotFoundException) {
      return {
        status: HttpStatus.NOT_FOUND,
        code: error.code || 'STORAGE_NODE_NOT_FOUND',
      };
    }
    if (error instanceof StorageNodeIdExistsException) {
      return {
        status: HttpStatus.CONFLICT,
        code: error.code || 'STORAGE_NODE_ID_EXISTS',
      };
    }
    if (error instanceof StorageNodeHasDataException) {
      return {
        status: HttpStatus.CONFLICT,
        code: error.code || 'STORAGE_NODE_HAS_DATA',
      };
    }
    if (error instanceof StorageNodeUnreachableException) {
      return {
        status: HttpStatus.BAD_GATEWAY,
        code: error.code || 'STORAGE_NODE_UNREACHABLE',
      };
    }
    if (error instanceof InvalidStorageInputException) {
      return {
        status: HttpStatus.BAD_REQUEST,
        code: error.code || 'INVALID_STORAGE_INPUT',
      };
    }

    return {
      status: HttpStatus.BAD_REQUEST,
      code: error.code,
    };
  }
}
