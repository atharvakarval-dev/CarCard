/**
 * EmptyState — Shared empty state component.
 *
 * Used by Home, Tags, Shop, and other screens. Provides a consistent
 * empty state pattern with icon, headline, body text, and optional CTA.
 * Each screen can customize the content to feel distinct.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { memo, useEffect, useRef } from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { radii, spacing, useAppTheme } from '../../theme/theme';

interface EmptyStateProps {
    /** Ionicons icon name */
    icon: string;
    /** Background color for the icon circle */
    iconBg?: string;
    /** Icon tint color */
    iconColor?: string;
    /** Main headline */
    title: string;
    /** Supporting body text */
    body: string;
    /** Primary CTA button label */
    ctaLabel?: string;
    /** Primary CTA press handler */
    onCta?: () => void;
    /** Optional secondary CTA label */
    secondaryLabel?: string;
    /** Secondary CTA handler */
    onSecondary?: () => void;
    /** Whether to animate entrance */
    animated?: boolean;
}

export const EmptyState = memo<EmptyStateProps>(({
    icon,
    iconBg,
    iconColor,
    title,
    body,
    ctaLabel,
    onCta,
    secondaryLabel,
    onSecondary,
    animated = true,
}) => {
    const t = useAppTheme();
    const scale = useRef(new Animated.Value(animated ? 0.92 : 1)).current;
    const opacity = useRef(new Animated.Value(animated ? 0 : 1)).current;

    useEffect(() => {
        if (!animated) return;
        Animated.parallel([
            Animated.spring(scale, {
                toValue: 1,
                tension: 60,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const resolvedIconBg = iconBg || t.primaryMuted;
    const resolvedIconColor = iconColor || t.primary;

    return (
        <Animated.View
            style={[
                styles.container,
                { opacity, transform: [{ scale }] },
            ]}
        >
            {/* Icon with layered ring */}
            <View style={[styles.iconRing, { borderColor: t.border }]}>
                <View style={[styles.iconInner, { backgroundColor: resolvedIconBg }]}>
                    <Ionicons name={icon as any} size={36} color={resolvedIconColor} />
                </View>
            </View>

            <Text style={[styles.title, { color: t.text }]}>{title}</Text>
            <Text style={[styles.body, { color: t.textSecondary }]}>{body}</Text>

            {ctaLabel && onCta && (
                <Pressable
                    onPress={onCta}
                    style={({ pressed }) => [
                        styles.ctaButton,
                        { backgroundColor: t.primary, opacity: pressed ? 0.85 : 1 },
                    ]}
                    accessibilityLabel={ctaLabel}
                    accessibilityRole="button"
                >
                    <Text style={styles.ctaText}>{ctaLabel}</Text>
                </Pressable>
            )}

            {secondaryLabel && onSecondary && (
                <Pressable
                    onPress={onSecondary}
                    style={styles.secondaryButton}
                    hitSlop={12}
                    accessibilityLabel={secondaryLabel}
                    accessibilityRole="button"
                >
                    <Text style={[styles.secondaryText, { color: t.primary }]}>
                        {secondaryLabel}
                    </Text>
                </Pressable>
            )}
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xxl,
    },
    iconRing: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    iconInner: {
        width: 76,
        height: 76,
        borderRadius: 38,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: -0.3,
        marginBottom: 8,
        textAlign: 'center',
    },
    body: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: spacing.xl,
        maxWidth: 280,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: spacing.lg,
        paddingVertical: 14,
        borderRadius: radii.md,
        minHeight: 48,
        minWidth: 160,
        justifyContent: 'center',
    },
    ctaText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    secondaryButton: {
        marginTop: spacing.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        minHeight: 44,
        justifyContent: 'center',
    },
    secondaryText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
