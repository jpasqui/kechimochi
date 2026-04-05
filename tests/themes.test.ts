import { describe, expect, it, vi } from 'vitest';
import {
    applyTheme,
    buildCustomThemeStyles,
    createExportableThemePack,
    parseManagedThemePacks,
    parseStoredCustomThemes,
    resolveThemeSelection,
    writeThemeCache,
    validateThemePack,
} from '../src/themes';
import { STORAGE_KEYS } from '../src/constants';

const baseVariables = {
    'surface-base': '#101010',
    'surface-card': '#202020',
    'surface-card-hover': '#303030',
    'text-primary': '#ffffff',
    'text-secondary': '#cccccc',
    'accent-primary': '#00ff88',
    'accent-primary-hover': '#22ffaa',
    'accent-danger': '#ff4466',
    'accent-interactive': '#4488ff',
    'accent-highlight': '#ffdd44',
    'accent-secondary': '#aa66ff',
    'border-subtle': '#444444',
    'shadow-soft': '0 2px 4px rgba(0,0,0,0.2)',
    'shadow-strong': '0 4px 12px rgba(0,0,0,0.4)',
    'heatmap-hue': '180',
    'heatmap-saturation-base': '40',
    'heatmap-saturation-range': '50',
    'heatmap-lightness-base': '45',
    'heatmap-lightness-range': '35',
    'accent-contrast': '#000000',
    'chart-series-1': '#111111',
    'chart-series-2': '#222222',
    'chart-series-3': '#333333',
    'chart-series-4': '#444444',
    'chart-series-5': '#555555',
} as const;

describe('themes.ts', () => {
    it('validates theme packs and rejects unsafe css overrides', () => {
        const valid = validateThemePack({
            version: 1,
            id: 'custom:test-theme',
            name: 'Test Theme',
            variables: baseVariables,
            cssOverrides: '.btn { border-radius: 999px; }',
        });

        expect(valid.id).toBe('custom:test-theme');
        expect(() => validateThemePack({
            version: 1,
            id: 'light',
            name: 'Reserved',
            variables: baseVariables,
        })).toThrow('reserved');
        expect(() => validateThemePack({
            version: 1,
            id: 'custom:unsafe',
            name: 'Unsafe',
            variables: baseVariables,
            cssOverrides: '@import url("https://example.com/bad.css");',
        })).toThrow('unsupported');
    });

    it('scopes custom css overrides to the active theme', () => {
        const styles = buildCustomThemeStyles([{
            version: 1,
            id: 'custom:test-theme',
            name: 'Test Theme',
            variables: { ...baseVariables },
            cssOverrides: '.btn, body::before { border-radius: 999px; } @media (max-width: 600px) { .card { padding: 2rem; } }',
        }]);

        expect(styles).toContain("body[data-theme='custom:test-theme'] .btn");
        expect(styles).toContain("body[data-theme='custom:test-theme']::before");
        expect(styles).toContain("@media (max-width: 600px)");
        expect(styles).toContain("body[data-theme='custom:test-theme'] .card");
    });

    it('exports built-in themes as custom packs and falls back when custom themes disappear', () => {
        const builtInExport = createExportableThemePack('light', []);
        expect(builtInExport.id).toBe('custom:light');
        expect(builtInExport.cssOverrides).toBe('');

        const customThemes = parseStoredCustomThemes(JSON.stringify([{
            version: 1,
            id: 'custom:test-theme',
            name: 'Test Theme',
            variables: baseVariables,
        }]));
        const customExport = createExportableThemePack('custom:test-theme', customThemes);
        expect(customExport.cssOverrides).toBe('');
        expect(resolveThemeSelection('custom:test-theme', customThemes)).toBe('custom:test-theme');
        expect(resolveThemeSelection('custom:missing', customThemes)).toBe('pastel-pink');
    });

    it('applies custom themes to the document', () => {
        document.body.dataset.theme = '';
        const customThemes = parseStoredCustomThemes(JSON.stringify([{
            version: 1,
            id: 'custom:test-theme',
            name: 'Test Theme',
            variables: baseVariables,
            cssOverrides: '.btn { border-radius: 999px; }',
        }]));

        const resolved = applyTheme('custom:test-theme', customThemes);
        expect(resolved).toBe('custom:test-theme');
        expect(document.body.dataset.theme).toBe('custom:test-theme');
        expect(document.getElementById('kechimochi-custom-theme-styles')?.textContent).toContain('border-radius: 999px;');
    });

    it('writes only the selected theme cache and clears the legacy custom theme payload', () => {
        const setItem = vi.fn();
        const removeItem = vi.fn();

        writeThemeCache('dark', parseStoredCustomThemes(JSON.stringify([{
            version: 1,
            id: 'custom:test-theme',
            name: 'Test Theme',
            variables: baseVariables,
            cssOverrides: '.btn { border-radius: 999px; }',
        }])), { setItem, removeItem } as unknown as Storage);

        expect(removeItem).toHaveBeenCalledWith(STORAGE_KEYS.CUSTOM_THEMES_CACHE);
        expect(setItem).toHaveBeenCalledTimes(1);
        expect(setItem).toHaveBeenCalledWith(STORAGE_KEYS.THEME_CACHE, 'dark');
    });

    it('does not reintroduce quota-sensitive full theme writes when many custom themes exist', () => {
        const setItem = vi.fn();
        const removeItem = vi.fn();
        const customThemes = Array.from({ length: 200 }, (_, index) => ({
            version: 1 as const,
            id: `custom:test-theme-${index}`,
            name: `Test Theme ${index}`,
            variables: { ...baseVariables },
            cssOverrides: '.btn { border-radius: 999px; }',
        }));

        expect(() => writeThemeCache('custom:test-theme-0', customThemes, { setItem, removeItem } as unknown as Storage)).not.toThrow();
        expect(removeItem).toHaveBeenCalledWith(STORAGE_KEYS.CUSTOM_THEMES_CACHE);
        expect(setItem).toHaveBeenCalledTimes(1);
    });

    it('normalizes literal slash-n sequences in css overrides from imported packs', () => {
        const theme = validateThemePack({
            version: 1,
            id: 'custom:slash-n-theme',
            name: 'Slash N Theme',
            variables: baseVariables,
            cssOverrides: ".btn { border-radius: 999px; }\\n\\n.card { border-radius: 30px; }",
        });

        const css = buildCustomThemeStyles([theme]);

        expect(css).toContain("body[data-theme='custom:slash-n-theme'] .btn");
        expect(css).toContain("body[data-theme='custom:slash-n-theme'] .card");
    });

    it('parses managed theme pack contents and skips invalid entries', () => {
        const managedThemes = parseManagedThemePacks([
            JSON.stringify({
                version: 1,
                id: 'custom:managed-theme',
                name: 'Managed Theme',
                variables: baseVariables,
            }),
            '{"version":1,"id":"custom:broken"',
        ]);

        expect(managedThemes).toHaveLength(1);
        expect(managedThemes[0].id).toBe('custom:managed-theme');
    });
});
