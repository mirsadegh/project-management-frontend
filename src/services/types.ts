// src/services/types.ts
export interface ApiErrorResponse {
  detail?: string;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

export interface ApiError {
  response?: {
    status: number;
    data?: ApiErrorResponse;
    statusText?: string;
  };
  message?: string;
}

export function getErrorMessage(error: ApiError | unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const apiErr = error as ApiError;
    const data = apiErr.response?.data;
    if (data?.detail) return data.detail;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
    if (apiErr.response?.statusText) return apiErr.response.statusText;
  }
  if (error instanceof Error) return error.message;
  return 'خطای ناشناخته رخ داد';
}

export function getErrorStatus(error: ApiError | unknown): number | null {
  if (error && typeof error === 'object' && 'response' in error) {
    return (error as ApiError).response?.status ?? null;
  }
  return null;
}