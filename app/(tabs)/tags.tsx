/**
 * TagsScreen — Elite Production UI
 *
 * Design Philosophy:
 * - Apple-like clarity with Stripe-level polish
 * - Motion-first interactions with zero layout jank
 * - Skeleton loaders > spinners (perceived performance)
 * - One-hand reachability: CTAs live at bottom zone
 * - Visual hierarchy: Tag name > status > metadata
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    Pressable,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TagCard } from '../../components/tag/TagCard';
import { useTagStore } from '../../store/tagStore';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_SKELETON_COUNT = 5;

// ─── Skeleton Loader ────────────────────────────────────────────────────────

function SkeletonCard({ theme }: { theme: any }) {
    const shimmer = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, {
                    toValue: 1,
                    duration: 900,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmer, {
                    toValue: 0,
                    duration: 900,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [0.35, 0.7],
    });

    return (
        <Animated.View
            style={[
                styles.skeletonCard,
                {
                    backgroundColor: theme.card ?? theme.surface,
                    opacity,
                    borderColor: theme.border,
                },
            ]}
        >
            <View style={[styles.skeletonCircle, { backgroundColor: theme.textMuted }]} />
            <View style={styles.skeletonLines}>
                <View style={[styles.skeletonLine, { backgroundColor: theme.textMuted, width: '60%' }]} />
                <View style={[styles.skeletonLine, { backgroundColor: theme.textMuted, width: '40%', marginTop: 8 }]} />
            </View>
            <View style={[styles.skeletonBadge, { backgroundColor: theme.textMuted }]} />
        </Animated.View>
    );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ theme, onPress }: { theme: any; onPress: () => void }) {
    const scale = useRef(new Animated.Value(0.92)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scale, {
                toValue: 1,
                tension: 60,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.emptyContainer,
                { opacity: fadeAnim, transform: [{ scale }] },
            ]}
        >
            {/* Icon container with layered ring effect */}
            <View style={styles.emptyIconRing}>
                <View
                    style={[
                        styles.emptyIconInner,
                        { backgroundColor: theme.primary + '18' },
                    ]}
                >
                    <Ionicons
                        name="car-sport-outline"
                        size={40}
                        color={theme.primary}
                    />
                </View>
            </View>

            <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No Tags Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                Register your first vehicle tag to{'\n'}start tracking and managing it.
            </Text>

            {/* Premium CTA button */}
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [
                    styles.emptyButton,
                    { backgroundColor: theme.primary },
                    pressed && styles.emptyButtonPressed,
                ]}
                accessibilityLabel="Register a new tag"
                accessibilityRole="button"
            >
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.emptyButtonText}>Register New Tag</Text>
            </Pressable>
        </Animated.View>
    );
}

// ─── Header Stats Badge ───────────────────────────────────────────────────────

function TagCountBadge({ count, theme }: { count: number; theme: any }) {
    if (count === 0) return null;
    return (
        <View
            style={[
                styles.countBadge,
                { backgroundColor: theme.primary + '18' },
            ]}
        >
            <Text style={[styles.countBadgeText, { color: theme.primary }]}>
                {count} {count === 1 ? 'Tag' : 'Tags'}
            </Text>
        </View>
    );
}

// ─── Add Button ───────────────────────────────────────────────────────────────

function AddButton({ onPress, theme }: { onPress: () => void; theme: any }) {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () =>
        Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, tension: 200 }).start();

    const handlePressOut = () =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start();

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[styles.addButton, { backgroundColor: theme.primary }]}
                accessibilityLabel="Add new tag"
                accessibilityRole="button"
            >
                <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
        </Animated.View>
    );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function TagsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { mode } = useThemeStore();
    const theme = colors[mode === 'dark' ? 'dark' : 'light'];
    const { tags, fetchTags, togglePrivacy, isLoading } = useTagStore();

    // Scroll-driven header opacity
    const scrollY = useRef(new Animated.Value(0)).current;
    const headerElevation = scrollY.interpolate({
        inputRange: [0, 40],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });
    const headerShadowOpacity = scrollY.interpolate({
        inputRange: [0, 40],
        outputRange: [0, mode === 'dark' ? 0.5 : 0.1],
        extrapolate: 'clamp',
    });

    useEffect(() => {
        fetchTags();
    }, []);

    const renderItem = useCallback(
        ({ item, index }: { item: any; index: number }) => {
            return (
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
            );
        },
        [togglePrivacy, router]
    );

    const keyExtractor = useCallback((item: any) => item._id, []);

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: theme.background },
            ]}
        >
            <StatusBar
                barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />

            {/* ── Scroll-reactive Header ── */}
            <Animated.View
                style={[
                    styles.header,
                    {
                        paddingTop: insets.top + 8,
                        backgroundColor: theme.background,
                        borderBottomColor: theme.border,
                        shadowOpacity: headerShadowOpacity as any,
                        elevation: headerElevation as any,
                    },
                ]}
            >
                <View style={styles.headerLeft}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        My Tags
                    </Text>
                    <TagCountBadge count={tags.length} theme={theme} />
                </View>
                <AddButton
                    onPress={() => router.push('/register-tag')}
                    theme={theme}
                />
            </Animated.View>

            {/* ── List ── */}
            {isLoading && tags.length === 0 ? (
                // First-load skeleton
                <View style={styles.skeletonContainer}>
                    {Array.from({ length: CARD_SKELETON_COUNT }).map((_, i) => (
                        <SkeletonCard key={i} theme={theme} />
                    ))}
                </View>
            ) : (
                <Animated.FlatList
                    data={tags}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: insets.bottom + 100 },
                        tags.length === 0 && styles.listContentCentered,
                    ]}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoading}
                            onRefresh={fetchTags}
                            tintColor={theme.primary}
                            colors={[theme.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <EmptyState
                            theme={theme}
                            onPress={() => router.push('/register-tag')}
                        />
                    }
                    // Performance
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

// ─── Fade-in Per List Item ────────────────────────────────────────────────────

function FadeInItem({
    children,
    index,
}: {
    children: React.ReactNode;
    index: number;
}) {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(anim, {
            toValue: 1,
            duration: 320,
            delay: Math.min(index * 60, 300), // cap stagger so it doesn't feel slow
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
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        zIndex: 10,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '700',
        letterSpacing: -0.5,
    },

    // Count badge
    countBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 20,
    },
    countBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.2,
    },

    // Add button
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

    // List
    listContent: {
        padding: spacing.md,
        gap: spacing.sm ?? 12,
    },
    listContentCentered: {
        flexGrow: 1,
        justifyContent: 'center',
    },

    // Skeletons
    skeletonContainer: {
        padding: spacing.md,
        gap: 12,
    },
    skeletonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        gap: 14,
    },
    skeletonCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        opacity: 0.3,
    },
    skeletonLines: {
        flex: 1,
    },
    skeletonLine: {
        height: 12,
        borderRadius: 6,
        opacity: 0.3,
    },
    skeletonBadge: {
        width: 52,
        height: 24,
        borderRadius: 12,
        opacity: 0.3,
    },

    // Empty State
    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal: spacing.lg ?? 24,
        paddingVertical: 48,
    },
    emptyIconRing: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1.5,
        borderColor: 'rgba(150,150,150,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyIconInner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: -0.3,
        marginBottom: 10,
    },
    emptySubtitle: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 32,
        opacity: 0.75,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    emptyButtonPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.97 }],
    },
    emptyButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
});