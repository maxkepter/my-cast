import { createServer, IncomingMessage, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { Readable } from 'node:stream';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosClientService } from './axios-client.service';

function client(values: Record<string, unknown>): AxiosClientService {
  return new AxiosClientService({
    get: (key: string, fallback?: unknown) => values[key] ?? fallback,
  } as ConfigService);
}

async function listen(
  handler: (
    req: IncomingMessage,
    res: import('node:http').ServerResponse,
  ) => void,
): Promise<Server> {
  const server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return server;
}

function origin(server: Server): string {
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

describe('AxiosClientService', () => {
  const servers: Server[] = [];
  afterEach(async () => {
    await Promise.all(
      servers
        .splice(0)
        .map(
          (server) =>
            new Promise<void>((resolve, reject) =>
              server.close((err) => (err ? reject(err) : resolve())),
            ),
        ),
    );
    vi.restoreAllMocks();
  });

  it('fails closed for absent or malformed secret without sending request', async () => {
    const handler = vi.fn();
    const server = await listen(handler);
    servers.push(server);
    for (const secret of [undefined, '', '  ', 'bad\nvalue', ' bad', 123]) {
      const service = client({
        BACKEND_URL: origin(server),
        INTERNAL_STORAGE_SHARED_SECRET: secret,
      });
      await expect(
        service.get('/api/v1/storage/key/presigned-download'),
      ).rejects.toThrow('Invalid INTERNAL_STORAGE_SHARED_SECRET');
    }
    expect(handler).not.toHaveBeenCalled();
  });

  it('sends secret only to backend storage and preserves upload headers and body', async () => {
    const requests: {
      url?: string;
      headers: IncomingMessage['headers'];
      body: string;
    }[] = [];
    const server = await listen((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        requests.push({
          url: req.url,
          headers: req.headers,
          body: Buffer.concat(chunks).toString(),
        });
        res.setHeader('content-type', 'application/json');
        res.end('{"ok":true}');
      });
    });
    servers.push(server);
    const service = client({
      BACKEND_URL: origin(server),
      BACKEND_STORAGE_PREFIX: '/custom/storage',
      INTERNAL_STORAGE_SHARED_SECRET: 'fixture-key',
    });
    await service.post('/custom/storage/upload', Readable.from(['abc']), {
      headers: {
        'x-storage-key': 'video/file',
        'content-length': '3',
        'x-custom': 'yes',
      },
    });
    await service.post('/api/v1/storage/upload', Buffer.from('xy'), {
      headers: { 'Content-Type': 'video/mp4', 'x-storage-key': 'key' },
    });
    await service.post('/api/v1/storage/upload', Buffer.from('raw'), {
      headers: { 'x-storage-key': 'raw-key' },
    });
    await service.get('/custom/storage-other?signature=private');
    await service.get(`${origin(server)}/presigned?signature=private`, {
      headers: {
        'X-Internal-Service-Key': 'should-not-send',
        'x-custom': 'yes',
      },
    });
    expect(requests[0]).toMatchObject({
      body: 'abc',
      headers: {
        'x-internal-service-key': 'fixture-key',
        'x-storage-key': 'video/file',
        'content-type': 'application/octet-stream',
        'content-length': '3',
        'x-custom': 'yes',
      },
    });
    expect(requests[1]).toMatchObject({
      body: 'xy',
      headers: {
        'content-type': 'video/mp4',
        'x-internal-service-key': 'fixture-key',
      },
    });
    expect(requests[2]).toMatchObject({
      body: 'raw',
      headers: {
        'content-type': 'application/octet-stream',
        'x-storage-key': 'raw-key',
        'x-internal-service-key': 'fixture-key',
      },
    });
    expect(requests[3].headers['x-internal-service-key']).toBeUndefined();
    expect(requests[4].headers['x-internal-service-key']).toBeUndefined();
    expect(requests[4].headers['x-custom']).toBe('yes');
  });

  it('never forwards secret on redirect, protocol-relative URL, traversal, or another origin and does not log URLs or errors', async () => {
    const received = vi.fn();
    const other = await listen((req, res) => {
      received(req.headers);
      res.end('ok');
    });
    const backend = await listen((req, res) => {
      if (req.url === '/other') {
        received(req.headers);
        res.end('ok');
        return;
      }
      res.writeHead(302, {
        location: `${origin(other)}/presigned?signature=private`,
      });
      res.end();
    });
    servers.push(backend, other);
    const log = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    const service = client({
      BACKEND_URL: origin(backend),
      INTERNAL_STORAGE_SHARED_SECRET: 'fixture-key',
    });
    await expect(
      service.get('/api/v1/storage/key/presigned-download?signature=private'),
    ).rejects.toThrow();
    expect(received).not.toHaveBeenCalled();
    await service.get(
      `${origin(other)}/api/v1/storage/upload?signature=private`,
    );
    await expect(
      service.get(
        `//127.0.0.1:${(other.address() as AddressInfo).port}/api/v1/storage/upload`,
      ),
    ).rejects.toThrow();
    await service.get('/api/v1/storage/../other');
    expect(received).toHaveBeenCalledTimes(2);
    for (const call of received.mock.calls) {
      expect(call[0]['x-internal-service-key']).toBeUndefined();
    }
    expect(JSON.stringify(log.mock.calls)).not.toContain('private');
    expect(JSON.stringify(log.mock.calls)).not.toContain('fixture-key');
  });
});
