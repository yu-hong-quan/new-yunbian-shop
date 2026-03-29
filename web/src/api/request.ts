import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

interface CacheItem {
  data: any;
  timestamp: number;
}

const request: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

const cache = new Map<string, CacheItem>();
const DEFAULT_CACHE_TIME = 5 * 60 * 1000;

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cloud_shop_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

request.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cloud_shop_token');
      localStorage.removeItem('cloud_shop_user');
    }
    return Promise.reject(error);
  }
);

export function getCache<T>(key: string): T | null {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < DEFAULT_CACHE_TIME) {
    return item.data as T;
  }
  cache.delete(key);
  return null;
}

export function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function clearCache(): void {
  cache.clear();
}

export async function requestWithCache<T = any>(
  config: AxiosRequestConfig,
  cacheKey?: string,
  cacheTime = DEFAULT_CACHE_TIME
): Promise<T> {
  if (cacheKey) {
    const cached = getCache<T>(cacheKey);
    if (cached) return cached;
  }

  const response = await request(config);
  if (cacheKey) {
    cache.set(cacheKey, { data: response, timestamp: Date.now() });
  }
  return response;
}

export default request;
