export const palette = {
    // Brand Colors
    electricBlue: '#3B82F6',
    neonCyan: '#00D4FF',

    // Backgrounds
    background: '#0A0E1A',
    surface: '#141828',
    card: '#1E2640',

    // States
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',

    // Text
    white: '#FFFFFF',
    muted: '#94A3B8',

    // Gradients
    gradientStart: '#1E2640', // Example
    gradientEnd: '#0A0E1A',
};

export const colors = {
    light: {
        background: '#FFFFFF',
        surface: '#F8FAFC',
        card: '#FFFFFF',
        text: '#0F172A',
        textMuted: '#64748B',
        primary: palette.electricBlue,
        secondary: palette.neonCyan,
        border: '#E2E8F0',
        success: palette.success,
        warning: palette.warning,
        danger: palette.danger,
        tabBar: '#FFFFFF',
    },
    dark: {
        background: palette.background,
        surface: palette.surface,
        card: palette.card,
        text: palette.white,
        textMuted: palette.muted,
        primary: palette.electricBlue,
        secondary: palette.neonCyan,
        border: '#2D3748',
        success: palette.success,
        warning: palette.warning,
        danger: palette.danger,
        tabBar: '#141828', // Matches surface
    },
};
