/**
 * ShopScreen — Unified Theme Redesign
 *
 * Uses ScreenHeader + EmptyState shared components.
 * Distinct empty state from Tags screen — different icon, copy, CTA.
 */

import { Ionicons } from '@expo/vector-icons';
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
    View,
} from 'react-native';
import { EmptyState } from '../../components/shared/EmptyState';
import { ScreenHeader } from '../../components/shared/ScreenHeader';
import { Product, useShopStore } from '../../store/shopStore';
import { palette, radii, spacing, useAppTheme } from '../../theme/theme';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - spacing.md * 3) / 2;

// ─── TouchableScale ──────────────────────────────────────────────────────────

const TouchableScale = memo(({ onPress, children, style }: {
    onPress: () => void;
    children: React.ReactNode;
    style?: any;
}) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
        Animated.spring(scale, {
            toValue: 0.96,
            useNativeDriver: true,
            speed: 20,
            bounciness: 4,
        }).start();
    }, []);

    const handlePressOut = useCallback(() => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 4,
        }).start();
    }, []);

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            style={style}
            accessibilityRole="button"
        >
            <Animated.View style={{ transform: [{ scale }] }}>
                {children}
            </Animated.View>
        </Pressable>
    );
});

// ─── Skeleton Card ────────────────────────────────────────────────────────────

