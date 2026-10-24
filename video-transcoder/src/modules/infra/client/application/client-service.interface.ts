export const CLIENT_SERVICE = Symbol('CLIENT_SERVICE');

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
}

export interface ClientService {
  get<T = any>(url: string, config?: RequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: RequestConfig): Promise<T>;
}
