import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface BadgeProps {
    label: string;
    variant?: 'success' | 'warning' | 'danger' | 'info';
    children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
    label,
    variant = 'info',
    children,
}) => {
    const { mode } = useThemeStore();
    const theme = colors[mode === 'dark' ? 'dark' : 'light'];

    const getBackgroundColor = () => {
        switch (variant) {
            case 'success': return theme.success + '20'; // 20% opacity
            case 'warning': return theme.warning + '20';
            case 'danger': return theme.danger + '20';
            case 'info': return theme.primary + '20';
            default: return theme.primary + '20';
        }
    };

    const getTextColor = () => {
        switch (variant) {
            case 'success': return theme.success;
            case 'warning': return theme.warning;
            case 'danger': return theme.danger;
            case 'info': return theme.primary;
            default: return theme.primary;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
            <Text style={[styles.text, { color: getTextColor() }]}>
                {label}
            </Text>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        alignSelf: 'flex-start',
    },
    text: {
        ...typography.caption,
        fontWeight: '600',
    },
});
