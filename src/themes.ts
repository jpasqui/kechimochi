import { Logger } from './core/logger';
import { DEFAULTS, STORAGE_KEYS } from './constants';
import {
    type ThemeBackgroundDefinition,
    type ThemeFontDefinition,
    type ThemePackV1,
    type ThemeVariableKey,
    type ThemeVariables,
    type ThemeTypographyDefinition,
} from './types';

export type {
    ThemeBackgroundDefinition,
    ThemeFontDefinition,
    ThemePackV1,
    ThemeTypographyDefinition,
    ThemeVariables,
    ThemeVariableKey,
} from './types';

const CUSTOM_THEME_STYLE_ID = 'kechimochi-custom-theme-styles';
const CUSTOM_THEME_BACKDROP_ID = 'kechimochi-custom-theme-backdrop';
const THEME_BACKDROP_MANAGED_APP_POSITION = 'themeBackdropManagedAppPosition';
const THEME_BACKDROP_MANAGED_APP_Z_INDEX = 'themeBackdropManagedAppZIndex';
const BUILTIN_EXPORT_PREFIX = 'custom:';

type ThemeDefinition = ThemePackV1 & { builtIn: boolean };
type ThemeOption = Pick<ThemeDefinition, 'id' | 'name' | 'builtIn'>;

type ThemeVariableDescriptor = {
    key: ThemeVariableKey;
    cssVar: string;
};

type BuiltInThemeCssVariables = Record<ThemeVariableDescriptor['cssVar'], string>;

const THEME_VARIABLE_DESCRIPTORS: readonly ThemeVariableDescriptor[] = [
    { key: 'surface-base', cssVar: 'bg-dark' },
    { key: 'surface-card', cssVar: 'bg-card' },
    { key: 'surface-card-hover', cssVar: 'bg-card-hover' },
    { key: 'text-primary', cssVar: 'text-primary' },
    { key: 'text-secondary', cssVar: 'text-secondary' },
    { key: 'accent-primary', cssVar: 'accent-green' },
    { key: 'accent-primary-hover', cssVar: 'accent-green-hover' },
    { key: 'accent-danger', cssVar: 'accent-red' },
    { key: 'accent-interactive', cssVar: 'accent-blue' },
    { key: 'accent-highlight', cssVar: 'accent-yellow' },
    { key: 'accent-secondary', cssVar: 'accent-purple' },
    { key: 'border-subtle', cssVar: 'border-color' },
    { key: 'shadow-soft', cssVar: 'shadow-sm' },
    { key: 'shadow-strong', cssVar: 'shadow-md' },
    { key: 'heatmap-hue', cssVar: 'heatmap-hue' },
    { key: 'heatmap-saturation-base', cssVar: 'heatmap-sat-base' },
    { key: 'heatmap-saturation-range', cssVar: 'heatmap-sat-range' },
    { key: 'heatmap-lightness-base', cssVar: 'heatmap-light-base' },
    { key: 'heatmap-lightness-range', cssVar: 'heatmap-light-range' },
    { key: 'accent-contrast', cssVar: 'accent-text' },
    { key: 'chart-series-1', cssVar: 'chart-1' },
    { key: 'chart-series-2', cssVar: 'chart-2' },
    { key: 'chart-series-3', cssVar: 'chart-3' },
    { key: 'chart-series-4', cssVar: 'chart-4' },
    { key: 'chart-series-5', cssVar: 'chart-5' },
] as const;

const DEFAULT_THEME_VARIABLES: Pick<
    ThemeVariables,
    'heatmap-hue' | 'heatmap-saturation-base' | 'heatmap-saturation-range' | 'heatmap-lightness-base' | 'heatmap-lightness-range' | 'accent-contrast'
> = {
    'heatmap-hue': '353',
    'heatmap-saturation-base': '30',
    'heatmap-saturation-range': '70',
    'heatmap-lightness-base': '45',
    'heatmap-lightness-range': '41',
    'accent-contrast': '#ffffff',
};

function normalizeThemeVariables(input: Record<string, unknown>, sourceLabel: string): ThemeVariables {
    const variables = {} as ThemeVariables;

    for (const descriptor of THEME_VARIABLE_DESCRIPTORS) {
        const value = input[descriptor.key];

        if (typeof value !== 'string' || value.trim().length === 0) {
            throw new Error(`${sourceLabel} variable "${descriptor.key}" must be a non-empty string.`);
        }

        variables[descriptor.key] = value.trim();
    }

    return variables;
}

function createThemeVariables(overrides: Partial<ThemeVariables>): ThemeVariables {
    return normalizeThemeVariables({ ...DEFAULT_THEME_VARIABLES, ...overrides }, 'Built-in theme');
}

function createThemeVariablesFromCssVariables(overrides: BuiltInThemeCssVariables): ThemeVariables {
    const normalizedOverrides = Object.fromEntries(
        THEME_VARIABLE_DESCRIPTORS
            .map(descriptor => [descriptor.key, overrides[descriptor.cssVar]])
            .filter(([, value]) => value !== undefined),
    ) as Partial<ThemeVariables>;

    return createThemeVariables(normalizedOverrides);
}

