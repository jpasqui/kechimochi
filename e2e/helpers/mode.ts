export type E2EMode = 'desktop' | 'web';

export function getE2EMode(): E2EMode {
  return process.env.E2E_MODE === 'web' ? 'web' : 'desktop';
}

export function isWebMode(): boolean {
  return getE2EMode() === 'web';
}

export function getE2EBaseUrl(): string {
  return process.env.E2E_BASE_URL || 'http://127.0.0.1:1420';
}
