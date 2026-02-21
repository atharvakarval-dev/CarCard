/**
 * TagsScreen — Unified Theme Redesign
 *
 * Uses ScreenHeader + EmptyState shared components.
 * Consistent with Home screen's visual language.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useRef } from 'react';
import {
    Animated,
    Platform,
    Pressable,
    RefreshControl,
    StatusBar,
    StyleSheet,
    View
} from 'react-native';
import { EmptyState } from '../../components/shared/EmptyState';
import { ScreenHeader } from '../../components/shared/ScreenHeader';
import { TagCard } from '../../components/tag/TagCard';
import { useTagStore } from '../../store/tagStore';
import { radii, spacing, useAppTheme } from '../../theme/theme';

// ─── Skeleton Loader ────────────────────────────────────────────────────────

const SkeletonCard = memo(({ isDark }: { isDark: boolean }) => {
    const shimmer = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const opacity = shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [0.35, 0.7],
    });

    const bgColor = isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0';

    return (
        <Animated.View
            style={[
                styles.skeletonCard,
                {
                    backgroundColor: isDark ? '#151E32' : '#FFFFFF',
                    opacity,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                },
            ]}
        >
            <View style={[styles.skeletonCircle, { backgroundColor: bgColor }]} />
            <View style={styles.skeletonLines}>
                <View style={[styles.skeletonLine, { backgroundColor: bgColor, width: '60%' }]} />
                <View style={[styles.skeletonLine, { backgroundColor: bgColor, width: '40%', marginTop: 8 }]} />
            </View>
            <View style={[styles.skeletonBadge, { backgroundColor: bgColor }]} />
        </Animated.View>
    );
});

// ─── Add Button ───────────────────────────────────────────────────────────────

const AddButton = memo(({ onPress }: { onPress: () => void }) => {
    const t = useAppTheme();
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
        Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, speed: 50 }).start();
    }, []);

    const handlePressOut = useCallback(() => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
    }, []);

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[styles.addButton, { backgroundColor: t.primary }]}
                accessibilityLabel="Add new tag"
                accessibilityRole="button"
            >
                <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
        </Animated.View>
    );
});

// ─── Fade-in Per List Item ────────────────────────────────────────────────────

const FadeInItem = memo(({
    children,
    index,
}: {
    children: React.ReactNode;
    index: number;
}) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(anim, {
            toValue: 1,
            duration: 320,
            delay: Math.min(index * 60, 300),
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <Animated.View
            style={{
                opacity: anim,
                transform: [
                    {
                        translateY: anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [16, 0],
                        }),
                    },
                ],
            }}
        >
            {children}
        </Animated.View>
    );
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function TagsScreen() {
    const router = useRouter();
    const t = useAppTheme();
    const { tags, fetchTags, togglePrivacy, isLoading } = useTagStore();

    useEffect(() => {
        fetchTags();
    }, []);

    const renderItem = useCallback(
        ({ item, index }: { item: any; index: number }) => (
            <FadeInItem index={index}>
                <TagCard
                    tag={item}
                    onTogglePrivacy={togglePrivacy}
                    onPress={() =>
                        router.push({
                            pathname: '/tag/[id]',
                            params: { id: item._id },
                        })
                    }
                />
            </FadeInItem>
        ),
        [togglePrivacy, router]
    );

    const keyExtractor = useCallback((item: any) => item._id, []);

    return (
        <View style={[styles.container, { backgroundColor: t.bg }]}>
            <StatusBar
                barStyle={t.isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />

            <ScreenHeader
                title="My Tags"
                badge={tags.length > 0 ? tags.length : undefined}
                rightAction={
                    <AddButton onPress={() => router.push('/register-tag')} />
                }
            />

            {isLoading && tags.length === 0 ? (
                <View style={styles.skeletonContainer}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <SkeletonCard key={i} isDark={t.isDark} />
                    ))}
                </View>
            ) : (
                <Animated.FlatList
                    data={tags}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    contentContainerStyle={[
                        styles.listContent,
                        tags.length === 0 && styles.listContentCentered,
                    ]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoading}
                            onRefresh={fetchTags}
                            tintColor={t.primary}
                            colors={[t.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <EmptyState
                            icon="car-sport-outline"
                            iconBg={t.primaryMuted}
                            iconColor={t.primary}
                            title="No Tags Yet"
                            body={"Register your first vehicle tag to\nstart tracking and managing it."}
                            ctaLabel="Register New Tag"
                            onCta={() => router.push('/register-tag')}
                        />
                    }
                    removeClippedSubviews={Platform.OS === 'android'}
                    maxToRenderPerBatch={8}
                    updateCellsBatchingPeriod={30}
                    windowSize={10}
                    initialNumToRender={6}
                />
            )}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    addButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
        elevation: 4,
    },
    listContent: {
        padding: spacing.md,
        gap: spacing.sm,
        paddingBottom: 120,
    },
    listContentCentered: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    skeletonContainer: {
        padding: spacing.md,
        gap: 12,
    },
    skeletonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: radii.lg,
        borderWidth: StyleSheet.hairlineWidth,
        gap: 14,
    },
    skeletonCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    skeletonLines: {
        flex: 1,
    },
    skeletonLine: {
        height: 12,
        borderRadius: 6,
    },
    skeletonBadge: {
        width: 52,
        height: 24,
        borderRadius: 12,
    },
});