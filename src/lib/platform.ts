export function getTelegramBotUrl(): string {
  return 'https://t.me/CivicS123_bot';
}

export const backendUrl =
  import.meta.env.VITE_BACKEND_URL?.trim().replace(/\/+$/, '') || 'http://127.0.0.1:8000';

export function isLocalBackendUrl(): boolean {
  try {
    const { hostname } = new URL(backendUrl);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  } catch {
    return false;
  }
}
