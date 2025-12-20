// src/components/FileUpload.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '../tests/test-utils';
import FileUpload from './FileUpload';
import { useAuth } from '../services/contexts/AuthContext';

// Mock the useAuth hook
vi.mock('../services/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('FileUpload Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the useAuth hook
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, username: 'testuser' },
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      loading: false,
    });
  });

  it('renders file upload component', () => {
    render(<FileUpload taskId={1} />);
    
    expect(screen.getByText('Upload Files')).toBeInTheDocument();
    expect(screen.getByLabelText('Select files')).toBeInTheDocument();
  });

  it('shows file selection when files are chosen', () => {
    render(<FileUpload taskId={1} />);
    
    // Create a mock file
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    // Mock file input
    const fileInput = screen.getByLabelText('Select files');
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    // Check that the file name is displayed
    expect(screen.getByText('test.txt')).toBeInTheDocument();
  });

  it('disables upload button when no files are selected', () => {
    render(<FileUpload taskId={1} />);
    
    const uploadButton = screen.getByRole('button', { name: 'Upload' });
    expect(uploadButton).toBeDisabled();
  });

  it('enables upload button when files are selected', () => {
    render(<FileUpload taskId={1} />);
    
    // Create a mock file
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    // Mock file input
    const fileInput = screen.getByLabelText('Select files');
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    const uploadButton = screen.getByRole('button', { name: 'Upload' });
    expect(uploadButton).not.toBeDisabled();
  });

  it('shows error message when file upload fails', async () => {
    // Mock console.error to capture errors
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<FileUpload taskId={1} />);
    
    // Create a mock file
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    // Mock file input
    const fileInput = screen.getByLabelText('Select files');
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    // Mock fetch to reject
    global.fetch = vi.fn().mockRejectedValue(new Error('Upload failed'));
    
    // Click upload button
    const uploadButton = screen.getByRole('button', { name: 'Upload' });
    fireEvent.click(uploadButton);
    
    // Wait for error to be handled
    await waitFor(() => {
      expect(screen.getByText('Error uploading files')).toBeInTheDocument();
    });
    
    consoleErrorSpy.mockRestore();
  });
});