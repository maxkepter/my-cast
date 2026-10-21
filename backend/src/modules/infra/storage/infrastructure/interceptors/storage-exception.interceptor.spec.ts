import { CallHandler, ExecutionContext, HttpStatus } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { StorageExceptionInterceptor } from './storage-exception.interceptor';
import {
  EnvStorageNodeReadOnlyException,
  InvalidStorageInputException,
  StorageModeReadOnlyException,
  StorageNodeHasDataException,
  StorageNodeIdExistsException,
  StorageNodeNotFoundException,
  StorageNodeUnreachableException,
} from '../../domain/exceptions';

describe('StorageExceptionInterceptor', () => {
  const interceptor = new StorageExceptionInterceptor();
  const context = {} as ExecutionContext;

  it('maps StorageNodeNotFoundException to 404 NOT_FOUND', async () => {
    const error = new StorageNodeNotFoundException('node-404');
    const next: CallHandler = {
      handle: () => throwError(() => error),
    };

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
      response: {
        code: 'STORAGE_NODE_NOT_FOUND',
        message: "Storage node 'node-404' was not found.",
      },
    });
  });

  it('maps StorageNodeIdExistsException to 409 CONFLICT', async () => {
    const error = new StorageNodeIdExistsException();
    const next: CallHandler = {
      handle: () => throwError(() => error),
    };

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).rejects.toMatchObject({
      status: HttpStatus.CONFLICT,
      response: {
        code: 'STORAGE_NODE_ID_EXISTS',
      },
    });
  });

  it('maps StorageModeReadOnlyException to 403 FORBIDDEN', async () => {
    const error = new StorageModeReadOnlyException();
    const next: CallHandler = {
      handle: () => throwError(() => error),
    };

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).rejects.toMatchObject({
      status: HttpStatus.FORBIDDEN,
      response: {
        code: 'STORAGE_MODE_READ_ONLY',
        message: 'DB storage nodes are read-only while STORAGE_MODE=env',
      },
    });
  });

  it('maps EnvStorageNodeReadOnlyException to 403 FORBIDDEN', async () => {
    const error = new EnvStorageNodeReadOnlyException();
    const next: CallHandler = {
      handle: () => throwError(() => error),
    };

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).rejects.toMatchObject({
      status: HttpStatus.FORBIDDEN,
      response: {
        code: 'ENV_STORAGE_NODE_READ_ONLY',
      },
    });
  });

  it('maps StorageNodeHasDataException to 409 CONFLICT', async () => {
    const error = new StorageNodeHasDataException();
    const next: CallHandler = {
      handle: () => throwError(() => error),
    };

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).rejects.toMatchObject({
      status: HttpStatus.CONFLICT,
      response: {
        code: 'STORAGE_NODE_HAS_DATA',
      },
    });
  });

  it('maps StorageNodeUnreachableException to 502 BAD_GATEWAY', async () => {
    const error = new StorageNodeUnreachableException();
    const next: CallHandler = {
      handle: () => throwError(() => error),
    };

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).rejects.toMatchObject({
      status: HttpStatus.BAD_GATEWAY,
      response: {
        code: 'STORAGE_NODE_UNREACHABLE',
      },
    });
  });

  it('maps InvalidStorageInputException to 400 BAD_REQUEST', async () => {
    const error = new InvalidStorageInputException('invalid field');
    const next: CallHandler = {
      handle: () => throwError(() => error),
    };

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
      response: {
        code: 'INVALID_STORAGE_INPUT',
        message: 'invalid field',
      },
    });
  });

  it('rethrows non-domain exceptions unchanged', async () => {
    const generic = new Error('Database connection failed');
    const next: CallHandler = {
      handle: () => throwError(() => generic),
    };

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).rejects.toBe(generic);
  });

  it('passes successful values through', async () => {
    const next: CallHandler = {
      handle: () => of({ ok: true }),
    };

    const res = await lastValueFrom(interceptor.intercept(context, next));
    expect(res).toEqual({ ok: true });
  });
});
