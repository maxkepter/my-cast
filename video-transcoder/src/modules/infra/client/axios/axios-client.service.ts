import { Readable } from 'node:stream';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  ClientService,
  RequestConfig,
} from '../application/client-service.interface';

@Injectable()
export class AxiosClientService implements ClientService {
  private readonly logger = new Logger(AxiosClientService.name);
  private readonly client: AxiosInstance;
  private readonly baseURL: string;
  private readonly storagePaths: string[];

  constructor(private readonly config: ConfigService) {
    this.baseURL = this.config.get<string>(
      'BACKEND_URL',
      'http://localhost:3000',
    );
    const prefix = this.config.get<string>(
      'BACKEND_STORAGE_PREFIX',
      '/api/v1/storage',
    );
    if (
      !prefix.startsWith('/') ||
      prefix.startsWith('//') ||
      /^\/+$/.test(prefix) ||
      /[?#\\]/.test(prefix)
    ) {
      throw new Error('Invalid BACKEND_STORAGE_PREFIX');
    }
    this.storagePaths = ['/api/v1/storage', prefix].map((path) =>
      new URL(this.resolveUrl(path)).pathname.replace(/\/+$/, ''),
    );
    const timeout = this.config.get<number>('BACKEND_TIMEOUT', 30000);
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.response.use(
      (res) => res,
      (err) => {
        this.logger.error('Backend call failed');
        return Promise.reject(err);
      },
    );
  }

  private resolveUrl(url: string): string {
    return /^([a-z][a-z\d+.-]*:)?\/\//i.test(url)
      ? url.startsWith('//')
        ? `${new URL(this.baseURL).protocol}${url}`
        : url
      : `${this.baseURL.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
  }

  private requestConfig(
    url: string,
    config?: RequestConfig,
    data?: unknown,
  ): AxiosRequestConfig | undefined {
    const target = new URL(this.resolveUrl(url));
    const backend = new URL(this.baseURL);
    const internal =
      target.origin === backend.origin &&
      this.storagePaths.some(
        (path) =>
          target.pathname === path || target.pathname.startsWith(`${path}/`),
      );
    const headers = { ...config?.headers };
    for (const name of Object.keys(headers)) {
      if (name.toLowerCase() === 'x-internal-service-key') delete headers[name];
    }
    let fallbackContentType = false;
    if (
      (Buffer.isBuffer(data) ||
        data instanceof Readable ||
        (typeof data === 'object' &&
          data !== null &&
          typeof (data as { pipe?: unknown }).pipe === 'function')) &&
      !Object.keys(headers).some(
        (name) => name.toLowerCase() === 'content-type',
      )
    ) {
      headers['content-type'] = 'application/octet-stream';
      fallbackContentType = true;
    }
    if (internal) {
      const secret = this.config.get<string>('INTERNAL_STORAGE_SHARED_SECRET');
      if (
        typeof secret !== 'string' ||
        !secret.trim() ||
        secret !== secret.trim() ||
        /[^\x21-\x7e]/.test(secret)
      ) {
        throw new Error('Invalid INTERNAL_STORAGE_SHARED_SECRET');
      }
      headers['x-internal-service-key'] = secret;
    }
    if (!internal && !config?.headers && !fallbackContentType) return config;
    return { ...config, headers, ...(internal ? { maxRedirects: 0 } : {}) };
  }

  async get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    const res = await this.client.get<T>(url, this.requestConfig(url, config));
    return res.data;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig,
  ): Promise<T> {
    const res = await this.client.post<T>(
      url,
      data,
      this.requestConfig(url, config, data),
    );
    return res.data;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig,
  ): Promise<T> {
    const res = await this.client.put<T>(
      url,
      data,
      this.requestConfig(url, config, data),
    );
    return res.data;
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig,
  ): Promise<T> {
    const res = await this.client.patch<T>(
      url,
      data,
      this.requestConfig(url, config, data),
    );
    return res.data;
  }

  async delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    const res = await this.client.delete<T>(
      url,
      this.requestConfig(url, config),
    );
    return res.data;
  }
}
