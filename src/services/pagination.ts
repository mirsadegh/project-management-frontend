/** Helpers for DRF paginated list responses. */

export interface PaginatedResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  total_pages?: number;
  current_page?: number;
  results?: T[];
}

export function unwrapList<T>(data: T[] | PaginatedResponse<T> | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
}