export const BUILTIN_THEMES: ThemeDefinition[] = [
    {
        version: 1,
        id: 'pastel-pink',
        name: 'Pastel Pink (Default)',
        builtIn: true,
        variables: createThemeVariablesFromCssVariables({
            'bg-dark': '#2e232b',
            'bg-card': '#3d2e37',
            'bg-card-hover': '#4f3b47',
            'text-primary': '#fff0f5',
            'text-secondary': '#d8bfd8',
            'accent-green': '#ffb3ba',
            'accent-green-hover': '#ffdfba',
            'accent-red': '#ff9eaa',
            'accent-blue': '#b19cd9',
            'accent-yellow': '#fadadd',
            'accent-purple': '#f5c0c0',
            'border-color': '#554460',
            'shadow-sm': '0 2px 4px rgba(0, 0, 0, 0.2)',
            'shadow-md': '0 4px 12px rgba(0, 0, 0, 0.3)',
            'heatmap-hue': '353',
            'heatmap-sat-base': '30',
            'heatmap-sat-range': '70',
            'accent-text': '#000000',
            'chart-1': '#f4a6b8',
            'chart-2': '#b8cdda',
            'chart-3': '#e0bbe4',
            'chart-4': '#957DAD',
            'chart-5': '#D291BC',
        }),
    },
    {
        version: 1,
        id: 'light',
        name: 'Light Theme',
        builtIn: true,
        variables: createThemeVariablesFromCssVariables({
            'bg-dark': '#f8f9fa',
            'bg-card': '#ffffff',
            'bg-card-hover': '#f1f3f5',
            'text-primary': '#212529',
            'text-secondary': '#495057',
            'accent-green': '#228be6',
            'accent-green-hover': '#1c7ed6',
            'accent-red': '#fa5252',
            'accent-blue': '#7950f2',
            'accent-yellow': '#fab005',
            'accent-purple': '#be4bdb',
            'border-color': '#dee2e6',
            'shadow-sm': '0 2px 4px rgba(0, 0, 0, 0.05)',
            'shadow-md': '0 4px 12px rgba(0, 0, 0, 0.1)',
            'heatmap-hue': '210',
            'heatmap-sat-base': '40',
            'heatmap-sat-range': '60',
            'accent-text': '#ffffff',
            'chart-1': '#228be6',
            'chart-2': '#fa5252',
            'chart-3': '#40c057',
            'chart-4': '#fd7e14',
            'chart-5': '#7950f2',
        }),
    },
    {
        version: 1,
        id: 'dark',
        name: 'Dark Theme',
        builtIn: true,
        variables: createThemeVariablesFromCssVariables({
            'bg-dark': '#121212',
            'bg-card': '#1e1e1e',
            'bg-card-hover': '#2d2d2d',
            'text-primary': '#e0e0e0',
            'text-secondary': '#b0b0b0',
            'accent-green': '#bb86fc',
            'accent-green-hover': '#d1a8ff',
            'accent-red': '#cf6679',
            'accent-blue': '#03dac6',
            'accent-yellow': '#fdd835',
            'accent-purple': '#bb86fc',
            'border-color': '#333333',
            'shadow-sm': '0 2px 4px rgba(0, 0, 0, 0.5)',
            'shadow-md': '0 4px 12px rgba(0, 0, 0, 0.7)',
            'heatmap-hue': '260',
            'heatmap-sat-base': '50',
            'heatmap-sat-range': '50',
            'accent-text': '#ffffff',
            'chart-1': '#bb86fc',
            'chart-2': '#03dac6',
            'chart-3': '#fdd835',
            'chart-4': '#ff8a65',
            'chart-5': '#82b1ff',
        }),
    },
    {
        version: 1,
        id: 'light-greyscale',
        name: 'Light Greyscale',
        builtIn: true,
        variables: createThemeVariablesFromCssVariables({
            'bg-dark': '#ffffff',
            'bg-card': '#f5f5f5',
            'bg-card-hover': '#e0e0e0',
            'text-primary': '#000000',
            'text-secondary': '#424242',
            'accent-green': '#212121',
            'accent-green-hover': '#424242',
            'accent-red': '#424242',
            'accent-blue': '#616161',
            'accent-yellow': '#757575',
            'accent-purple': '#212121',
            'border-color': '#bdbdbd',
            'shadow-sm': '0 2px 4px rgba(0,0,0,0.1)',
            'shadow-md': '0 4px 12px rgba(0,0,0,0.15)',
            'heatmap-hue': '0',
            'heatmap-sat-base': '0',
            'heatmap-sat-range': '0',
            'heatmap-light-base': '80',
            'heatmap-light-range': '-60',
            'accent-text': '#ffffff',
            'chart-1': '#212121',
            'chart-2': '#424242',
            'chart-3': '#616161',
            'chart-4': '#757575',
            'chart-5': '#9e9e9e',
        }),
    },
    {
        version: 1,
        id: 'dark-greyscale',
        name: 'Dark Greyscale',
        builtIn: true,
        variables: createThemeVariablesFromCssVariables({
            'bg-dark': '#000000',
            'bg-card': '#121212',
            'bg-card-hover': '#1e1e1e',
            'text-primary': '#ffffff',
            'text-secondary': '#aaaaaa',
            'accent-green': '#f5f5f5',
            'accent-green-hover': '#e0e0e0',
            'accent-red': '#bdbdbd',
            'accent-blue': '#e0e0e0',
            'accent-yellow': '#f5f5f5',
            'accent-purple': '#eeeeee',
            'border-color': '#333333',
            'shadow-sm': '0 2px 4px rgba(0,0,0,0.5)',
            'shadow-md': '0 4px 12px rgba(0,0,0,0.8)',
            'heatmap-hue': '0',
            'heatmap-sat-base': '0',
            'heatmap-sat-range': '0',
            'heatmap-light-base': '20',
            'heatmap-light-range': '60',
            'accent-text': '#000000',
            'chart-1': '#f5f5f5',
            'chart-2': '#e0e0e0',
            'chart-3': '#bdbdbd',
            'chart-4': '#9e9e9e',
            'chart-5': '#757575',
        }),
    },
    {
        version: 1,
        id: 'molokai',
        name: 'Molokai',
        builtIn: true,
        variables: createThemeVariablesFromCssVariables({
            'bg-dark': '#1b1d1e',
            'bg-card': '#232526',
            'bg-card-hover': '#3e3d32',
            'text-primary': '#f8f8f2',
            'text-secondary': '#8f908a',
            'accent-green': '#a6e22e',
            'accent-green-hover': '#c4e22e',
            'accent-red': '#f92672',
            'accent-blue': '#66d9ef',
            'accent-yellow': '#e6db74',
            'accent-purple': '#ae81ff',
            'border-color': '#465457',
            'shadow-sm': '0 2px 4px rgba(0,0,0,0.4)',
            'shadow-md': '0 4px 12px rgba(0,0,0,0.6)',
            'heatmap-hue': '80',
            'heatmap-sat-base': '40',
            'heatmap-sat-range': '60',
            'accent-text': '#000000',
            'chart-1': '#a6e22e',
            'chart-2': '#f92672',
            'chart-3': '#66d9ef',
            'chart-4': '#e6db74',
            'chart-5': '#ae81ff',
        }),
    },
    {
        version: 1,
        id: 'green-olive',
        name: 'Green Olive',
        builtIn: true,
        variables: createThemeVariablesFromCssVariables({
            'bg-dark': '#232d20',
            'bg-card': '#2d3a2a',
            'bg-card-hover': '#3d4d38',
            'text-primary': '#e8f0e5',
            'text-secondary': '#a7bfa2',
            'accent-green': '#89b07a',
            'accent-green-hover': '#a3c498',
            'accent-red': '#d17a7a',
            'accent-blue': '#7a9cb0',
            'accent-yellow': '#e5e8e5',
            'accent-purple': '#9a7ab0',
            'border-color': '#4a5d45',
            'shadow-sm': '0 2px 4px rgba(0,0,0,0.3)',
            'shadow-md': '0 4px 12px rgba(0,0,0,0.4)',
            'heatmap-hue': '100',
            'chart-1': '#89b07a',
            'chart-2': '#a7bfa2',
            'chart-3': '#7a9cb0',
            'chart-4': '#9a7ab0',
            'chart-5': '#bcc4bcc3',
        }),
    },
    {
        version: 1,
        id: 'deep-blue',
        name: 'Deep Blue',
        builtIn: true,
        variables: createThemeVariablesFromCssVariables({
            'bg-dark': '#0a192f',
            'bg-card': '#112240',
            'bg-card-hover': '#233554',
            'text-primary': '#e6f1ff',
            'text-secondary': '#8892b0',
            'accent-green': '#64ffda',
            'accent-green-hover': '#80ffe2',
            'accent-red': '#ff4d4d',
            'accent-blue': '#3399ff',
            'accent-yellow': '#ccd6f6',
            'accent-purple': '#bd93f9',
            'border-color': '#1d2d50',
            'shadow-sm': '0 2px 4px rgba(0,0,0,0.5)',
            'shadow-md': '0 4px 12px rgba(0,0,0,0.7)',
            'heatmap-hue': '170',
            'chart-1': '#64ffda',
            'chart-2': '#3399ff',
            'chart-3': '#bd93f9',
            'chart-4': '#ff79c6',
            'chart-5': '#8be9fd',
        }),
    },
    {
        version: 1,
        id: 'purple',
        name: 'Purple',
        builtIn: true,
        variables: createThemeVariablesFromCssVariables({
            'bg-dark': '#1e1b2e',
            'bg-card': '#2e2a44',
            'bg-card-hover': '#3f3a5c',
            'text-primary': '#f0ebff',
            'text-secondary': '#b1a7d1',
            'accent-green': '#d1a7ff',
            'accent-green-hover': '#e0c7ff',
            'accent-red': '#ff7eb6',
            'accent-blue': '#7eb6ff',
            'accent-yellow': '#ffeb3b',
            'accent-purple': '#9c27b0',
            'border-color': '#4a446a',
            'shadow-sm': '0 2px 4px rgba(0,0,0,0.3)',
            'shadow-md': '0 4px 12px rgba(0,0,0,0.5)',
            'heatmap-hue': '270',
            'chart-1': '#d1a7ff',
            'chart-2': '#7eb6ff',
            'chart-3': '#ff7eb6',
            'chart-4': '#ffeb3b',
            'chart-5': '#9c27b0',
        }),
    },
    {
        version: 1,
        id: 'fire-red',
        name: 'Fire Red',
        builtIn: true,
        variables: createThemeVariablesFromCssVariables({
            'bg-dark': '#2b1111',
            'bg-card': '#3d1a1a',
            'bg-card-hover': '#542525',
            'text-primary': '#ffeeee',
            'text-secondary': '#d1a7a7',
            'accent-green': '#ff4d4d',
            'accent-green-hover': '#ff6666',
            'accent-red': '#ff1a1a',
            'accent-blue': '#ff7e7e',
            'accent-yellow': '#ffd700',
            'accent-purple': '#e91e63',
            'border-color': '#6a2a2a',
            'shadow-sm': '0 2px 4px rgba(0,0,0,0.4)',
            'shadow-md': '0 4px 12px rgba(0,0,0,0.6)',
            'heatmap-hue': '0',
            'chart-1': '#ff4d4d',
            'chart-2': '#ff7e7e',
            'chart-3': '#ffd700',
            'chart-4': '#ff1a1a',
            'chart-5': '#e91e63',
        }),
    },
    {
        version: 1,
        id: 'yellow-lime',
        name: 'Yellow Lime',
        builtIn: true,
        variables: createThemeVariablesFromCssVariables({
            'bg-dark': '#2a2b10',
            'bg-card': '#3a3b1a',
            'bg-card-hover': '#4a4b2a',
            'text-primary': '#ffffef',
            'text-secondary': '#d1d1a7',
            'accent-green': '#d4ff00',
            'accent-green-hover': '#e0ff33',
            'accent-red': '#ff4d4d',
            'accent-blue': '#33d4ff',
            'accent-yellow': '#fdd835',
            'accent-purple': '#9c27b0',
            'border-color': '#5a5b2a',
            'shadow-sm': '0 2px 4px rgba(0,0,0,0.3)',
            'shadow-md': '0 4px 12px rgba(0,0,0,0.5)',
            'heatmap-hue': '65',
            'chart-1': '#d4ff00',
            'chart-2': '#33d4ff',
            'chart-3': '#fdd835',
            'chart-4': '#ff4d4d',
            'chart-5': '#9c27b0',
        }),
    },
    {
        version: 1,
        id: 'noctua-brown',
        name: 'Noctua Brown',
        builtIn: true,
        variables: createThemeVariablesFromCssVariables({
            'bg-dark': '#3c2e28',
            'bg-card': '#4d3c33',
            'bg-card-hover': '#634d42',
            'text-primary': '#f2e5d5',
            'text-secondary': '#c2ada1',
            'accent-green': '#d9bfa9',
            'accent-green-hover': '#e6cec0',
            'accent-red': '#ff7e7e',
            'accent-blue': '#708090',
            'accent-yellow': '#d9c5b2',
            'accent-purple': '#c2ada1',
            'border-color': '#5d4a3f',
            'shadow-sm': '0 2px 4px rgba(0,0,0,0.4)',
            'shadow-md': '0 4px 12px rgba(0,0,0,0.6)',
            'heatmap-hue': '20',
            'heatmap-sat-base': '20',
            'heatmap-sat-range': '40',
            'accent-text': '#3c2e28',
            'chart-1': '#904732',
            'chart-2': '#c2ada1',
            'chart-3': '#d9c5b2',
            'chart-4': '#708090',
            'chart-5': '#46342e',
        }),
    },
];

