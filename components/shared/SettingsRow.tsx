/**
 * SettingsRow — Standard settings list row for Profile screen.
 *
 * Supports: icon + label + chevron, toggle variant, destructive variant.
 * Follows iOS Settings / Android Preferences pattern.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useRef } from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { radii, spacing, useAppTheme } from '../../theme/theme';

interface SettingsRowProps {
    /** Ionicons icon name */
    icon: string;
    /** Icon background color */
    iconColor: string;
    /** Icon background tint */
    iconBg: string;
    /** Row label */
    label: string;
    /** Optional value shown on the right */
    value?: string;
    /** Press handler (for navigation rows) */
    onPress?: () => void;
    /** Toggle value (renders a Switch instead of chevron) */
    toggleValue?: boolean;
    /** Toggle change handler */
    onToggle?: (value: boolean) => void;
    /** Whether this is a destructive action */
    destructive?: boolean;
    /** Whether to show bottom separator */
    showSeparator?: boolean;
}

export const SettingsRow = memo<SettingsRowProps>(({
    icon,
    iconColor,
    iconBg,
    label,
    value,
    onPress,
    toggleValue,
    onToggle,
    destructive,
    showSeparator = true,
}) => {
    const t = useAppTheme();
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
        Animated.spring(scale, {
            toValue: 0.98,
            useNativeDriver: true,
            speed: 50,
        }).start();
    }, []);

    const handlePressOut = useCallback(() => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
        }).start();
    }, []);

    const isToggle = toggleValue !== undefined;
    const textColor = destructive ? t.danger : t.text;

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <Pressable
                onPress={isToggle ? undefined : onPress}
                onPressIn={isToggle ? undefined : handlePressIn}
                onPressOut={isToggle ? undefined : handlePressOut}
                disabled={!onPress && !isToggle}
                style={[
                    styles.row,
                    showSeparator && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
                ]}
                accessibilityLabel={label}
                accessibilityRole={isToggle ? 'switch' : 'button'}
            >
                <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
                    <Ionicons name={icon as any} size={18} color={iconColor} />
                </View>
                <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
                    {label}
                </Text>
                <View style={styles.rightSection}>
                    {value && !isToggle && (
                        <Text style={[styles.value, { color: t.textTertiary }]} numberOfLines={1}>
                            {value}
                        </Text>
                    )}
                    {isToggle ? (
                        <Switch
                            value={toggleValue}
                            onValueChange={onToggle}
                            trackColor={{ false: t.border, true: t.primary + '50' }}
                            thumbColor={toggleValue ? t.primary : '#f4f3f4'}
                            style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                        />
                    ) : onPress ? (
                        <Ionicons name="chevron-forward" size={16} color={t.textTertiary} />
                    ) : null}
                </View>
            </Pressable>
        </Animated.View>
    );
});

export const SettingsSection = memo<{
    title: string;
    children: React.ReactNode;
}>(({ title, children }) => {
    const t = useAppTheme();
    return (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>
                {title.toUpperCase()}
            </Text>
            <View style={[styles.sectionContent, { backgroundColor: t.surface, borderColor: t.border }]}>
                {children}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.8,
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.xs,
    },
    sectionContent: {
        borderRadius: radii.lg,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: spacing.md,
        minHeight: 52,
        gap: spacing.sm + 4,
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    value: {
        fontSize: 14,
        fontWeight: '400',
    },
});