const SkeletonCard = memo(({ isDark }: { isDark: boolean }) => {
    const shimmer = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 0.7, duration: 800, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const bgColor = isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0';

    return (
        <View style={[styles.cardContainer, { backgroundColor: isDark ? '#151E32' : '#FFFFFF' }]}>
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
});

// ─── Product Card ─────────────────────────────────────────────────────────────

const ProductCard = memo(({ item, onAdd, isDark }: {
    item: Product;
    onAdd: (item: Product) => void;
    isDark: boolean;
}) => {
    const getCategoryStyle = useCallback((category: string) => {
        switch (category) {
            case 'car': return { bg: isDark ? '#1e3a8a' : '#dbeafe', color: isDark ? '#bfdbfe' : '#1e40af' };
            case 'bike': return { bg: isDark ? '#14532d' : '#dcfce7', color: isDark ? '#bbf7d0' : '#166534' };
            default: return { bg: isDark ? '#334155' : '#f1f5f9', color: isDark ? '#cbd5e1' : '#334155' };
        }
    }, [isDark]);

    const catStyle = getCategoryStyle(item.category);

    return (
        <View style={[
            styles.cardContainer,
            {
                backgroundColor: isDark ? '#151E32' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                borderWidth: StyleSheet.hairlineWidth,
            }
        ]}>
            <View style={[styles.imageArea, { backgroundColor: isDark ? '#0A0E1A' : '#F8FAFC' }]}>
                <Ionicons
                    name={item.category === 'bike' ? 'bicycle-outline' : 'car-sport-outline'}
                    size={48}
                    color={isDark ? '#334155' : '#CBD5E1'}
                />
            </View>
            <View style={styles.cardContent}>
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
                <Text style={[styles.titleText, { color: isDark ? '#F8FAFC' : '#0F172A' }]} numberOfLines={1}>
                    {item.name}
                </Text>
                <Text style={[styles.descText, { color: isDark ? '#6B7280' : '#94A3B8' }]} numberOfLines={2}>
                    {item.description}
                </Text>
                <View style={styles.cardFooter}>
                    <Text style={[styles.stockText, { color: item.stock > 0 ? palette.emerald : palette.rose }]}>
                        {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </Text>
                    <TouchableScale onPress={() => onAdd(item)}>
                        <View style={[styles.addButton, { backgroundColor: '#3B82F6' }]}>
                            <Ionicons name="add" size={20} color="#FFF" />
                        </View>
                    </TouchableScale>
                </View>
            </View>
        </View>
    );
}, (prev, next) => prev.item._id === next.item._id);

// ─── Cart Badge ───────────────────────────────────────────────────────────────

const CartButton = memo(({ totalItems, badgeScale, onPress }: {
    totalItems: number;
    badgeScale: Animated.Value;
    onPress: () => void;
}) => {
    const t = useAppTheme();

    return (
        <TouchableScale onPress={onPress}>
            <View style={styles.cartIconWrap}>
                <Ionicons name="cart-outline" size={24} color={t.text} />
                {totalItems > 0 && (
                    <Animated.View style={[styles.cartBadge, { transform: [{ scale: badgeScale }] }]}>
                        <Text style={styles.cartBadgeText}>
                            {totalItems > 99 ? '99+' : totalItems}
                        </Text>
                    </Animated.View>
                )}
            </View>
        </TouchableScale>
    );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ShopScreen() {
    const router = useRouter();
    const t = useAppTheme();
    const { products, fetchProducts, addToCart, cart, isLoading } = useShopStore();

    const badgeScale = useRef(new Animated.Value(1)).current;
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const prevItemsRef = useRef(totalItems);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (totalItems > prevItemsRef.current) {
            Animated.sequence([
                Animated.timing(badgeScale, { toValue: 1.3, duration: 150, useNativeDriver: true }),
                Animated.spring(badgeScale, { toValue: 1, friction: 5, useNativeDriver: true }),
            ]).start();
        }
        prevItemsRef.current = totalItems;
    }, [totalItems]);

    const handleAddToCart = useCallback((item: Product) => {
        addToCart(item);
    }, [addToCart]);

    const renderItem = useCallback(({ item }: { item: Product }) => (
        <ProductCard item={item} onAdd={handleAddToCart} isDark={t.isDark} />
    ), [handleAddToCart, t.isDark]);

    const renderEmpty = useCallback(() => {
        if (isLoading) return null;
        return (
            <EmptyState
                icon="storefront-outline"
                iconBg={t.warningMuted}
                iconColor={t.warning}
                title="Shop Coming Soon"
                body="We're stocking up on premium CarCard tags. Check back soon for exclusive products."
                ctaLabel="Notify Me"
                onCta={() => { }}
                secondaryLabel="Refresh"
                onSecondary={fetchProducts}
            />
        );
    }, [isLoading, t, fetchProducts]);

    return (
        <View style={[styles.root, { backgroundColor: t.bg }]}>
            <ScreenHeader
                title="Shop"
                rightAction={
                    <CartButton
                        totalItems={totalItems}
                        badgeScale={badgeScale}
                        onPress={() => { }}
                    />
                }
            />

            <FlatList
                data={isLoading && products.length === 0 ? [] : products}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                numColumns={2}
                contentContainerStyle={[
                    styles.listContent,
                    products.length === 0 && !isLoading && styles.listContentCentered,
                ]}
                columnWrapperStyle={products.length > 0 ? styles.columnWrapper : undefined}
                showsVerticalScrollIndicator={false}
                initialNumToRender={6}
                maxToRenderPerBatch={8}
                windowSize={5}
                removeClippedSubviews={Platform.OS === 'android'}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading && products.length > 0}
                        onRefresh={fetchProducts}
                        tintColor={t.primary}
                    />
                }
                ListFooterComponent={
                    isLoading && products.length === 0 ? (
                        <View style={styles.columnWrapper}>
                            {[1, 2, 3, 4].map((key) => <SkeletonCard key={key} isDark={t.isDark} />)}
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
    listContent: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: 120,
    },
    listContentCentered: {
        flexGrow: 1,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        flexDirection: 'row',
    },
    cardContainer: {
        width: COLUMN_WIDTH,
        borderRadius: radii.lg,
        marginBottom: spacing.md,
        overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
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
        fontWeight: '600',
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartIconWrap: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadge: {
        position: 'absolute',
        top: 2,
        right: 0,
        backgroundColor: palette.rose,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#0A0E1A',
        ...Platform.select({
            ios: { shadowColor: palette.rose, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 3 },
            android: { elevation: 3 },
        }),
    },
    cartBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
