import apiClient from '../config/axios';
import type { BaseResponse, RequestParams, ApiRequestConfig } from '../types/api';

// Generic API service class
class ApiService {
  // GET request
  async get<T>(endpoint: string, params?: RequestParams): Promise<BaseResponse<T>> {
    const response = await apiClient.get<BaseResponse<T>>(endpoint, { params });
    return response.data;
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await apiClient.post<T>(endpoint, data);
    return response.data;
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<BaseResponse<T>> {
    const response = await apiClient.put<BaseResponse<T>>(endpoint, data);
    return response.data;
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<BaseResponse<T>> {
    const response = await apiClient.patch<BaseResponse<T>>(endpoint, data);
    return response.data;
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<BaseResponse<T>> {
    const response = await apiClient.delete<BaseResponse<T>>(endpoint);
    return response.data;
  }

  // Generic request method
  async request<T>(config: ApiRequestConfig): Promise<BaseResponse<T>> {
    const response = await apiClient.request<BaseResponse<T>>({
      url: config.endpoint,
      method: config.method || 'GET',
      data: config.data,
      params: config.params,
      headers: config.headers,
      timeout: config.timeout,
    });
    return response.data;
  }

  // Upload file
  async uploadFile<T>(endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<BaseResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<BaseResponse<T>>(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  // Download file
  async downloadFile(endpoint: string, filename?: string): Promise<void> {
    const response = await apiClient.get(endpoint, {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || 'download');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;
