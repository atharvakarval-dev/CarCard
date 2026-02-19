import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface HeaderProps {
    title: string;
    showBack?: boolean;
    rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
    title,
    showBack,
    rightAction,
}) => {
    const router = useRouter();
    const { mode } = useThemeStore();
    const theme = colors[mode === 'dark' ? 'dark' : 'light'];
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, {
            backgroundColor: theme.background,
            paddingTop: insets.top,
            borderBottomColor: theme.border,
            borderBottomWidth: 1,
        }]}>
            <View style={styles.content}>
                <View style={styles.left}>
                    {showBack && (
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={theme.text} />
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                    {title}
                </Text>

                <View style={styles.right}>
                    {rightAction}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        // paddingHorizontal: spacing.md, // Applied in content
    },
    content: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
    },
    left: {
        width: 40,
        alignItems: 'flex-start',
    },
    backButton: {
        padding: spacing.xs,
        marginLeft: -spacing.xs,
    },
    title: {
        ...typography.h3,
        flex: 1,
        textAlign: 'center',
        fontWeight: '600',
    },
    right: {
        width: 40,
        alignItems: 'flex-end',
    },
});
