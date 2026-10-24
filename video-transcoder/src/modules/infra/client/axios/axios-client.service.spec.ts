import { describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AxiosClientService } from './axios-client.service';

vi.mock('axios');

describe('AxiosClientService', () => {
  const mockConfigService = {
    get: vi.fn((key: string, defaultValue?: any) => {
      if (key === 'BACKEND_URL') return 'http://test-backend:3000';
      if (key === 'BACKEND_TIMEOUT') return 5000;
      return defaultValue;
    }),
  } as unknown as ConfigService;

  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      response: { use: vi.fn() },
    },
  };

  vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as any);

  const service = new AxiosClientService(mockConfigService);

  it('should call get and return response data', async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({ data: { status: 'ok' } });

    const result = await service.get('/health');

    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health', undefined);
    expect(result).toEqual({ status: 'ok' });
  });

  it('should call post and return response data', async () => {
    mockAxiosInstance.post.mockResolvedValueOnce({ data: { id: 'job-1' } });

    const result = await service.post('/jobs', { videoId: '123' });

    expect(mockAxiosInstance.post).toHaveBeenCalledWith(
      '/jobs',
      { videoId: '123' },
      undefined,
    );
    expect(result).toEqual({ id: 'job-1' });
  });
});
