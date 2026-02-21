/**
 * TabBar — Unified Theme Redesign
 *
 * Key changes:
 * - Consistent 24px icon size for all tabs
 * - Unified active (#3B82F6) / inactive (#6B7280) colors
 * - Raised center scan button (Instagram/TikTok style)
 * - Subtle pill background behind active tab
 * - No labels — icon-only for cleaner look
 */

import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, useAppTheme } from '../../theme/theme';

type Route = {
    key: string;
    name: string;
    params?: object;
};

const ICON_SIZE = 22;
const SCAN_BUTTON_SIZE = 52;
const ACTIVE_COLOR = '#3B82F6';
const INACTIVE_COLOR = '#6B7280';

const ICON_MAP: Record<string, { active: string; inactive: string }> = {
    index: { active: 'home', inactive: 'home-outline' },
    tags: { active: 'car', inactive: 'car-outline' },
    scan: { active: 'scan', inactive: 'scan-outline' },
    shop: { active: 'cart', inactive: 'cart-outline' },
    profile: { active: 'person', inactive: 'person-outline' },
};

// ─── Tab Item ────────────────────────────────────────────────────────────────

const TabItem = memo(({
    route,
    isFocused,
    onPress,
    onLongPress,
    options,
}: {
    route: Route;
    isFocused: boolean;
    onPress: () => void;
    onLongPress: () => void;
    options: any;
}) => {
    const t = useAppTheme();
    const icons = ICON_MAP[route.name] || { active: 'ellipse', inactive: 'ellipse-outline' };
    const iconName = isFocused ? icons.active : icons.inactive;
    const color = isFocused ? ACTIVE_COLOR : (t.isDark ? INACTIVE_COLOR : '#94A3B8');

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: withSpring(isFocused ? 1.1 : 1, { damping: 15, stiffness: 150 }) }],
    }));

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel || options.title}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
            hitSlop={8}
        >
            <Animated.View style={[styles.tabIconWrap, animStyle]}>
                {/* Active pill background */}
                {isFocused && (
                    <View style={[styles.activePill, { backgroundColor: ACTIVE_COLOR + '18' }]} />
                )}
                <Ionicons name={iconName as any} size={ICON_SIZE} color={color} />
            </Animated.View>
        </Pressable>
    );
});

// ─── Scan Button (Raised Center) ─────────────────────────────────────────────

const ScanButton = memo(({
    isFocused,
    onPress,
    onLongPress,
}: {
    isFocused: boolean;
    onPress: () => void;
    onLongPress: () => void;
}) => {
    const t = useAppTheme();

    return (
        <Pressable
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.scanBtnOuter}
            accessibilityRole="button"
            accessibilityLabel="Scan a tag"
            hitSlop={8}
        >
            <View style={[styles.scanBtnRing, {
                backgroundColor: t.isDark ? 'rgba(10,14,26,0.92)' : 'rgba(255,255,255,0.95)',
            }]}>
                <LinearGradient
                    colors={isFocused ? ['#2563EB', '#3B82F6'] : ['#3B82F6', '#60A5FA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.scanBtnGradient}
                >
                    <Ionicons name="scan" size={24} color="#FFFFFF" />
                </LinearGradient>
            </View>
        </Pressable>
    );
});

// ─── Main TabBar ──────────────────────────────────────────────────────────────

export const TabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
    const t = useAppTheme();
    const insets = useSafeAreaInsets();

    return (
        <View
            pointerEvents="box-none"
            style={[styles.container, { paddingBottom: insets.bottom || spacing.sm }]}
        >
            <View
                style={[
                    styles.barBg,
                    {
                        backgroundColor: t.isDark ? 'rgba(10,14,26,0.92)' : 'rgba(255,255,255,0.95)',
                        borderColor: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    },
                ]}
            >
                {state.routes.map((route: Route, index: number) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;
                    const isScan = route.name === 'scan';

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });
                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    if (isScan) {
                        return (
                            <ScanButton
                                key={route.key}
                                isFocused={isFocused}
                                onPress={onPress}
                                onLongPress={onLongPress}
                            />
                        );
                    }

                    return (
                        <TabItem
                            key={route.key}
                            route={route}
                            isFocused={isFocused}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            options={options}
                        />
                    );
                })}
            </View>
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing.md,
        backgroundColor: 'transparent',
    },
    barBg: {
        flexDirection: 'row',
        height: 60,
        alignItems: 'center',
        justifyContent: 'space-around',
        borderRadius: 22,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: 'visible',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 48,
    },
    tabIconWrap: {
        width: 44,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activePill: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 18,
    },
    scanBtnOuter: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -24,
    },
    scanBtnRing: {
        width: SCAN_BUTTON_SIZE + 8,
        height: SCAN_BUTTON_SIZE + 8,
        borderRadius: (SCAN_BUTTON_SIZE + 8) / 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanBtnGradient: {
        width: SCAN_BUTTON_SIZE,
        height: SCAN_BUTTON_SIZE,
        borderRadius: SCAN_BUTTON_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
            },
            android: {
                elevation: 6,
            },
        }),
    },
});
