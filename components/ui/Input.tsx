import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    isPassword,
    style,
    ...props
}) => {
    const { mode } = useThemeStore();
    const theme = colors[mode === 'dark' ? 'dark' : 'light'];
    const [showPassword, setShowPassword] = React.useState(false);

    return (
        <View style={styles.container}>
            {label && <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>}
            <View style={[
                styles.inputContainer,
                {
                    borderColor: error ? theme.danger : theme.border,
                    backgroundColor: theme.surface,
                },
            ]}>
                {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
                <TextInput
                    style={[styles.input, { color: theme.text }, style]}
                    placeholderTextColor={theme.textMuted}
                    secureTextEntry={isPassword && !showPassword}
                    {...props}
                />
                {isPassword ? (
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.icon}>
                        <Text style={{ color: theme.primary }}>{showPassword ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                ) : (
                    rightIcon && <View style={styles.icon}>{rightIcon}</View>
                )}
            </View>
            {error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.caption,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: borderRadius.md,
        height: 48,
        paddingHorizontal: spacing.sm,
    },
    input: {
        flex: 1,
        ...typography.body,
        height: '100%',
    },
    icon: {
        padding: spacing.xs,
    },
    error: {
        ...typography.caption,
        marginTop: spacing.xs,
    },
});
