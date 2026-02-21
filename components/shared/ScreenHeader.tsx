/**
 * ScreenHeader — Unified screen header for all tabs.
 *
 * Left-aligned title (consistent Apple-style), optional right action,
 * optional badge, scroll-reactive border.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radii, spacing, typography, useAppTheme } from '../../theme/theme';

interface ScreenHeaderProps {
    /** Title displayed left-aligned */
    title: string;
    /** Optional badge next to title (e.g. tag count) */
    badge?: number;
    /** Optional right action node */
    rightAction?: React.ReactNode;
    /** Whether to show a back button */
    showBack?: boolean;
    /** Back press handler — defaults to router.back() */
    onBack?: () => void;
}

export const ScreenHeader = memo<ScreenHeaderProps>(({
    title,
    badge,
    rightAction,
    showBack,
    onBack,
}) => {
    const insets = useSafeAreaInsets();
    const t = useAppTheme();

    return (
        <View
            style={[
                styles.container,
                {
                    paddingTop: insets.top + 8,
                    backgroundColor: t.bg,
                    borderBottomColor: t.border,
                },
            ]}
        >
            <View style={styles.content}>
                <View style={styles.leftSection}>
                    {showBack && onBack && (
                        <Pressable
                            onPress={onBack}
                            style={[styles.backBtn, { backgroundColor: t.surfaceMuted }]}
                            hitSlop={8}
                            accessibilityLabel="Go back"
                            accessibilityRole="button"
                        >
                            <Ionicons name="chevron-back" size={20} color={t.text} />
                        </Pressable>
                    )}
                    <Text style={[styles.title, { color: t.text }]} numberOfLines={1}>
                        {title}
                    </Text>
                    {badge !== undefined && badge > 0 && (
                        <View style={[styles.badge, { backgroundColor: t.primaryMuted }]}>
                            <Text style={[styles.badgeText, { color: t.primary }]}>
                                {badge}
                            </Text>
                        </View>
                    )}
                </View>
                {rightAction && <View style={styles.rightSection}>{rightAction}</View>}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        zIndex: 10,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingBottom: 12,
        minHeight: 48,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: radii.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: typography.display.fontSize,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: radii.full,
        minWidth: 24,
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    rightSection: {
        alignItems: 'flex-end',
        marginLeft: spacing.sm,
    },
});
