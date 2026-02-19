import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';

type Route = {
    key: string;
    name: string;
    params?: object;
};

export const TabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
    const { mode } = useThemeStore();
    const theme = colors[mode === 'dark' ? 'dark' : 'light'];
    const insets = useSafeAreaInsets();

    const totalWidth = Dimensions.get('window').width;
    const tabWidth = (totalWidth - spacing.lg * 2) / state.routes.length;

    return (
        <View
            pointerEvents="box-none"
            style={[styles.container, { paddingBottom: insets.bottom + spacing.sm }]}
        >
            <BlurView
                intensity={80}
                tint={mode === 'dark' ? 'dark' : 'light'}
                style={[styles.blurView, { borderRadius: borderRadius.xl, borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }]}
            >
                <View style={styles.content}>
                    {state.routes.map((route: Route, index: number) => {
                        const { options } = descriptors[route.key];
                        const isFocused = state.index === index;

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

                        // Icon mapping
                        let iconName: keyof typeof Ionicons.glyphMap = 'home';
                        if (route.name === 'index') iconName = isFocused ? 'home' : 'home-outline';
                        else if (route.name === 'tags') iconName = isFocused ? 'car' : 'car-outline';
                        else if (route.name === 'shop') iconName = isFocused ? 'cart' : 'cart-outline';
                        else if (route.name === 'scan') iconName = isFocused ? 'scan-circle' : 'scan-circle-outline';
                        else if (route.name === 'profile') iconName = isFocused ? 'person' : 'person-outline';

                        const animatedIconStyle = useAnimatedStyle(() => {
                            return {
                                transform: [{ scale: withSpring(isFocused ? 1.2 : 1) }],
                                opacity: withTiming(isFocused ? 1 : 0.6),
                            };
                        });

                        return (
                            <TouchableOpacity
                                key={index}
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                                accessibilityLabel={options.tabBarAccessibilityLabel}
                                testID={options.title} // simplified for now
                                onPress={onPress}
                                onLongPress={onLongPress}
                                style={styles.tabItem}
                            >
                                <Animated.View style={[animatedIconStyle]}>
                                    <Ionicons
                                        name={iconName}
                                        size={24}
                                        color={isFocused ? theme.secondary : theme.text} // Neon accent for active
                                    />
                                </Animated.View>
                                {isFocused && (
                                    <Animated.View style={[styles.activeDot, { backgroundColor: theme.secondary }]} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing.lg,
        backgroundColor: 'transparent',
    },
    blurView: {
        overflow: 'hidden',
        backgroundColor: 'rgba(10, 14, 26, 0.8)', // Semi-transparent background
    },
    content: {
        flexDirection: 'row',
        height: 64,
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 4,
    },
});
