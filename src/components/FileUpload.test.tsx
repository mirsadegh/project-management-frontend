// src/components/FileUpload.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../tests/test-utils';
import FileUpload from './FileUpload';
import { useAuth } from '../services/contexts/AuthContext';
import api from '../services/api';

// Mock the useAuth hook (preserve AuthProvider used by the test renderer)
vi.mock('../services/contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

// Mock the api module (component uploads via axios interceptor)
vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

const mockedApi = api as unknown as { post: ReturnType<typeof vi.fn> };

describe('FileUpload Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 1, username: 'testuser' },
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      loading: false,
    });
  });

  it('renders file upload component', () => {
    const { container } = render(
      <FileUpload contentType="task" objectId={1} onUploadComplete={() => {}} />,
      { route: '/projects/1/files' }
    );

    expect(screen.getByText('آپلود فایل')).toBeInTheDocument();
    expect(container.querySelector('input[type="file"]')).toBeInTheDocument();
  });

  it('disables upload button when no files are selected', () => {
    render(
      <FileUpload contentType="task" objectId={1} onUploadComplete={() => {}} />,
      { route: '/projects/1/files' }
    );

    const uploadButton = screen.getByRole('button', { name: 'آپلود' });
    expect(uploadButton).toBeDisabled();
  });

  it('enables upload button when a file is selected', () => {
    const { container } = render(
      <FileUpload contentType="task" objectId={1} onUploadComplete={() => {}} />,
      { route: '/projects/1/files' }
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    const uploadButton = screen.getByRole('button', { name: 'آپلود' });
    expect(uploadButton).not.toBeDisabled();
  });

  it('shows error message when file upload fails', async () => {
    mockedApi.post.mockRejectedValue(new Error('Upload failed'));

    const { container } = render(
      <FileUpload contentType="task" objectId={1} onUploadComplete={() => {}} />,
      { route: '/projects/1/files' }
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    fireEvent.click(screen.getByRole('button', { name: 'آپلود' }));

    await waitFor(() => {
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });
  });

  it('calls onUploadComplete when file upload succeeds', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: 1, file: 'x', description: 'd' } });
    const onUploadComplete = vi.fn();

    const { container } = render(
      <FileUpload contentType="task" objectId={1} onUploadComplete={onUploadComplete} />,
      { route: '/projects/1/files' }
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    fireEvent.click(screen.getByRole('button', { name: 'آپلود' }));

    await waitFor(() => {
      expect(onUploadComplete).toHaveBeenCalled();
    });
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/files/attachments/',
      expect.any(FormData),
      expect.objectContaining({ onUploadProgress: expect.any(Function) })
    );
  });
});
