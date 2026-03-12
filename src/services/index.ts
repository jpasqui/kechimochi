/**
 * Service factory.
 *
 * Call `initServices()` once at application startup (before anything else).
 * After that, every module calls `getServices()` to get the active adapter.
 *
 * Runtime detection: if `window.__TAURI_INTERNALS__` is present we are inside
 * the Tauri webview and use the desktop adapter; otherwise we use the web
 * (HTTP) adapter.
 */
import type { AppServices } from './types';

export type { AppServices };

let _services: AppServices | null = null;

function hasTauriRuntimeGlobals(): boolean {
    const w = window as any;
    return Boolean(
        w.__TAURI_INTERNALS__ ||
        w.__TAURI__ ||
        typeof w.__TAURI_IPC__ === 'function' ||
        typeof w.__TAURI_INVOKE__ === 'function'
    );
}

function hasDesktopRuntimeUserAgent(): boolean {
    const ua = navigator.userAgent || '';
    return /\bTauri\b|\bWebView2\b/i.test(ua);
}

function isDesktopRuntime(): boolean {
    // Different Tauri versions/execution modes expose different globals.
    if (hasTauriRuntimeGlobals()) {
        return true;
    }

    // Some runtimes expose a custom protocol/origin.
    const protocol = window.location?.protocol || '';
    if (protocol === 'tauri:') return true;
    const origin = window.location?.origin || '';
    if (origin.startsWith('tauri://')) return true;

    // Fallback for contexts where globals are not yet injected at detection time.
    return hasDesktopRuntimeUserAgent();
}

function isClearlyWebRuntime(): boolean {
    if (hasTauriRuntimeGlobals()) {
        return false;
    }

    if (hasDesktopRuntimeUserAgent()) return false;

    const protocol = window.location?.protocol || '';
    // In normal browser web mode this is http(s).
    return protocol === 'http:' || protocol === 'https:';
}

async function detectDesktopRuntimeWithRetry(): Promise<boolean> {
    // In some startup races, Tauri globals appear shortly after DOMContentLoaded.
    if (isDesktopRuntime()) return true;

    // Avoid delaying web mode startup when we are clearly in a browser context.
    if (isClearlyWebRuntime()) return false;

    for (let i = 0; i < 40; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        if (isDesktopRuntime()) return true;
    }

    return false;
}

export function getServices(): AppServices {
    if (!_services) {
        throw new Error(
            '[kechimochi] Services have not been initialised. ' +
            'Make sure initServices() is awaited before anything else runs.'
        );
    }
    return _services;
}

export async function initServices(): Promise<AppServices> {
    const isDesktop = await detectDesktopRuntimeWithRetry();
    if (isDesktop) {
        const { DesktopServices } = await import('./desktop');
        _services = new DesktopServices();
    } else {
        console.warn('[kechimochi] Desktop runtime not detected, using web services adapter');
        const { WebServices } = await import('./web');
        _services = new WebServices();
    }
    return _services;
}
