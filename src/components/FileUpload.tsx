import React, { useState, ChangeEvent } from 'react';
import axios, { AxiosProgressEvent } from 'axios';
// 1. سرویس api خود را وارد کنید
import api from '../services/api'; 

// تعریف تایپ برای پاسخ موفقیت‌آمیز آپلود فایل
// این تایپ را بر اساس پاسخی که از بک‌اند خود دریافت می‌کنید، ویرایش کنید
interface UploadResponse {
  id: number;
  file: string; // آدرس فایل آپلود شده
  description: string;
  // ... هر فیلد دیگری که در پاسخ سرور دارید
}

// تعریف تایپ برای props کامپوننت
interface FileUploadProps {
  contentType: string; // مثلاً 'task' یا 'project'
  objectId: number; // آی‌دی آبجکت مربوطه
  onUploadComplete: (data: UploadResponse) => void; // تابعی که پس از آپلود موفق اجرا می‌شود
}

const FileUpload: React.FC<FileUploadProps> = ({ contentType, objectId, onUploadComplete }) => {
  // تایپ کردن state ها
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]; // استفاده از ?. برای امنیت بیشتر
    
    // Validate file size (10MB)
    if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
      setError('File size cannot exceed 10MB');
      return;
    }
    
    setFile(selectedFile || null); // اگر فایلی انتخاب نشود، null قرار بده
    setError('');
  };

  const handleUpload = async (): Promise<void> => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    formData.append('content_type', contentType);
    formData.append('object_id', objectId.toString()); // objectId باید به string تبدیل شود

    setUploading(true);
    setError('');

    try {
      // 2. به جای axios مستقیم، از سرویس api خود استفاده کنید
      // هدر Authorization به صورت خودکار توسط اینترفالر api.ts اضافه می‌شود
      const response = await api.post<UploadResponse>(
        '/files/attachments/', // baseURL از api.ts خوانده می‌شود
        formData,
        {
          // هدر 'Content-Type': 'multipart/form-data' به صورت خودکار توسط axios تنظیم می‌شود
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            const percentCompleted = Math.round(
              ((progressEvent.loaded || 0) * 100) / (progressEvent.total || 0)
            );
            setProgress(percentCompleted);
          },
        }
      );

      // Upload successful
      setFile(null);
      setDescription('');
      setProgress(0);
      
      if (onUploadComplete) {
        onUploadComplete(response.data);
      }
      
      alert('File uploaded successfully!');
      
    } catch (err: any) {
      // تایپ err به صورت any یا unknown و سپس بررسی آن
      const errorMessage = err.response?.data?.detail || err.response?.data?.error || 'Upload failed';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload">
      <h3>Upload File</h3>
      
      <div className="form-group">
        <input
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.zip"
        />
      </div>

      <div className="form-group">
        <input
          type="text"
          placeholder="File description (optional)"
          value={description}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
          disabled={uploading}
        />
      </div>

      {uploading && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          >
            {progress}%
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
};

export default FileUpload;

