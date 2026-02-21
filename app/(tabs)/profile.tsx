/**
 * ProfileScreen — Complete Redesign
 *
 * From nearly empty (2 floating buttons) to a full settings screen with:
 * - User avatar/initials + name + phone
 * - Grouped settings sections (Account, Preferences, Support, Legal)
 * - Theme toggle row
 * - Destructive logout at bottom with confirmation
 * - Version number footer
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { memo, useCallback } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/shared/ScreenHeader';
import { SettingsRow, SettingsSection } from '../../components/shared/SettingsRow';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { palette, radii, spacing, useAppTheme } from '../../theme/theme';

// ─── Avatar ───────────────────────────────────────────────────────────────────

const UserAvatar = memo(({ name, phone }: { name?: string; phone?: string }) => {
    const t = useAppTheme();
    const initials = name
        ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : phone
            ? phone.slice(-2)
            : '?';

    return (
        <View style={styles.avatarSection}>
            <View style={[styles.avatarCircle, { backgroundColor: t.primary }]}>
                <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={[styles.userName, { color: t.text }]}>
                {name || 'Driver'}
            </Text>
            <Text style={[styles.userPhone, { color: t.textSecondary }]}>
                {phone || 'No phone number'}
            </Text>
        </View>
    );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const t = useAppTheme();
    const { mode, toggleMode } = useThemeStore();
    const { user, logout } = useAuthStore();

    const handleLogout = useCallback(() => {
        Alert.alert(
            'Logout',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => {
                        logout();
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
    }, [logout, router]);

    return (
        <View style={[styles.container, { backgroundColor: t.bg }]}>
            <StatusBar
                barStyle={t.isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />

            <ScreenHeader title="Profile" />

            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + 120 },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* User Avatar */}
                <UserAvatar name={user?.name} phone={user?.phoneNumber} />

                {/* Account Section */}
                <SettingsSection title="Account">
                    <SettingsRow
                        icon="person-outline"
                        iconColor="#3B82F6"
                        iconBg={t.primaryMuted}
                        label="Edit Profile"
                        onPress={() => { }}
                    />
                    <SettingsRow
                        icon="shield-checkmark-outline"
                        iconColor={palette.emerald}
                        iconBg={t.successMuted}
                        label="Privacy & Security"
                        onPress={() => { }}
                    />
                    {user?.role === 'admin' && (
                        <SettingsRow
                            icon="shield-outline"
                            iconColor={palette.amber}
                            iconBg={t.warningMuted}
                            label="Admin Dashboard"
                            onPress={() => router.push('/admin/dashboard' as any)}
                            showSeparator={false}
                        />
                    )}
                    {!user?.role || user.role !== 'admin' ? (
                        <SettingsRow
                            icon="notifications-outline"
                            iconColor={palette.amber}
                            iconBg={t.warningMuted}
                            label="Notifications"
                            onPress={() => { }}
                            showSeparator={false}
                        />
                    ) : null}
                </SettingsSection>

                {/* Preferences Section */}
                <SettingsSection title="Preferences">
                    <SettingsRow
                        icon={mode === 'dark' ? 'moon-outline' : 'sunny-outline'}
                        iconColor="#A78BFA"
                        iconBg="rgba(167,139,250,0.12)"
                        label="Dark Mode"
                        toggleValue={mode === 'dark'}
                        onToggle={toggleMode}
                        showSeparator={false}
                    />
                </SettingsSection>

                {/* Support Section */}
                <SettingsSection title="Support">
                    <SettingsRow
                        icon="help-circle-outline"
                        iconColor="#06B6D4"
                        iconBg="rgba(6,182,212,0.12)"
                        label="Help Center"
                        onPress={() => { }}
                    />
                    <SettingsRow
                        icon="chatbubble-ellipses-outline"
                        iconColor="#8B5CF6"
                        iconBg="rgba(139,92,246,0.12)"
                        label="Contact Us"
                        onPress={() => { }}
                    />
                    <SettingsRow
                        icon="star-outline"
                        iconColor="#F59E0B"
                        iconBg="rgba(245,158,11,0.12)"
                        label="Rate the App"
                        onPress={() => { }}
                        showSeparator={false}
                    />
                </SettingsSection>

                {/* Legal Section */}
                <SettingsSection title="Legal">
                    <SettingsRow
                        icon="document-text-outline"
                        iconColor={palette.grey500}
                        iconBg={t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                        label="Terms of Service"
                        onPress={() => { }}
                    />
                    <SettingsRow
                        icon="lock-closed-outline"
                        iconColor={palette.grey500}
                        iconBg={t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                        label="Privacy Policy"
                        onPress={() => { }}
                        showSeparator={false}
                    />
                </SettingsSection>

                {/* Logout */}
                <Pressable
                    onPress={handleLogout}
                    style={({ pressed }) => [
                        styles.logoutBtn,
                        { borderColor: t.dangerMuted, opacity: pressed ? 0.7 : 1 },
                    ]}
                    accessibilityLabel="Logout"
                    accessibilityRole="button"
                >
                    <Ionicons name="log-out-outline" size={18} color={t.danger} />
                    <Text style={[styles.logoutText, { color: t.danger }]}>
                        Logout
                    </Text>
                </Pressable>

                {/* Version */}
                <Text style={[styles.version, { color: t.textTertiary }]}>
                    CarCard v1.0.0
                </Text>
            </ScrollView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.lg,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm + 4,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '700',
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: -0.3,
        marginBottom: 4,
    },
    userPhone: {
        fontSize: 14,
        fontWeight: '500',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: radii.md,
        borderWidth: 1.5,
        minHeight: 48,
        marginTop: spacing.sm,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '600',
    },
    version: {
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '500',
        marginTop: spacing.xl,
    },
});
