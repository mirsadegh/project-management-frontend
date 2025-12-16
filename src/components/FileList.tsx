import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Trash2 } from 'lucide-react';
// 1. سرویس api خود را وارد کنید
import api from '../services/api';

// 2. تعریف تایپ‌ها برای داده‌ها
interface UploadedBy {
  username: string;
}

interface FileItem {
  id: number;
  is_image: boolean;
  thumbnail_url?: string; // اختیاری، چون همه فایل‌ها عکس نیستند
  original_filename: string;
  file_size: number;
  uploaded_by: UploadedBy;
  uploaded_at: string; // معمولاً به فرمت ISO 8601 از سرور می‌آید
  description?: string; // اختیاری
  file_type: string; // مثلاً 'application/pdf'
}

// 3. تعریف تایپ برای props کامپوننت
interface FileListProps {
  contentType: string;
  objectId: number;
}

const FileList: React.FC<FileListProps> = ({ contentType, objectId }) => {
  // 4. تایپ کردن state ها
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchFiles();
  }, [contentType, objectId]);

  const fetchFiles = async (): Promise<void> => {
    try {
      // 5. استفاده از سرویس api و حذف URL و توکن سخت‌کد شده
      // استفاده از params برای تمیزتر شدن URL
      const response = await api.get<{ results: FileItem[] } | FileItem[]>('/files/attachments/', {
        params: {
          content_type: contentType,
          object_id: objectId,
        },
      });
      
      // بررسی اینکه آیا پاسخ paginated است یا خیر
      setFiles(Array.isArray(response.data) ? response.data : response.data.results || []);

    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId: number, filename: string): Promise<void> => {
    try {
      // استفاده از سرویس api برای دانلود
      const response = await api.get(`/files/attachments/${fileId}/download/`, {
        responseType: 'blob', // برای دانلود فایل ضروری است
      });

      // ایجاد لینک دانلود و کلیک روی آن
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // پاکسازی حافظه
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  const handlePreview = (fileId: number): void => {
    // برای پیش‌نمایش، توکن را به صورت query string ارسال می‌کنیم
    // این روش به بک‌اند شما بستگی دارد، اما یک روش رایج است
    const token = localStorage.getItem('accessToken');
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000';
    const url = `${baseUrl}/api/files/attachments/${fileId}/preview/?token=${token}`;
    window.open(url, '_blank');
  };

  const handleDelete = async (fileId: number): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      // استفاده از سرویس api برای حذف
      await api.delete(`/files/attachments/${fileId}/`);
      
      // به‌روزرسانی لیست پس از حذف موفق
      fetchFiles();
      alert('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading) {
    return <div>Loading files...</div>;
  }

  if (files.length === 0) {
    return <div>No files attached</div>;
  }

  return (
    <div className="file-list">
      <h3>Attachments ({files.length})</h3>
      
      <div className="files">
        {files.map((file) => (
          <div key={file.id} className="file-item">
            <div className="file-icon">
              {file.is_image && file.thumbnail_url ? (
                <img
                  src={file.thumbnail_url}
                  alt={file.original_filename}
                  style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                />
              ) : (
                <FileText size={40} />
              )}
            </div>
            
            <div className="file-info">
              <div className="file-name">{file.original_filename}</div>
              <div className="file-meta">
                <span>{formatFileSize(file.file_size)}</span>
                <span>•</span>
                <span>{file.uploaded_by.username}</span>
                <span>•</span>
                <span>{new Date(file.uploaded_at).toLocaleDateString()}</span>
              </div>
              {file.description && (
                <div className="file-description">{file.description}</div>
              )}
            </div>
            
            <div className="file-actions">
              <button
                onClick={() => handleDownload(file.id, file.original_filename)}
                title="Download"
              >
                <Download size={20} />
              </button>
              
              {(file.is_image || file.file_type === 'application/pdf') && (
                <button
                  onClick={() => handlePreview(file.id)}
                  title="Preview"
                >
                  <Eye size={20} />
                </button>
              )}
              
              <button
                onClick={() => handleDelete(file.id)}
                title="Delete"
                className="delete-btn"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;


