import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'outline' | 'ghost' | 'danger';
    loading?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
    icon,
}) => {
    const { mode } = useThemeStore();
    const theme = colors[mode === 'dark' ? 'dark' : 'light'];

    const getBackgroundColor = () => {
        if (disabled) return theme.border;
        switch (variant) {
            case 'primary': return theme.primary; // Electric Blue
            case 'danger': return theme.danger;
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            default: return theme.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return theme.textMuted;
        switch (variant) {
            case 'primary': return '#FFFFFF'; // Always white on primary
            case 'danger': return '#FFFFFF';
            case 'outline': return theme.primary;
            case 'ghost': return theme.text;
            default: return '#FFFFFF';
        }
    };

    const getBorderColor = () => {
        if (variant === 'outline') return theme.primary;
        return 'transparent';
    };

    return (
        <Pressable
            onPress={(e) => {
                console.log('Button pressed:', title);
                onPress && onPress();
            }}
            disabled={disabled || loading}
            style={({ pressed }) => [
                styles.container,
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: getBorderColor(),
                    borderWidth: variant === 'outline' ? 1 : 0,
                    opacity: pressed ? 0.7 : 1,
                    // @ts-ignore
                    cursor: Platform.OS === 'web' ? 'pointer' : 'auto',
                },
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <>
                    {icon}
                    <Text style={[styles.text, { color: getTextColor(), marginLeft: icon ? spacing.sm : 0 }, textStyle]}>
                        {title}
                    </Text>
                </>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 48,
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: spacing.md,
    },
    text: {
        ...typography.body,
        fontWeight: '600',
    },
});
