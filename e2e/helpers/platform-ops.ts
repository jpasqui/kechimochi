import fs from 'node:fs';
import path from 'node:path';
import { isWebMode } from './mode.js';

interface ImportResult {
  ok: boolean;
  count?: number;
  error?: string;
}

interface DownloadResult {
  found: boolean;
  content?: string;
}

/**
 * Sets mock paths consumed by dialog wrappers during desktop tests.
 * Kept available in web mode as a harmless no-op fallback hook.
 */
export async function setDialogMockPath(filePath: string): Promise<void> {
  const fileContent = isWebMode() && fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null;

  await browser.execute((p, content) => {
    const globals = globalThis as unknown as {
      mockSavePath: string;
      mockOpenPath: string;
      mockOpenFileContent?: string;
    };
    globals.mockSavePath = p;
    globals.mockOpenPath = p;
    if (typeof content === 'string') {
      globals.mockOpenFileContent = content;
    }
  }, filePath, fileContent);
}

export async function waitForMockDownloadedFile(filePath: string, timeout = 15000): Promise<void> {
  if (!isWebMode()) {
    await browser.waitUntil(() => fs.existsSync(filePath), {
      timeout,
      timeoutMsg: `Expected file to exist: ${filePath}`,
    });
    return;
  }

  await browser.waitUntil(async () => {
    const result = await browser.execute((targetPath) => {
      const globals = globalThis as unknown as {
        mockDownloadedFiles?: Record<string, { content: string }>;
      };
      const match = globals.mockDownloadedFiles?.[targetPath];
      return match ? { found: true, content: match.content } : { found: false };
    }, filePath) as DownloadResult;

    if (!result.found || typeof result.content !== 'string') {
      return false;
    }

    fs.writeFileSync(filePath, result.content, 'utf-8');
    return true;
  }, {
    timeout,
    timeoutMsg: `Mocked download was not captured for ${filePath}`,
  });
}

/**
 * Imports activities CSV in both desktop and web modes.
 */
export async function importActivitiesCsvFromPath(filePath: string): Promise<number> {
  if (!isWebMode()) {
    await browser.execute(async (csvPath) => {
      // @ts-expect-error - e2e uses tauri internals in desktop mode
      await globalThis.__TAURI_INTERNALS__.invoke('import_csv', { filePath: csvPath });
    }, filePath);
    return 0;
  }

  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const uploadName = path.basename(filePath);
  const result = await browser.executeAsync((content: string, filename: string, done: (r: ImportResult) => void) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const file = new File([blob], filename, { type: 'text/csv' });
    const form = new FormData();
    form.append('file', file);

    fetch('/api/import/activities', { method: 'POST', body: form })
      .then(async (response) => {
        if (!response.ok) {
          done({ ok: false, error: await response.text() });
          return;
        }
        const payload = await response.json() as { count?: number };
        done({ ok: true, count: payload.count ?? 0 });
      })
      .catch((error: unknown) => {
        done({ ok: false, error: String(error) });
      });
  }, csvContent, uploadName);

  if (!result.ok) {
    throw new Error(`Failed to import activities in web mode: ${result.error || 'unknown error'}`);
  }

  return result.count ?? 0;
}