const BUILTIN_THEME_MAP = new Map(BUILTIN_THEMES.map(theme => [theme.id, theme]));
const BUILTIN_THEME_ID_SET = new Set(BUILTIN_THEMES.map(theme => theme.id));
const SAFE_THEME_ID = /^[A-Za-z0-9][A-Za-z0-9:_-]*$/;
const UNSAFE_CSS_PATTERNS = [
    /@import\b/i,
    /javascript:/i,
    /expression\s*\(/i,
    /behavior\s*:/i,
    /-moz-binding/i,
];

export type ThemeAssetResolver = (themeId: string, assetPath: string) => Promise<string | null>;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function normalizeThemeAssetReference(value: string): string {
    return value.trim().replace(/\\/g, '/');
}

function isAbsoluteThemeAssetReference(value: string): boolean {
    return /^(?:[a-z][a-z0-9+.-]*:|\/|data:|blob:)/i.test(value);
}

function isSafeRelativeThemeAssetPath(value: string): boolean {
    if (value.length === 0) return false;
    if (value.startsWith('/')) return false;
    if (/^[A-Za-z]:\//.test(value)) return false;
    const segments = value.split('/');
    return segments.every(segment => segment !== '..' && segment.trim().length > 0);
}

function validateThemeAssetReference(value: unknown, label: string): string {
    if (!isNonEmptyString(value)) {
        throw new Error(`${label} must be a non-empty string.`);
    }

    const normalized = normalizeThemeAssetReference(value);
    if (!isAbsoluteThemeAssetReference(normalized) && !isSafeRelativeThemeAssetPath(normalized)) {
        throw new Error(`${label} must be an absolute URL/data URI or a safe relative asset path.`);
    }

    return normalized;
}

function validateThemeBackground(input: unknown): ThemeBackgroundDefinition | undefined {
    if (input === undefined) return undefined;
    if (!isRecord(input)) {
        throw new Error('Theme pack background must be an object.');
    }

    const type = input.type;
    if (type !== 'image' && type !== 'video') {
        throw new Error('Theme pack background type must be "image" or "video".');
    }

    const fit = input.fit;
    if (fit !== undefined && fit !== 'cover' && fit !== 'contain' && fit !== 'fill') {
        throw new Error('Theme pack background fit must be "cover", "contain", or "fill".');
    }

    if (input.opacity !== undefined && !isFiniteNumber(input.opacity)) {
        throw new Error('Theme pack background opacity must be a finite number.');
    }
    if (input.blur_px !== undefined && !isFiniteNumber(input.blur_px)) {
        throw new Error('Theme pack background blur_px must be a finite number.');
    }
    if (input.playback_rate !== undefined && !isFiniteNumber(input.playback_rate)) {
        throw new Error('Theme pack background playback_rate must be a finite number.');
    }
    if (input.loop !== undefined && typeof input.loop !== 'boolean') {
        throw new Error('Theme pack background loop must be a boolean.');
    }
    if (input.muted !== undefined && typeof input.muted !== 'boolean') {
        throw new Error('Theme pack background muted must be a boolean.');
    }

    const background: ThemeBackgroundDefinition = {
        type,
        src: validateThemeAssetReference(input.src, 'Theme pack background src'),
    };

    if (isNonEmptyString(input.poster)) {
        background.poster = validateThemeAssetReference(input.poster, 'Theme pack background poster');
    }
    if (fit !== undefined) {
        background.fit = fit;
    }
    if (input.opacity !== undefined) {
        background.opacity = Math.min(1, Math.max(0, input.opacity));
    }
    if (input.blur_px !== undefined) {
        background.blur_px = Math.max(0, input.blur_px);
    }
    if (input.playback_rate !== undefined) {
        background.playback_rate = Math.max(0.1, input.playback_rate);
    }
    if (input.loop !== undefined) {
        background.loop = input.loop;
    }
    if (input.muted !== undefined) {
        background.muted = input.muted;
    }

    return background;
}

function validateThemeFonts(input: unknown): ThemeFontDefinition[] | undefined {
    if (input === undefined) return undefined;
    if (!Array.isArray(input)) {
        throw new Error('Theme pack fonts must be an array.');
    }

    return input.map((entry, index) => {
        if (!isRecord(entry)) {
            throw new Error(`Theme pack font ${index + 1} must be an object.`);
        }

        const family = typeof entry.family === 'string' ? entry.family.trim() : '';
        if (!family) {
            throw new Error(`Theme pack font ${index + 1} family is required.`);
        }

        const format = entry.format;
        if (format !== undefined && format !== 'woff2' && format !== 'woff' && format !== 'truetype' && format !== 'opentype') {
            throw new Error(`Theme pack font ${index + 1} format is unsupported.`);
        }

        const style = entry.style;
        if (style !== undefined && style !== 'normal' && style !== 'italic' && style !== 'oblique') {
            throw new Error(`Theme pack font ${index + 1} style is unsupported.`);
        }

        return {
            family,
            src: validateThemeAssetReference(entry.src, `Theme pack font ${index + 1} src`),
            weight: isNonEmptyString(entry.weight) ? entry.weight.trim() : undefined,
            style,
            format,
        } satisfies ThemeFontDefinition;
    });
}

function validateThemeTypography(input: unknown): ThemeTypographyDefinition | undefined {
    if (input === undefined) return undefined;
    if (!isRecord(input)) {
        throw new Error('Theme pack typography must be an object.');
    }

    const typography: ThemeTypographyDefinition = {};
    if (isNonEmptyString(input.body_family)) {
        typography.body_family = input.body_family.trim();
    }
    if (isNonEmptyString(input.heading_family)) {
        typography.heading_family = input.heading_family.trim();
    }
    if (isNonEmptyString(input.monospace_family)) {
        typography.monospace_family = input.monospace_family.trim();
    }

    return Object.keys(typography).length > 0 ? typography : undefined;
}

function slugifyThemeName(name: string): string {
    const normalized = name.toLowerCase();
    let slug = '';
    let lastWasDash = false;

    for (const char of normalized) {
        const isAlphaNumeric = (char >= 'a' && char <= 'z') || (char >= '0' && char <= '9');
        if (isAlphaNumeric) {
            slug += char;
            lastWasDash = false;
            continue;
        }
        if (!lastWasDash) {
            slug += '-';
            lastWasDash = true;
        }
    }

    slug = slug.replace(/^-/, '').replace(/-$/, '');
    return slug || 'theme';
}

function escapeAttributeValue(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function selectorScope(themeId: string): string {
    return `body[data-theme='${escapeAttributeValue(themeId)}']`;
}

function normalizeCssOverrides(cssOverrides: string): string {
    return cssOverrides
        .replace(/\r\n/g, '\n')
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t');
}

function stripComments(css: string): string {
    let output = '';
    let index = 0;
    while (index < css.length) {
        if (css[index] === '/' && css[index + 1] === '*') {
            const commentEnd = css.indexOf('*/', index + 2);
            if (commentEnd === -1) {
                break;
            }
            index = commentEnd + 2;
            continue;
        }
        output += css[index];
        index += 1;
    }
    return output;
}

function readQuoted(css: string, start: number): number {
    const quote = css[start];
    let index = start + 1;
    while (index < css.length) {
        const current = css[index];
        if (current === '\\') {
            index += 2;
            continue;
        }
        if (current === quote) {
            return index;
        }
        index += 1;
    }
    throw new Error('Unterminated string literal in CSS overrides.');
}

function findNextBrace(css: string, start: number, target: '{' | '}'): number {
    let round = 0;
    let square = 0;
    let index = start;
    while (index < css.length) {
        const current = css[index];
        if (current === '"' || current === '\'') {
            index = readQuoted(css, index);
        } else if (current === '(') {
            round += 1;
        } else if (current === ')') {
            round = Math.max(0, round - 1);
        } else if (current === '[') {
            square += 1;
        } else if (current === ']') {
            square = Math.max(0, square - 1);
        } else if (round === 0 && square === 0 && current === target) {
            return index;
        }
        index += 1;
    }
    return -1;
}

function extractBlock(css: string, openBraceIndex: number): { body: string; nextIndex: number } {
    let depth = 0;
    let index = openBraceIndex;
    while (index < css.length) {
        const current = css[index];
        if (current === '"' || current === '\'') {
            index = readQuoted(css, index);
        } else if (current === '{') {
            depth += 1;
        } else if (current === '}') {
            depth -= 1;
            if (depth === 0) {
                return {
                    body: css.slice(openBraceIndex + 1, index),
                    nextIndex: index + 1,
                };
            }
        }
        index += 1;
    }
    throw new Error('Unbalanced braces in CSS overrides.');
}

function splitSelectors(selectorText: string): string[] {
    const selectors: string[] = [];
    let start = 0;
    let round = 0;
    let square = 0;
    let index = 0;
    while (index < selectorText.length) {
        const current = selectorText[index];
        if (current === '"' || current === '\'') {
            index = readQuoted(selectorText, index);
        } else if (current === '(') round += 1;
        else if (current === ')') round = Math.max(0, round - 1);
        else if (current === '[') square += 1;
        else if (current === ']') square = Math.max(0, square - 1);
        else if (current === ',' && round === 0 && square === 0) {
            selectors.push(selectorText.slice(start, index));
            start = index + 1;
        }
        index += 1;
    }
    selectors.push(selectorText.slice(start));
    return selectors;
}

function scopeSelector(selector: string, themeId: string): string {
    const trimmed = selector.trim();
    if (!trimmed) return selectorScope(themeId);

    const scope = selectorScope(themeId);
    if (trimmed.includes(':root')) {
        return trimmed.replace(/:root/g, scope);
    }
    if (/^body\b/i.test(trimmed)) {
        return trimmed.replace(/^body\b/i, scope);
    }
    return `${scope} ${trimmed}`;
}

function scopeQualifiedRule(css: string, index: number, themeId: string): { css: string; nextIndex: number } {
    const braceIndex = findNextBrace(css, index, '{');
    if (braceIndex === -1) {
        return { css: '', nextIndex: css.length };
    }

    const selectorText = css.slice(index, braceIndex).trim();
    const { body, nextIndex } = extractBlock(css, braceIndex);
    const scopedSelectors = splitSelectors(selectorText)
        .map(part => scopeSelector(part, themeId))
        .join(', ');
    return {
        css: `${scopedSelectors}{${body}}`,
        nextIndex,
    };
}

function scopeAtRule(css: string, index: number, themeId: string): { css: string; nextIndex: number } {
    const braceIndex = findNextBrace(css, index, '{');
    if (braceIndex === -1) {
        throw new Error('Unsupported CSS at-rule in overrides.');
    }

    const prelude = css.slice(index, braceIndex).trim();
    const { body, nextIndex } = extractBlock(css, braceIndex);
    if (/^@keyframes\b/i.test(prelude)) {
        return { css: `${prelude}{${body}}`, nextIndex };
    }
    if (/^@(media|supports|layer)\b/i.test(prelude)) {
        return { css: `${prelude}{${scopeCssOverrides(body, themeId)}}`, nextIndex };
    }
    throw new Error('Unsupported CSS at-rule in overrides.');
}

function scopeCssOverrides(cssOverrides: string, themeId: string): string {
    const css = stripComments(cssOverrides).trim();
    if (!css) return '';

    let output = '';
    let index = 0;
    while (index < css.length) {
        const current = css[index];
        if (/\s/.test(current)) {
            output += current;
            index += 1;
            continue;
        }

        const scopedRule = current === '@'
            ? scopeAtRule(css, index, themeId)
            : scopeQualifiedRule(css, index, themeId);
        output += scopedRule.css;
        index = scopedRule.nextIndex;
    }

    return output.trim();
}

function validateCssOverrides(cssOverrides: string | undefined, themeId: string): string | undefined {
    if (!cssOverrides) return undefined;
    const trimmed = normalizeCssOverrides(cssOverrides).trim();
    if (!trimmed) return undefined;
    for (const pattern of UNSAFE_CSS_PATTERNS) {
        if (pattern.test(trimmed)) {
            throw new Error('Theme pack CSS overrides contain an unsupported construct.');
        }
    }
    scopeCssOverrides(trimmed, themeId);
    return trimmed;
}

function validateVariables(input: unknown): ThemeVariables {
    if (!isRecord(input)) {
        throw new Error('Theme pack variables must be an object.');
    }

    return normalizeThemeVariables(input, 'Theme pack');
}

export function validateThemePack(raw: unknown): ThemePackV1 {
    if (!isRecord(raw)) {
        throw new Error('Theme pack must be a JSON object.');
    }

    const version = raw.version;
    if (version !== 1) {
        throw new Error('Unsupported theme pack version.');
    }

    const id = typeof raw.id === 'string' ? raw.id.trim() : '';
    if (!id || !SAFE_THEME_ID.test(id)) {
        throw new Error('Theme pack id must use only letters, numbers, colons, underscores, and hyphens.');
    }
    if (BUILTIN_THEME_ID_SET.has(id)) {
        throw new Error('Theme pack id is reserved by a built-in theme.');
    }

    const name = typeof raw.name === 'string' ? raw.name.trim() : '';
    if (!name) {
        throw new Error('Theme pack name is required.');
    }

    const background = validateThemeBackground(raw.background);
    const fonts = validateThemeFonts(raw.fonts);
    const typography = validateThemeTypography(raw.typography);
    return {
        version,
        id,
        name,
        variables: validateVariables(raw.variables),
        cssOverrides: validateCssOverrides(typeof raw.cssOverrides === 'string' ? raw.cssOverrides : undefined, id),
        background,
        fonts,
        typography,
    };
}

export function parseThemePackText(content: string): ThemePackV1 {
    let parsed: unknown;
    try {
        parsed = JSON.parse(content);
    } catch {
        throw new Error('Theme pack file is not valid JSON.');
    }
    return validateThemePack(parsed);
}

export function parseStoredCustomThemes(raw: string | null): ThemePackV1[] {
    if (!raw || raw.trim().length === 0) return [];

    try {
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }

        const themeMap = new Map<string, ThemePackV1>();
        for (const entry of parsed) {
            try {
                const validated = validateThemePack(entry);
                themeMap.set(validated.id, validated);
            } catch (error) {
                Logger.warn('[kechimochi] Skipping invalid cached custom theme', error);
            }
        }

        return [...themeMap.values()].sort((left, right) => left.name.localeCompare(right.name));
    } catch (error) {
        Logger.warn('[kechimochi] Failed to parse cached custom themes', error);
        return [];
    }
}

export function parseManagedThemePacks(contents: string[]): ThemePackV1[] {
    const themeMap = new Map<string, ThemePackV1>();
    for (const content of contents) {
        try {
            const validated = parseThemePackText(content);
            themeMap.set(validated.id, validated);
        } catch (error) {
            Logger.warn('[kechimochi] Skipping invalid managed custom theme', error);
        }
    }

    return [...themeMap.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export function serializeCustomThemes(themes: ThemePackV1[]): string {
    return JSON.stringify(themes, null, 2);
}

export function getThemeDefinition(themeId: string, customThemes: ThemePackV1[]): ThemeDefinition | null {
    const builtIn = BUILTIN_THEME_MAP.get(themeId);
    if (builtIn) return builtIn;

    const customTheme = customThemes.find(theme => theme.id === themeId);
    return customTheme ? { ...customTheme, builtIn: false } : null;
}

export function getThemeOptions(customThemes: Array<Pick<ThemePackV1, 'id' | 'name'>>): { builtIn: ThemeOption[]; custom: ThemeOption[] } {
    return {
        builtIn: BUILTIN_THEMES,
        custom: customThemes
            .map(theme => ({ ...theme, builtIn: false }))
            .sort((left, right) => left.name.localeCompare(right.name)),
    };
}

export function isBuiltInTheme(themeId: string): boolean {
    return BUILTIN_THEME_ID_SET.has(themeId);
}

export function resolveThemeSelection(themeId: string, customThemes: ThemePackV1[]): string {
    return getThemeDefinition(themeId, customThemes)?.id ?? DEFAULTS.THEME;
}

export function upsertCustomTheme(existingThemes: ThemePackV1[], theme: ThemePackV1): ThemePackV1[] {
    const themeMap = new Map(existingThemes.map(entry => [entry.id, entry]));
    themeMap.set(theme.id, theme);
    return [...themeMap.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export function removeCustomTheme(existingThemes: ThemePackV1[], themeId: string): ThemePackV1[] {
    return existingThemes.filter(theme => theme.id !== themeId);
}

function escapeCssString(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function escapeCssUrl(value: string): string {
    return value.replace(/\\/g, '/').replace(/'/g, "\\'");
}

function buildFontFaceCss(theme: ThemePackV1): string {
    if (!theme.fonts || theme.fonts.length === 0) return '';

    return theme.fonts.map(font => {
        const formatPart = font.format ? ` format('${escapeCssString(font.format)}')` : '';
        return [
            '@font-face {',
            `  font-family: '${escapeCssString(font.family)}';`,
            `  src: url('${escapeCssUrl(font.src)}')${formatPart};`,
            `  font-weight: ${font.weight || 'normal'};`,
            `  font-style: ${font.style || 'normal'};`,
            '  font-display: swap;',
            '}',
        ].join('\n');
    }).join('\n');
}

function buildVariableCss(theme: ThemePackV1): string {
    const declarations = THEME_VARIABLE_DESCRIPTORS
        .map((descriptor: ThemeVariableDescriptor) => `  --${descriptor.cssVar}: ${theme.variables[descriptor.key]};`)
        .join('\n');
    return `${selectorScope(theme.id)} {\n${declarations}\n}\n`;
}

function buildTypographyCss(theme: ThemePackV1): string {
    if (!theme.typography) return '';

    const scope = selectorScope(theme.id);
    const cssParts: string[] = [];

    if (theme.typography.body_family) {
        cssParts.push(`${scope}{font-family:${theme.typography.body_family};}`);
    }
    if (theme.typography.heading_family) {
        cssParts.push(`${scope} h1,${scope} h2,${scope} h3,${scope} h4,${scope} h5,${scope} h6{font-family:${theme.typography.heading_family};}`);
    }
    if (theme.typography.monospace_family) {
        cssParts.push(`${scope} code,${scope} pre,${scope} kbd,${scope} samp{font-family:${theme.typography.monospace_family};}`);
    }

    return cssParts.join('\n');
}

export function buildCustomThemeStyles(themes: ThemePackV1[]): string {
    return themes.map(theme => {
        const cssParts = [buildFontFaceCss(theme), buildVariableCss(theme), buildTypographyCss(theme)].filter(Boolean);
        if (theme.cssOverrides) {
            cssParts.push(scopeCssOverrides(theme.cssOverrides, theme.id));
        }
        return cssParts.join('\n');
    }).join('\n');
}

function shouldResolveThemeAssetReference(value: string): boolean {
    return !isAbsoluteThemeAssetReference(value);
}

async function resolveThemeAssetReference(themeId: string, value: string, resolver?: ThemeAssetResolver): Promise<string> {
    if (!resolver || !shouldResolveThemeAssetReference(value)) {
        return value;
    }

    const resolved = await resolver(themeId, value);
    return resolved || value;
}

export async function resolveThemePackAssets(theme: ThemePackV1, resolver?: ThemeAssetResolver): Promise<ThemePackV1> {
    if (!resolver) {
        return theme;
    }

    const resolvedBackground = theme.background
        ? {
            ...theme.background,
            src: await resolveThemeAssetReference(theme.id, theme.background.src, resolver),
            poster: theme.background.poster
                ? await resolveThemeAssetReference(theme.id, theme.background.poster, resolver)
                : undefined,
        }
        : undefined;

    const resolvedFonts = theme.fonts
        ? await Promise.all(theme.fonts.map(async (font) => ({
            ...font,
            src: await resolveThemeAssetReference(theme.id, font.src, resolver),
        })))
        : undefined;

    return {
        ...theme,
        background: resolvedBackground,
        fonts: resolvedFonts,
    };
}

function ensureStyleElement(doc: Document): HTMLStyleElement {
    const existing = doc.getElementById(CUSTOM_THEME_STYLE_ID);
    if (existing instanceof HTMLStyleElement) {
        return existing;
    }

    const style = doc.createElement('style');
    style.id = CUSTOM_THEME_STYLE_ID;
    (doc.head || doc.body || doc.documentElement).appendChild(style);
    return style;
}

export function syncThemeStyles(customThemes: ThemePackV1[], doc: Document = document): void {
    const style = ensureStyleElement(doc);
    style.textContent = buildCustomThemeStyles(customThemes);
}

function getBackdropRoot(doc: Document): HTMLElement {
    return doc.body || doc.documentElement;
}

function getBackdropForegroundRoot(doc: Document): HTMLElement | null {
    const appRoot = doc.getElementById('app');
    return appRoot instanceof HTMLElement ? appRoot : null;
}

function ensureBackdropElement(doc: Document): HTMLDivElement {
    const existing = doc.getElementById(CUSTOM_THEME_BACKDROP_ID);
    if (existing instanceof HTMLDivElement) {
        return existing;
    }

    const root = getBackdropRoot(doc);

    const backdrop = doc.createElement('div');
    backdrop.id = CUSTOM_THEME_BACKDROP_ID;
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.style.position = 'fixed';
    backdrop.style.inset = '0';
    backdrop.style.overflow = 'hidden';
    backdrop.style.pointerEvents = 'none';
    backdrop.style.zIndex = '0';
    backdrop.style.display = 'none';
    root.prepend(backdrop);
    return backdrop;
}

function syncBackdropLayering(doc: Document): void {
    const appRoot = getBackdropForegroundRoot(doc);
    if (!(appRoot instanceof HTMLElement)) {
        return;
    }

    if (!appRoot.style.position) {
        appRoot.dataset[THEME_BACKDROP_MANAGED_APP_POSITION] = 'true';
        appRoot.style.position = 'relative';
    }
    if (!appRoot.style.zIndex) {
        appRoot.dataset[THEME_BACKDROP_MANAGED_APP_Z_INDEX] = 'true';
        appRoot.style.zIndex = '1';
    }
}

function clearBackdropElement(doc: Document): void {
    const existing = doc.getElementById(CUSTOM_THEME_BACKDROP_ID);

    if (existing instanceof HTMLDivElement) {
        existing.remove();
    }

    const appRoot = getBackdropForegroundRoot(doc);
    if (!(appRoot instanceof HTMLElement)) {
        return;
    }

    if (appRoot.dataset[THEME_BACKDROP_MANAGED_APP_POSITION] === 'true') {
        appRoot.style.position = '';
        delete appRoot.dataset[THEME_BACKDROP_MANAGED_APP_POSITION];
    }

    if (appRoot.dataset[THEME_BACKDROP_MANAGED_APP_Z_INDEX] === 'true') {
        appRoot.style.zIndex = '';
        delete appRoot.dataset[THEME_BACKDROP_MANAGED_APP_Z_INDEX];
    }
}

function prefersReducedMotion(doc: Document): boolean {
    return doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

function buildBackgroundLayer(doc: Document, background: ThemeBackgroundDefinition): HTMLElement {
    const layer = background.type === 'video' ? doc.createElement('video') : doc.createElement('div');
    const opacity = background.opacity ?? 1;
    const blurPx = background.blur_px ?? 0;
    const fit = background.fit || 'cover';

    layer.style.position = 'absolute';
    layer.style.inset = '0';
    layer.style.width = '100%';
    layer.style.height = '100%';
    layer.style.opacity = String(opacity);
    layer.style.filter = blurPx > 0 ? `blur(${blurPx}px)` : 'none';
    layer.style.transform = blurPx > 0 ? 'scale(1.03)' : 'none';

    if (layer instanceof HTMLVideoElement) {
        layer.autoplay = !prefersReducedMotion(doc);
        layer.loop = background.loop ?? true;
        layer.muted = background.muted ?? true;
        layer.defaultMuted = background.muted ?? true;
        layer.playsInline = true;
        layer.preload = 'auto';
        layer.setAttribute('muted', '');
        layer.setAttribute('playsinline', '');
        if (layer.autoplay) {
            layer.setAttribute('autoplay', '');
        }
        if (layer.loop) {
            layer.setAttribute('loop', '');
        }
        layer.src = background.src;
        layer.poster = background.poster || '';
        layer.playbackRate = background.playback_rate ?? 1;
        layer.style.objectFit = fit;
        layer.style.objectPosition = 'center center';
    } else {
        layer.style.backgroundImage = `url('${escapeCssUrl(background.src)}')`;
        layer.style.backgroundPosition = 'center center';
        layer.style.backgroundRepeat = 'no-repeat';
        layer.style.backgroundSize = fit === 'fill' ? '100% 100%' : fit;
    }

    return layer;
}

function syncThemeBackdrop(theme: ThemePackV1 | null, doc: Document = document): void {
    if (!theme?.background) {
        clearBackdropElement(doc);
        return;
    }

    const backdrop = ensureBackdropElement(doc);
    backdrop.replaceChildren();
    backdrop.style.display = 'block';
    syncBackdropLayering(doc);

    const usePosterFallback = theme.background.type === 'video' && prefersReducedMotion(doc) && theme.background.poster;
    const background: ThemeBackgroundDefinition = usePosterFallback
        ? { ...theme.background, type: 'image', src: theme.background.poster! }
        : theme.background;

    const layer = buildBackgroundLayer(doc, background);
    backdrop.appendChild(layer);

    if (layer instanceof HTMLVideoElement && layer.autoplay) {
        queueMicrotask(() => {
            void layer.play().catch(() => undefined);
        });
    }
}

export function applyTheme(themeId: string, customThemes: ThemePackV1[], doc: Document = document): string {
    syncThemeStyles(customThemes, doc);
    const resolvedTheme = resolveThemeSelection(themeId, customThemes);
    doc.body.dataset.theme = resolvedTheme;
    syncThemeBackdrop(getThemeDefinition(resolvedTheme, customThemes), doc);
    return resolvedTheme;
}

export function writeThemeCache(themeId: string, _customThemes: ThemePackV1[], storage: Storage = localStorage): void {
    if (typeof storage.removeItem === 'function') {
        storage.removeItem(STORAGE_KEYS.CUSTOM_THEMES_CACHE);
    }

    storage.setItem(STORAGE_KEYS.THEME_CACHE, themeId);
}

export function hydrateThemeRuntimeFromCache(storage: Storage = localStorage, doc: Document = document): boolean {
    const cachedTheme = storage.getItem(STORAGE_KEYS.THEME_CACHE) || DEFAULTS.THEME;
    if (isBuiltInTheme(cachedTheme)) {
        syncThemeStyles([], doc);
        doc.body.dataset.theme = cachedTheme;
        syncThemeBackdrop(null, doc);
        return true;
    }

    syncThemeStyles([], doc);
    doc.body.dataset.theme = DEFAULTS.THEME;
    syncThemeBackdrop(null, doc);
    return false;
}

export function createExportableThemePack(themeId: string, customThemes: ThemePackV1[]): ThemePackV1 {
    const theme = getThemeDefinition(themeId, customThemes);
    if (!theme) {
        throw new Error('Theme could not be found for export.');
    }

    if (!theme.builtIn) {
        return {
            version: theme.version,
            id: theme.id,
            name: theme.name,
            variables: { ...theme.variables },
            cssOverrides: theme.cssOverrides || '',
            background: theme.background ? { ...theme.background } : undefined,
            fonts: theme.fonts?.map(font => ({ ...font })),
            typography: theme.typography ? { ...theme.typography } : undefined,

        };
    }

    return {
        version: 1,
        id: `${BUILTIN_EXPORT_PREFIX}${theme.id}`,
        name: `${theme.name} Custom`,
        variables: { ...theme.variables },
        cssOverrides: '',
    };
}

export function getThemePackFilename(themePack: ThemePackV1, hasAssets = false): string {
    const extension = hasAssets ? 'zip' : 'json';
    return `kechimochi_theme_${slugifyThemeName(themePack.name)}.${extension}`;
}
