import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Platform,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Product, useShopStore } from '../../store/shopStore';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';

// ─── Constants & Tokens ───────────────────────────────────────────────────────
const { width } = Dimensions.get('window');
const SPACING = 16;
// Calculate column width for exactly 2 columns with spacing
const COLUMN_WIDTH = (width - SPACING * 3) / 2;

// Premium color palette overlay for backgrounds
const PALETTE = {
    blue: '#3B82F6',
    blueLight: '#EFF6FF',
    textMuted: '#94A3B8',
    surfaceDark: '#1E293B',
};

// ─── UX Components ────────────────────────────────────────────────────────────

/** 
 * TouchableScale: Premium Apple-like shrink-on-press interaction.
 * Reduces cognitive load by giving immediate, satisfying physical feedback.
 */
function TouchableScale({ onPress, children, style }: any) {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.96,
            useNativeDriver: true,
            speed: 20,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 4,
        }).start();
    };

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            style={style}
        >
            <Animated.View style={{ transform: [{ scale }] }}>
                {children}
            </Animated.View>
        </Pressable>
    );
}

/**
 * Skeleton Loader: Smooth shimmering placeholder for loading states.
 * Prevents layout shift and feels faster than a spinning wheel.
 */
function SkeletonCard({ isDark }: { isDark: boolean }) {
    const shimmer = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 0.7, duration: 800, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const bgColor = isDark ? '#334155' : '#E2E8F0';

    return (
        <View style={[styles.cardContainer, { backgroundColor: isDark ? PALETTE.surfaceDark : '#FFFFFF' }]}>
            <Animated.View style={[styles.skeletonImage, { backgroundColor: bgColor, opacity: shimmer }]} />
            <View style={{ padding: 12, gap: 8 }}>
                <Animated.View style={{ height: 16, width: '80%', backgroundColor: bgColor, borderRadius: 4, opacity: shimmer }} />
                <Animated.View style={{ height: 12, width: '60%', backgroundColor: bgColor, borderRadius: 4, opacity: shimmer }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                    <Animated.View style={{ height: 24, width: '40%', backgroundColor: bgColor, borderRadius: 12, opacity: shimmer }} />
                    <Animated.View style={{ height: 28, width: 28, backgroundColor: bgColor, borderRadius: 14, opacity: shimmer }} />
                </View>
            </View>
        </View>
    );
}

/**
 * Animated Add Button: Provides micro-interaction feedback when adding to cart.
 */
function AddButton({ onPress, isDark }: { onPress: () => void, isDark: boolean }) {
    return (
        <TouchableScale onPress={onPress}>
            <View style={[styles.addButton, { backgroundColor: isDark ? '#3B82F6' : '#2563EB' }]}>
                <Ionicons name="add" size={20} color="#FFF" />
            </View>
        </TouchableScale>
    );
}

// ─── Product Card (Memoized for FlatList performance) ─────────────────────────

const ProductCard = memo(({ item, onAdd, isDark }: { item: Product; onAdd: (item: Product) => void; isDark: boolean }) => {
    // Determine category styling
    const getCategoryStyle = (category: string) => {
        switch (category) {
            case 'car': return { bg: isDark ? '#1e3a8a' : '#dbeafe', color: isDark ? '#bfdbfe' : '#1e40af' };
            case 'bike': return { bg: isDark ? '#14532d' : '#dcfce7', color: isDark ? '#bbf7d0' : '#166534' };
            default: return { bg: isDark ? '#475569' : '#f1f5f9', color: isDark ? '#cbd5e1' : '#334155' };
        }
    };

    const catStyle = getCategoryStyle(item.category);

    return (
        <View style={[
            styles.cardContainer,
            {
                backgroundColor: isDark ? PALETTE.surfaceDark : '#FFFFFF',
                shadowColor: isDark ? '#000' : '#94A3B8',
            }
        ]}>
            {/* Image Area - Subtle gradient/color replacement for premium feel */}
            <View style={[styles.imageArea, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
                <Ionicons
                    name={item.category === 'bike' ? 'bicycle-outline' : 'car-sport-outline'}
                    size={48}
                    color={isDark ? '#475569' : '#CBD5E1'}
                />
            </View>

            {/* Content Area */}
            <View style={styles.cardContent}>
                {/* Header Row: Category Pill & Price */}
                <View style={styles.cardHeader}>
                    <View style={[styles.categoryPill, { backgroundColor: catStyle.bg }]}>
                        <Text style={[styles.categoryText, { color: catStyle.color }]}>
                            {item.category.toUpperCase()}
                        </Text>
                    </View>
                    <Text style={[styles.priceText, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                        ₹{item.price}
                    </Text>
                </View>

                {/* Title & Description */}
                <Text style={[styles.titleText, { color: isDark ? '#F8FAFC' : '#0F172A' }]} numberOfLines={1}>
                    {item.name}
                </Text>
                <Text style={styles.descText} numberOfLines={2}>
                    {item.description}
                </Text>

                {/* Footer Action */}
                <View style={styles.cardFooter}>
                    <Text style={styles.stockText}>
                        {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </Text>
                    <AddButton onPress={() => onAdd(item)} isDark={isDark} />
                </View>
            </View>
        </View>
    );
}, (prev, next) => prev.item._id === next.item._id);

// ─── Main Shop Screen ─────────────────────────────────────────────────────────

export default function ShopScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { mode } = useThemeStore();
    const isDark = mode === 'dark';
    const theme = colors[isDark ? 'dark' : 'light'];

    const { products, fetchProducts, addToCart, cart, isLoading } = useShopStore();

    // Badge Animation Refs
    const badgeScale = useRef(new Animated.Value(1)).current;
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const prevItemsRef = useRef(totalItems);

    useEffect(() => {
        fetchProducts();
    }, []);

    // Animate badge when items are added
    useEffect(() => {
        if (totalItems > prevItemsRef.current) {
            Animated.sequence([
                Animated.timing(badgeScale, { toValue: 1.3, duration: 150, useNativeDriver: true }),
                Animated.spring(badgeScale, { toValue: 1, friction: 5, useNativeDriver: true })
            ]).start();
        }
        prevItemsRef.current = totalItems;
    }, [totalItems]);

    // Use callback for renderItem to maintain reference across re-renders
    const handleAddToCart = useCallback((item: Product) => {
        addToCart(item);
    }, [addToCart]);

    const renderItem = useCallback(({ item }: { item: Product }) => (
        <ProductCard item={item} onAdd={handleAddToCart} isDark={isDark} />
    ), [handleAddToCart, isDark]);

    const renderEmpty = () => {
        if (isLoading) return null; // Handled by skeletons
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="basket-outline" size={64} color={PALETTE.textMuted} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No products found</Text>
                <Text style={[styles.emptyDesc, { color: theme.textMuted }]}>Check back later for new inventory.</Text>
            </View>
        );
    };

    return (
        <View style={[styles.root, { backgroundColor: isDark ? '#0B0F19' : '#F1F5F9' }]}>
            {/* ── Premium Glassmorphism Header ── */}
            <View style={[styles.headerWrap, { paddingTop: insets.top }]}>
                {Platform.OS === 'ios' ? (
                    <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.98)' }]} />
                )}

                <View style={styles.headerContent}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>CarCard Shop</Text>

                    <TouchableScale onPress={() => { /* Navigate to Cart */ }}>
                        <View style={styles.cartIconWrap}>
                            <Ionicons name="cart-outline" size={26} color={theme.text} />
                            {totalItems > 0 && (
                                <Animated.View style={[styles.badge, { transform: [{ scale: badgeScale }] }]}>
                                    <Text style={styles.badgeText}>{totalItems > 99 ? '99+' : totalItems}</Text>
                                </Animated.View>
                            )}
                        </View>
                    </TouchableScale>
                </View>
            </View>

            {/* ── Product Grid ── */}
            <FlatList
                data={isLoading && products.length === 0 ? [] : products}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                numColumns={2}
                contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 60 }]}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
                // Performance optimizations
                initialNumToRender={6}
                maxToRenderPerBatch={8}
                windowSize={5}
                removeClippedSubviews={Platform.OS === 'android'}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading && products.length > 0}
                        onRefresh={fetchProducts}
                        tintColor={PALETTE.blue}
                    />
                }
                ListFooterComponent={
                    isLoading && products.length === 0 ? (
                        // Initial Skeleton Loading State
                        <View style={styles.columnWrapper}>
                            {[1, 2, 3, 4, 5, 6].map((key) => <SkeletonCard key={key} isDark={isDark} />)}
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    // Header
    headerWrap: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(148, 163, 184, 0.2)',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING,
        paddingBottom: 12,
        height: 60, // Fixed height for content below notch
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    cartIconWrap: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: -4,
        backgroundColor: '#EF4444',
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#FFF', // Will be dynamic in a deeper dark mode setup, but white looks crisp as a border usually
        ...Platform.select({
            ios: { shadowColor: '#EF4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 3 },
            android: { elevation: 3 },
        }),
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },

    // List
    listContent: {
        paddingHorizontal: SPACING,
        paddingBottom: 100, // Room for bottom nav
    },
    columnWrapper: {
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        flexDirection: 'row',
    },

    // Card (Products & Skeletons)
    cardContainer: {
        width: COLUMN_WIDTH,
        borderRadius: 16,
        marginBottom: SPACING,
        overflow: 'hidden',
        ...Platform.select({
            ios: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
            android: { elevation: 3 },
        }),
    },
    skeletonImage: {
        height: 120,
        width: '100%',
    },
    imageArea: {
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        padding: 12,
        gap: 6,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryPill: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    categoryText: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    priceText: {
        fontSize: 14,
        fontWeight: '800',
    },
    titleText: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: -0.2,
        marginTop: 4,
    },
    descText: {
        fontSize: 11,
        color: PALETTE.textMuted,
        lineHeight: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    stockText: {
        fontSize: 10,
        color: '#10B981',
        fontWeight: '600',
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Empty State
    emptyContainer: {
        flex: 1,
        paddingTop: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
    },
    emptyDesc: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        maxWidth: '80%',
    },
});
