/**
 * Backward-compatible re-export from unified theme.
 * New code should import from theme/theme.ts directly.
 */
export { palette } from './theme';
import { darkTheme, lightTheme, palette } from './theme';

export const colors = {
    light: {
        background: lightTheme.bg,
        surface: lightTheme.surface,
        card: lightTheme.bgElevated,
        text: lightTheme.text,
        textMuted: lightTheme.textTertiary,
        primary: lightTheme.primary,
        secondary: palette.cyan,
        border: lightTheme.border,
        success: lightTheme.success,
        warning: lightTheme.warning,
        danger: lightTheme.danger,
        tabBar: lightTheme.tabBar,
    },
    dark: {
        background: darkTheme.bg,
        surface: darkTheme.surface,
        card: darkTheme.bgElevated,
        text: darkTheme.text,
        textMuted: darkTheme.textTertiary,
        primary: darkTheme.primary,
        secondary: palette.cyan,
        border: darkTheme.border,
        success: darkTheme.success,
        warning: darkTheme.warning,
        danger: darkTheme.danger,
        tabBar: darkTheme.tabBar,
    },
};
