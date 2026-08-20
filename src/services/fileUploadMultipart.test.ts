// src/services/fileUploadMultipart.test.ts
import { describe, it, expect } from 'vitest';
import api from './api';

describe('multipart upload content-type (B4)', () => {
  it('sets multipart/form-data (not JSON/urlencoded) for FormData', async () => {
    // Capture the final request config (after axios transformRequest/merge runs).
    const captured: any = {};
    const original = api.defaults.adapter;
    api.defaults.adapter = ((config: any) => {
      captured.url = config.url;
      captured.headers = { ...config.headers };
      captured.data = config.data;
      return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config });
    }) as any;

    try {
      const formData = new FormData();
      formData.append('file', new Blob(['hello']), 'test.txt');
      formData.append('content_type', 'project');
      formData.append('object_id', '1');

      await api.post('/files/attachments/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } finally {
      api.defaults.adapter = original;
    }

    const contentType = captured.headers?.['Content-Type'] ?? captured.headers?.['content-type'];
    if (!/^multipart\/form-data/.test(contentType || '')) {
      console.log('DEBUG captured.headers =', JSON.stringify(captured.headers));
    }
    expect(contentType).toMatch(/^multipart\/form-data/);

    // The body must remain a FormData instance, not a JSON string.
    expect(captured.data).toBeInstanceOf(FormData);
  });
});
