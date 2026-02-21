/**
 * CarCard — Unified Design System
 *
 * Single source of truth for every visual token in the app.
 * Import { useAppTheme, theme } from this file in every screen/component.
 *
 * Color rationale:
 * - Dark mode uses deep navy (#0A0E1A) rather than pure black for warmth
 * - 12% luminance gap between bg → surface → elevated for clear layering
 * - Primary blue #3B82F6 used consistently everywhere
 */

import { Platform } from 'react-native';
import { useThemeStore } from '../store/themeStore';

// ─── Raw Palette ──────────────────────────────────────────────────────────────

export const palette = {
    // Brand
    blue: '#3B82F6',
    blueVivid: '#2563EB',
    blueLight: '#DBEAFE',
    blueFrost: 'rgba(59,130,246,0.12)',
    cyan: '#00D4FF',

    // Accent
    emerald: '#10B981',
    emeraldLight: '#D1FAE5',
    amber: '#F59E0B',
    amberLight: '#FEF3C7',
    rose: '#EF4444',
    roseLight: '#FFE4E6',
    whatsapp: '#25D366',
    whatsappLight: '#DCFCE7',

    // Neutral
    white: '#FFFFFF',
    grey50: '#F8FAFC',
    grey100: '#F1F5F9',
    grey150: '#E8EEF4',
    grey200: '#E2E8F0',
    grey300: '#CBD5E1',
    grey400: '#94A3B8',
    grey500: '#64748B',
    grey600: '#475569',
    grey700: '#334155',
    grey800: '#1E293B',
    grey900: '#0F172A',
    grey950: '#020617',
} as const;

// ─── Typography Scale ─────────────────────────────────────────────────────────

const systemFont = Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
});

export const typography = {
    display: {
        fontFamily: systemFont,
        fontSize: 28,
        fontWeight: '700' as const,
        lineHeight: 34,
        letterSpacing: -0.5,
    },
    title: {
        fontFamily: systemFont,
        fontSize: 22,
        fontWeight: '700' as const,
        lineHeight: 28,
        letterSpacing: -0.3,
    },
    heading: {
        fontFamily: systemFont,
        fontSize: 18,
        fontWeight: '600' as const,
        lineHeight: 24,
        letterSpacing: -0.2,
    },
    body: {
        fontFamily: systemFont,
        fontSize: 15,
        fontWeight: '400' as const,
        lineHeight: 22,
    },
    caption: {
        fontFamily: systemFont,
        fontSize: 13,
        fontWeight: '400' as const,
        lineHeight: 18,
    },
    micro: {
        fontFamily: systemFont,
        fontSize: 11,
        fontWeight: '500' as const,
        lineHeight: 14,
        letterSpacing: 0.5,
    },
} as const;

// ─── Spacing (8px base grid) ──────────────────────────────────────────────────

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────

export const radii = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const shadows = {
    card: Platform.select({
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
        },
        android: {
            elevation: 4,
        },
        default: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
        },
    }),
    elevated: Platform.select({
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
        },
        android: {
            elevation: 8,
        },
        default: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
        },
    }),
} as const;

// ─── Theme Tokens ─────────────────────────────────────────────────────────────

export interface AppThemeTokens {
    // Backgrounds
    bg: string;
    bgElevated: string;
    surface: string;
    surfaceMuted: string;

    // Borders
    border: string;
    borderStrong: string;

    // Text
    text: string;
    textSecondary: string;
    textTertiary: string;

    // Brand
    primary: string;
    primaryMuted: string;

    // Status
    success: string;
    successMuted: string;
    warning: string;
    warningMuted: string;
    danger: string;
    dangerMuted: string;

    // Tab bar
    tabBar: string;
    tabInactive: string;
    tabActive: string;

    // Misc
    shadow: string;
    isDark: boolean;
}

export const lightTheme: AppThemeTokens = {
    bg: '#F8FAFC',
    bgElevated: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceMuted: '#F1F5F9',

    border: '#E2E8F0',
    borderStrong: '#CBD5E1',

    text: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#94A3B8',

    primary: '#3B82F6',
    primaryMuted: 'rgba(59,130,246,0.10)',

    success: '#10B981',
    successMuted: 'rgba(16,185,129,0.10)',
    warning: '#F59E0B',
    warningMuted: 'rgba(245,158,11,0.10)',
    danger: '#EF4444',
    dangerMuted: 'rgba(239,68,68,0.10)',

    tabBar: 'rgba(255,255,255,0.92)',
    tabInactive: '#94A3B8',
    tabActive: '#3B82F6',

    shadow: '#94A3B8',
    isDark: false,
};

export const darkTheme: AppThemeTokens = {
    bg: '#0A0E1A',
    bgElevated: '#111827',
    surface: '#151E32',
    surfaceMuted: '#1C2844',

    border: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.14)',

    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',

    primary: '#3B82F6',
    primaryMuted: 'rgba(59,130,246,0.15)',

    success: '#10B981',
    successMuted: 'rgba(16,185,129,0.15)',
    warning: '#F59E0B',
    warningMuted: 'rgba(245,158,11,0.15)',
    danger: '#EF4444',
    dangerMuted: 'rgba(239,68,68,0.15)',

    tabBar: 'rgba(10,14,26,0.92)',
    tabInactive: '#6B7280',
    tabActive: '#3B82F6',

    shadow: '#000000',
    isDark: false, // Will be set correctly below
};

// Ensure isDark is correct
darkTheme.isDark = true;

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Central theme hook — use this in every screen and component.
 * Returns the current theme tokens based on user's mode preference.
 */
export function useAppTheme(): AppThemeTokens {
    const { mode } = useThemeStore();
    return mode === 'dark' ? darkTheme : lightTheme;
}

// ─── Unified export object (for non-hook contexts) ────────────────────────────

export const theme = {
    palette,
    typography,
    spacing,
    radii,
    shadows,
    light: lightTheme,
    dark: darkTheme,
} as const;
