import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  ClientService,
  RequestConfig,
} from '../application/client-service.interface';

@Injectable()
export class AxiosClientService implements ClientService {
  private readonly logger = new Logger(AxiosClientService.name);
  private readonly client: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    const baseURL = this.config.get<string>(
      'BACKEND_URL',
      'http://localhost:3000',
    );
    const timeout = this.config.get<number>('BACKEND_TIMEOUT', 30000);

    // ponytail: basic axios instance, upgrade to retry interceptor/circuit breaker when network is flaky
    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (res) => res,
      (err) => {
        this.logger.error(
          `Backend call failed: ${err.config?.method?.toUpperCase()} ${err.config?.url} - ${err.message}`,
        );
        return Promise.reject(err);
      },
    );
  }

  async get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    const res = await this.client.get<T>(url, config);
    return res.data;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig,
  ): Promise<T> {
    const res = await this.client.post<T>(url, data, config);
    return res.data;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig,
  ): Promise<T> {
    const res = await this.client.put<T>(url, data, config);
    return res.data;
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig,
  ): Promise<T> {
    const res = await this.client.patch<T>(url, data, config);
    return res.data;
  }

  async delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    const res = await this.client.delete<T>(url, config);
    return res.data;
  }
}
