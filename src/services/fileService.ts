import api from './api';
import type { AxiosProgressEvent } from 'axios';
import { unwrapList } from './pagination';

export interface FileUploader {
  id?: number;
  username: string;
  full_name?: string;
}

export interface Attachment {
  id: number;
  file?: string;
  file_url?: string | null;
  original_filename: string;
  file_size: number;
  file_size_mb?: number;
  file_type: string;
  file_extension?: string;
  is_image: boolean;
  image_width?: number | null;
  image_height?: number | null;
  thumbnail_url?: string | null;
  description?: string;
  uploaded_by: FileUploader;
  uploaded_at: string;
  download_count?: number;
}

export interface AttachmentFilters {
  content_type?: string;
  object_id?: number;
  my_uploads?: boolean;
  file_type?: 'images' | 'documents';
}

export interface FileStats {
  total_files: number;
  total_size_bytes: number;
  total_size_mb: number;
  images: number;
  documents: number;
}

export interface UploadOptions {
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
}

export const fileService = {
  async getAttachments(filters?: AttachmentFilters): Promise<Attachment[]> {
    const response = await api.get<Attachment[] | { results: Attachment[] }>('/files/attachments/', {
      params: {
        content_type: filters?.content_type,
        object_id: filters?.object_id,
        my_uploads: filters?.my_uploads ? 'true' : undefined,
        file_type: filters?.file_type,
      },
    });
    return unwrapList(response.data);
  },

  async getAttachment(fileId: number): Promise<Attachment> {
    const response = await api.get<Attachment>(`/files/attachments/${fileId}/`);
    return response.data;
  },

  async upload(
    file: File,
    contentType: string,
    objectId: number,
    description = '',
    options?: UploadOptions
  ): Promise<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    formData.append('content_type', contentType);
    formData.append('object_id', objectId.toString());

    const response = await api.post<Attachment>('/files/attachments/', formData, {
      onUploadProgress: options?.onUploadProgress,
    });
    return response.data;
  },

  async download(fileId: number): Promise<Blob> {
    const response = await api.get<Blob>(`/files/attachments/${fileId}/download/`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async downloadAndSave(fileId: number, filename: string): Promise<void> {
    const blob = await fileService.download(fileId);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  getPreviewUrl(fileId: number): string {
    // Security fix (C-1): PR-6 made the HttpOnly `ws_access` cookie the
    // source of truth. The browser attaches it automatically on same-origin
    // <img src> requests (Vite dev proxy in dev, reverse proxy in prod), so
    // the JWT must NOT be embedded in the URL — it leaks via Referer,
    // browser history, and intermediate proxy logs.
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') || 'http://localhost:8000';
    return `${baseUrl}/api/files/attachments/${fileId}/preview/`;
  },

  async deleteAttachment(fileId: number): Promise<void> {
    await api.delete(`/files/attachments/${fileId}/`);
  },

  async getStats(): Promise<FileStats> {
    const response = await api.get<FileStats>('/files/attachments/stats/');
    return response.data;
  },
};
