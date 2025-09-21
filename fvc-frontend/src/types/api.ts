// Base API response structure
export interface BaseResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Pagination response structure
export interface PaginationResponse<T = any> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// Error response structure
export interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  timestamp: string;
  path?: string;
}

// API request parameters
export interface RequestParams {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  [key: string]: any;
}

// HTTP methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// API endpoint configuration
export interface ApiEndpoint {
  url: string;
  method: HttpMethod;
  requiresAuth?: boolean;
}

// Axios request configuration
export interface ApiRequestConfig {
  endpoint: string;
  method?: HttpMethod;
  data?: any;
  params?: RequestParams;
  headers?: Record<string, string>;
  timeout?: number;
}
