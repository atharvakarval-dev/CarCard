import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';

interface CardProps {
    children?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: 'solid' | 'glass';
    intensity?: number;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
    children,
    style,
    variant = 'solid',
    intensity = 50,
    padding = 'md',
}) => {
    const { mode } = useThemeStore();
    const theme = colors[mode === 'dark' ? 'dark' : 'light'];

    const getPadding = () => {
        switch (padding) {
            case 'none': return 0;
            case 'sm': return spacing.sm;
            case 'md': return spacing.md;
            case 'lg': return spacing.lg;
            default: return spacing.md;
        }
    };

    const getContainerStyles = () => {
        const shadowStyles = Platform.select({
            web: { boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)' } as any,
            default: {
                shadowColor: theme.secondary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
            }
        });

        return [
            styles.card,
            {
                backgroundColor: variant === 'glass' ? 'rgba(30, 38, 64, 0.4)' : theme.card,
                borderRadius: borderRadius.lg,
                padding: getPadding(),
                borderColor: variant === 'glass' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                ...shadowStyles
            },
            style,
        ];
    };

    if (variant === 'glass' && Platform.OS === 'ios') {
        return (
            <View style={[styles.wrapper, { borderRadius: borderRadius.lg, overflow: 'hidden' }, style]}>
                <BlurView intensity={intensity} tint={mode === 'dark' ? 'dark' : 'light'} style={[styles.full, { padding: getPadding() }]}>
                    {children}
                </BlurView>
            </View>
        );
    }

    // Fallback for Android or Solid variant
    return (
        <View style={getContainerStyles()}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
    },
    wrapper: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    full: {
        width: '100%',
        height: '100%',
    },
});
