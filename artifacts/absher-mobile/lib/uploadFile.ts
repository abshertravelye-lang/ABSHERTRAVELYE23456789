import { Platform } from 'react-native';
import { refreshMobileAccessToken } from '@/context/AuthContext';

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
const UPLOAD_URL = `${API_BASE}/api/storage/uploads`;
const UPLOAD_TIMEOUT_MS = 60_000;

export type UploadFileOptions = {
  uri: string;
  token: string | null;
  fileName: string;
  mimeType: string;
};

function createNativeFormData({ uri, fileName, mimeType }: Omit<UploadFileOptions, 'token'>): FormData {
  const formData = new FormData();
  formData.append('file', { uri, name: fileName, type: mimeType } as any);
  return formData;
}

async function createWebFormData(
  options: Omit<UploadFileOptions, 'token'>,
): Promise<FormData> {
  if (Platform.OS !== 'web') return createNativeFormData(options);

  const blob = await (await fetch(options.uri)).blob();
  const formData = new FormData();
  formData.append('file', new File([blob], options.fileName, { type: blob.type || options.mimeType }));
  return formData;
}

async function postUpload(
  options: Omit<UploadFileOptions, 'token'>,
  token: string | null,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  try {
    const body = await createWebFormData(options);
    return await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function uploadFile(options: UploadFileOptions): Promise<string> {
  const { token, ...file } = options;
  let response = await postUpload(file, token);

  // FormData cannot be replayed after fetch consumes it. Rebuild it after a
  // successful refresh instead of using the generated client's JSON retry.
  if (response.status === 401) {
    const refreshedToken = await refreshMobileAccessToken();
    if (refreshedToken) response = await postUpload(file, refreshedToken);
  }

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = typeof body?.message === 'string' ? `: ${body.message}` : '';
    } catch {
      // Keep the user-facing error stable when the proxy returns HTML/empty text.
    }
    throw new Error(`Upload failed (${response.status})${detail}`);
  }

  const body = await response.json() as { objectPath?: unknown };
  if (typeof body.objectPath !== 'string' || !body.objectPath.startsWith('/objects/')) {
    throw new Error('Upload response did not include a valid object path');
  }
  return body.objectPath;
}