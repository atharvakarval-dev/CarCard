/**
 * TagDetailScreen — Elite Redesign
 *
 * Design Direction: "Refined Control Center"
 * Inspired by Apple Settings depth + Linear's information density + Stripe's trust signals.
 *
 * Key Principles:
 *  - Hero header doubles as an identity card — plate number is the star
 *  - Privacy toggles grouped in a single glass panel with clear on/off affordance
 *  - Document rows feel like Files app — clean, scannable, tap-friendly
 *  - Scan history uses a timeline motif — chronological clarity at a glance
 *  - Owner actions use a destructive-last pattern (edit → download → deactivate)
 *  - Spring physics on all interactions; haptic feedback tiered by consequence
 *  - Zero layout shift: all states sized identically
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';
import {
    Animated,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useTagStore } from '../../store/tagStore';
import { useAppTheme } from '../../theme/theme';

// ─── Design Tokens ────────────────────────────────────────────────────────────

interface Palette {
    bg: readonly string[];
    surface: string;
    surfaceBorder: string;
    surfaceSolid: string;
    text: string;
    subtext: string;
    muted: string;
    primary: string;
    primaryBg: string;
    success: string;
    successBg: string;
    danger: string;
    dangerBg: string;
    dangerText: string;
    warning: string;
    warningBg: string;
    divider: string;
    border: string;
    switchTrackOff: string;
    plate: string;
    plateBorder: string;
    plateText: string;
    iconRing: string;
    scanDot: string;
    scanLine: string;
    callGrad: readonly string[];
    headerGrad: readonly string[];
}

const PALETTE: Record<'light' | 'dark', Palette> = {
    light: {
        bg: ['#F0F4FF', '#EBF0FF', '#F5F2FF'],
        surface: 'rgba(255,255,255,0.72)',
        surfaceBorder: 'rgba(255,255,255,0.9)',
        surfaceSolid: '#FFFFFF',
        text: '#0D1117',
        subtext: '#6B7280',
        muted: '#9CA3AF',
        primary: '#4F6EF7',
        primaryBg: 'rgba(79,110,247,0.10)',
        success: '#10B981',
        successBg: 'rgba(16,185,129,0.10)',
        danger: '#EF4444',
        dangerBg: 'rgba(239,68,68,0.08)',
        dangerText: '#DC2626',
        warning: '#F59E0B',
        warningBg: 'rgba(245,158,11,0.10)',
        divider: 'rgba(0,0,0,0.06)',
        border: 'rgba(0,0,0,0.08)',
        switchTrackOff: '#D1D5DB',
        plate: '#FFFBEB',
        plateBorder: '#D97706',
        plateText: '#1C1917',
        iconRing: 'rgba(79,110,247,0.10)',
        scanDot: '#4F6EF7',
        scanLine: 'rgba(79,110,247,0.15)',
        callGrad: ['#4F6EF7', '#6C3EF5'],
        headerGrad: ['rgba(79,110,247,0.08)', 'rgba(79,110,247,0.00)'],
    },
    dark: {
        bg: ['#080C1A', '#0D1230', '#0A0C1E'],
        surface: 'rgba(255,255,255,0.05)',
        surfaceBorder: 'rgba(255,255,255,0.09)',
        surfaceSolid: '#111827',
        text: '#F1F5F9',
        subtext: '#94A3B8',
        muted: '#64748B',
        primary: '#6C8EFF',
        primaryBg: 'rgba(108,142,255,0.12)',
        success: '#34D399',
        successBg: 'rgba(52,211,153,0.12)',
        danger: '#F87171',
        dangerBg: 'rgba(248,113,113,0.10)',
        dangerText: '#FCA5A5',
        warning: '#FCD34D',
        warningBg: 'rgba(252,211,77,0.10)',
        divider: 'rgba(255,255,255,0.06)',
        border: 'rgba(255,255,255,0.08)',
        switchTrackOff: '#374151',
        plate: '#1C1400',
        plateBorder: '#F59E0B',
        plateText: '#FDE68A',
        iconRing: 'rgba(108,142,255,0.12)',
        scanDot: '#6C8EFF',
        scanLine: 'rgba(108,142,255,0.15)',
        callGrad: ['#4F6EF7', '#7C3AED'],
        headerGrad: ['rgba(108,142,255,0.10)', 'rgba(108,142,255,0.00)'],
    },
};

// ─── Animated Press Wrapper ────────────────────────────────────────────────────

function PressScale({
    children,
    onPress,
    disabled,
    haptic = 'light',
    style,
    accessibilityLabel,
    accessibilityRole,
}: {
    children: React.ReactNode;
    onPress?: () => void;
    disabled?: boolean;
    haptic?: 'light' | 'medium' | 'heavy' | 'none';
    style?: any;
    accessibilityLabel?: string;
    accessibilityRole?: any;
}) {
    const scale = useRef(new Animated.Value(1)).current;

    const pressIn = () => {
        if (haptic !== 'none') {
            Haptics.impactAsync(
                haptic === 'heavy'
                    ? Haptics.ImpactFeedbackStyle.Heavy
                    : haptic === 'medium'
                        ? Haptics.ImpactFeedbackStyle.Medium
                        : Haptics.ImpactFeedbackStyle.Light
            );
        }
        Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
    };

    const pressOut = () => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
    };

    return (
        <Animated.View style={[{ transform: [{ scale }] }, style]}>
            <Pressable
                onPress={disabled ? undefined : onPress}
                onPressIn={disabled ? undefined : pressIn}
                onPressOut={disabled ? undefined : pressOut}
                disabled={disabled}
                accessibilityLabel={accessibilityLabel}
                accessibilityRole={accessibilityRole}
                style={{ opacity: disabled ? 0.4 : 1 }}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
}

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ label, colors: c }: { label: string; colors: Palette }) {
    return (
        <Text style={[sh.label, { color: c.muted }]}>{label.toUpperCase()}</Text>
    );
}
const sh = StyleSheet.create({
    label: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.1,
        marginBottom: 8,
        marginTop: 28,
        paddingHorizontal: 2,
    },
});

// ─── Glass Container ───────────────────────────────────────────────────────────

function GlassCard({
    children,
    colors: c,
    style,
}: {
    children: React.ReactNode;
    colors: Palette;
    style?: any;
}) {
    const isDark = c.bg[0].toLowerCase() === '#080c1a';

    if (Platform.OS === 'ios') {
        return (
            <BlurView
                intensity={isDark ? 18 : 50}
                tint={isDark ? 'dark' : 'light'}
                style={[gc.card, { borderColor: c.surfaceBorder }, style]}
            >
                {children}
            </BlurView>
        );
    }

    return (
        <View style={[gc.card, { backgroundColor: c.surface, borderColor: c.surfaceBorder }, style]}>
            {children}
        </View>
    );
}

const gc = StyleSheet.create({
    card: {
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.07,
        shadowRadius: 16,
        elevation: 4,
    },
});

// ─── Toggle Row ────────────────────────────────────────────────────────────────

function ToggleRow({
    label,
    description,
    icon,
    value,
    onChange,
    isLast,
    colors: c,
}: {
    label: string;
    description: string;
    icon: string;
    value: boolean;
    onChange: () => void;
    isLast?: boolean;
    colors: Palette;
}) {
    return (
        <View>
            <View style={tr.row}>
                <View style={[tr.iconBox, { backgroundColor: value ? c.primaryBg : c.divider }]}>
                    <Ionicons
                        name={icon as any}
                        size={18}
                        color={value ? c.primary : c.muted}
                    />
                </View>
                <View style={tr.textCol}>
                    <Text style={[tr.label, { color: c.text }]}>{label}</Text>
                    <Text style={[tr.desc, { color: c.muted }]}>{description}</Text>
                </View>
                <Switch
                    value={value}
                    onValueChange={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onChange();
                    }}
                    trackColor={{ false: c.switchTrackOff, true: c.primary + 'CC' }}
                    thumbColor={Platform.OS === 'android' ? (value ? c.primary : '#FFF') : undefined}
                    ios_backgroundColor={c.switchTrackOff}
                    accessibilityRole="switch"
                    accessibilityLabel={label}
                    accessibilityState={{ checked: value }}
                />
            </View>
            {!isLast && <View style={[tr.divider, { backgroundColor: c.divider }]} />}
        </View>
    );
}

const tr = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 18,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    textCol: {
        flex: 1,
        paddingRight: 8,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: -0.2,
    },
    desc: {
        fontSize: 12,
        marginTop: 2,
        lineHeight: 16,
    },
    divider: {
        height: 1,
        marginLeft: 68,
    },
});

// ─── Document Row ──────────────────────────────────────────────────────────────

function DocRow({
    icon,
    label,
    status,
    isLast,
    onPress,
    colors: c,
}: {
    icon: string;
    label: string;
    status?: 'uploaded' | 'missing';
    isLast?: boolean;
    onPress: () => void;
    colors: Palette;
}) {
    const isUploaded = status === 'uploaded';

    return (
        <View>
            <PressScale onPress={onPress} haptic="light" accessibilityRole="button" accessibilityLabel={label}>
                <View style={dr.row}>
                    <View style={[dr.iconBox, { backgroundColor: c.primaryBg }]}>
                        <Ionicons name={icon as any} size={18} color={c.primary} />
                    </View>
                    <View style={dr.textCol}>
                        <Text style={[dr.label, { color: c.text }]}>{label}</Text>
                        <Text style={[dr.status, { color: isUploaded ? c.success : c.warning }]}>
                            {isUploaded ? 'Document uploaded' : 'Tap to upload'}
                        </Text>
                    </View>
                    <Ionicons
                        name={isUploaded ? 'checkmark-circle' : 'cloud-upload-outline'}
                        size={20}
                        color={isUploaded ? c.success : c.muted}
                    />
                </View>
            </PressScale>
            {!isLast && <View style={[dr.divider, { backgroundColor: c.divider }]} />}
        </View>
    );
}

const dr = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 18,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    textCol: { flex: 1, paddingRight: 8 },
    label: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
    status: { fontSize: 12, marginTop: 2 },
    divider: { height: 1, marginLeft: 68 },
});

// ─── Scan Event Row ────────────────────────────────────────────────────────────

function ScanRow({
    scan,
    isLast,
    colors: c,
}: {
    scan: { location: string; timestamp: string };
    isLast: boolean;
    colors: Palette;
}) {
    const date = new Date(scan.timestamp);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <View style={sr.wrapper}>
            {/* Timeline */}
            <View style={sr.timeline}>
                <View style={[sr.dot, { backgroundColor: c.scanDot }]} />
                {!isLast && <View style={[sr.line, { backgroundColor: c.scanLine }]} />}
            </View>

            {/* Content */}
            <View style={[sr.content, isLast && { marginBottom: 0 }]}>
                <View style={[sr.card, { backgroundColor: c.surfaceSolid, borderColor: c.border }]}>
                    <View style={sr.row}>
                        <Ionicons name="scan-outline" size={15} color={c.primary} style={{ marginRight: 8 }} />
                        <Text style={[sr.location, { color: c.text }]} numberOfLines={1}>
                            {scan.location || 'Unknown location'}
                        </Text>
                    </View>
                    <Text style={[sr.time, { color: c.muted }]}>
                        {dateStr} · {timeStr}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const sr = StyleSheet.create({
    wrapper: {
        flexDirection: 'row',
        marginBottom: 0,
    },
    timeline: {
        width: 24,
        alignItems: 'center',
        paddingTop: 14,
    },
    dot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        zIndex: 1,
    },
    line: {
        width: 2,
        flex: 1,
        marginTop: 4,
        borderRadius: 1,
    },
    content: {
        flex: 1,
        marginLeft: 12,
        marginBottom: 10,
    },
    card: {
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    location: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    time: {
        fontSize: 12,
        marginTop: 4,
    },
});

// ─── CTA Button ───────────────────────────────────────────────────────────────

function CtaButton({
    label,
    icon,
    variant = 'primary',
    onPress,
    colors: c,
}: {
    label: string;
    icon: string;
    variant?: 'primary' | 'outline' | 'danger';
    onPress: () => void;
    colors: Palette;
}) {
    const isPrimary = variant === 'primary';
    const isDanger = variant === 'danger';

    return (
        <PressScale
            onPress={onPress}
            haptic={isDanger ? 'heavy' : 'medium'}
            style={{ marginBottom: 12 }}
            accessibilityRole="button"
            accessibilityLabel={label}
        >
            {isPrimary ? (
                <LinearGradient
                    colors={c.callGrad as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={cb.btn}
                >
                    <Ionicons name={icon as any} size={18} color="#FFF" style={{ marginRight: 10 }} />
                    <Text style={[cb.label, { color: '#FFF' }]}>{label}</Text>
                </LinearGradient>
            ) : (
                <View
                    style={[
                        cb.btn,
                        {
                            backgroundColor: isDanger ? c.dangerBg : 'transparent',
                            borderWidth: 1.5,
                            borderColor: isDanger ? c.danger : c.border,
                        },
                    ]}
                >
                    <Ionicons
                        name={icon as any}
                        size={18}
                        color={isDanger ? c.danger : c.primary}
                        style={{ marginRight: 10 }}
                    />
                    <Text style={[cb.label, { color: isDanger ? c.dangerText : c.primary }]}>
                        {label}
                    </Text>
                </View>
            )}
        </PressScale>
    );
}

const cb = StyleSheet.create({
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 20,
        minHeight: 56,
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function TagDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const t = useAppTheme();
    const c = PALETTE[t.isDark ? 'dark' : 'light'];
    const { tags, togglePrivacy } = useTagStore();
    const { user } = useAuthStore();
    const insets = useSafeAreaInsets();

    const tag = tags.find(t => t._id === id);
    const isOwner =
        tag?.userId === (user as any)?._id || tag?.userId === (user as any)?.id;

    const handleToggle = useCallback(
        (key: string) => {
            if (tag) togglePrivacy(tag._id, key as any);
        },
        [tag, togglePrivacy]
    );

    if (!tag) {
        return (
            <LinearGradient colors={c.bg as any} style={styles.flex}>
                <View style={[styles.centerState, { paddingTop: insets.top }]}>
                    <View style={[styles.stateIcon, { backgroundColor: c.primaryBg }]}>
                        <Ionicons name="qr-code-outline" size={36} color={c.primary} />
                    </View>
                    <Text style={[styles.stateTitle, { color: c.text }]}>Tag Not Found</Text>
                    <Text style={[styles.stateSub, { color: c.subtext }]}>
                        This tag may have been removed or the link is invalid.
                    </Text>
                    <PressScale onPress={() => router.back()} haptic="light" style={{ marginTop: 24 }}>
                        <View style={[styles.ghostBtn, { borderColor: c.border }]}>
                            <Text style={{ color: c.primary, fontSize: 15, fontWeight: '600' }}>Go Back</Text>
                        </View>
                    </PressScale>
                </View>
            </LinearGradient>
        );
    }

    const vehicleIcon = tag.type === 'car' ? 'car-sport' : 'bicycle';

    return (
        <LinearGradient colors={c.bg as any} style={styles.flex}>
            {/* ── Nav bar ── */}
            <View style={[styles.navbar, { paddingTop: insets.top + 8 }]}>
                <PressScale onPress={() => router.back()} haptic="light" accessibilityRole="button" accessibilityLabel="Go back">
                    <View style={[styles.backBtn, { backgroundColor: c.surface, borderColor: c.surfaceBorder }]}>
                        <Ionicons name="chevron-back" size={20} color={c.text} />
                    </View>
                </PressScale>
                <Text style={[styles.navTitle, { color: c.text }]}>Tag Details</Text>
                <View style={styles.backBtn} />
            </View>

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 48 }]}
                showsVerticalScrollIndicator={false}
                bounces
            >
                {/* ── Hero Card ── */}
                <LinearGradient
                    colors={c.headerGrad as any}
                    style={[styles.heroCard, { borderColor: c.surfaceBorder }]}
                >
                    {/* Status pill */}
                    <View style={[
                        styles.statusPill,
                        { backgroundColor: tag.isActive ? c.successBg : c.dangerBg }
                    ]}>
                        <View style={[
                            styles.statusDot,
                            { backgroundColor: tag.isActive ? c.success : c.danger }
                        ]} />
                        <Text style={[
                            styles.statusText,
                            { color: tag.isActive ? c.success : c.danger }
                        ]}>
                            {tag.isActive ? 'Active' : 'Disabled'}
                        </Text>
                    </View>

                    {/* Vehicle icon */}
                    <View style={[styles.vehicleIcon, { backgroundColor: c.iconRing }]}>
                        <Ionicons name={vehicleIcon as any} size={40} color={c.primary} />
                    </View>

                    {/* Plate */}
                    <View style={[styles.plate, { backgroundColor: c.plate, borderColor: c.plateBorder }]}>
                        <Text style={[styles.plateText, { color: c.plateText }]}>{tag.plateNumber}</Text>
                    </View>

                    <Text style={[styles.nickname, { color: c.text }]}>{tag.nickname}</Text>
                    <Text style={[styles.tagCode, { color: c.muted }]}>#{tag.code || tag._id?.slice(-8).toUpperCase()}</Text>

                    {/* Stats row */}
                    <View style={[styles.statsRow, { borderTopColor: c.divider }]}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statVal, { color: c.text }]}>{tag.scans?.length ?? 0}</Text>
                            <Text style={[styles.statLabel, { color: c.muted }]}>Total Scans</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: c.divider }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statVal, { color: c.text }]}>
                                {tag.scans?.length
                                    ? new Date(tag.scans[tag.scans.length - 1].timestamp).toLocaleDateString([], {
                                        month: 'short',
                                        day: 'numeric',
                                    })
                                    : '—'}
                            </Text>
                            <Text style={[styles.statLabel, { color: c.muted }]}>Last Scan</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: c.divider }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statVal, { color: tag.isActive ? c.success : c.danger }]}>
                                {tag.isActive ? 'ON' : 'OFF'}
                            </Text>
                            <Text style={[styles.statLabel, { color: c.muted }]}>Status</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* ── Privacy Settings ── */}
                <SectionHeader label="Privacy Controls" colors={c} />
                <GlassCard colors={c}>
                    <ToggleRow
                        icon="call-outline"
                        label="Masked Calls"
                        description="Allow anonymous calls via number masking"
                        value={tag.privacy.allowMaskedCall}
                        onChange={() => handleToggle('allowMaskedCall')}
                        colors={c}
                    />
                    <ToggleRow
                        icon="logo-whatsapp"
                        label="WhatsApp"
                        description="Enable WhatsApp contact from scan page"
                        value={tag.privacy.allowWhatsapp}
                        onChange={() => handleToggle('allowWhatsapp')}
                        colors={c}
                    />
                    <ToggleRow
                        icon="chatbubble-outline"
                        label="SMS"
                        description="Allow SMS from the public scan page"
                        value={tag.privacy.allowSms}
                        onChange={() => handleToggle('allowSms')}
                        colors={c}
                    />
                    <ToggleRow
                        icon="alert-circle-outline"
                        label="Emergency Contact"
                        description="Show emergency contact to scanner"
                        value={tag.privacy.showEmergencyContact}
                        onChange={() => handleToggle('showEmergencyContact')}
                        isLast
                        colors={c}
                    />
                </GlassCard>

                {/* ── Vehicle Documents ── */}
                <SectionHeader label="Vehicle Documents" colors={c} />
                <GlassCard colors={c}>
                    <DocRow
                        icon="document-text-outline"
                        label="RC Book"
                        status="missing"
                        onPress={() => { }}
                        colors={c}
                    />
                    <DocRow
                        icon="shield-checkmark-outline"
                        label="Insurance Policy"
                        status="missing"
                        isLast
                        onPress={() => { }}
                        colors={c}
                    />
                </GlassCard>

                {/* ── Owner Actions ── */}
                {isOwner && (
                    <>
                        <SectionHeader label="Manage Tag" colors={c} />
                        <CtaButton
                            label="Edit Tag Details"
                            icon="create-outline"
                            variant="primary"
                            onPress={() =>
                                router.push({
                                    pathname: '/tag/edit-[id]' as any,
                                    params: { id: tag._id },
                                })
                            }
                            colors={c}
                        />
                        <CtaButton
                            label="Download eTag PDF"
                            icon="download-outline"
                            variant="outline"
                            onPress={() => { }}
                            colors={c}
                        />
                        <CtaButton
                            label="Deactivate Tag"
                            icon="power-outline"
                            variant="danger"
                            onPress={() => { }}
                            colors={c}
                        />
                    </>
                )}

                {/* ── Scan History ── */}
                <SectionHeader label={`Scan History (${tag.scans?.length ?? 0})`} colors={c} />

                {tag.scans?.length > 0 ? (
                    <View style={styles.timeline}>
                        {tag.scans.map((scan: any, index: number) => (
                            <ScanRow
                                key={`${scan.timestamp}-${index}`}
                                scan={scan}
                                isLast={index === tag.scans.length - 1}
                                colors={c}
                            />
                        ))}
                    </View>
                ) : (
                    <View style={[styles.emptyState, { backgroundColor: c.surface, borderColor: c.surfaceBorder }]}>
                        <View style={[styles.emptyIcon, { backgroundColor: c.primaryBg }]}>
                            <Ionicons name="scan-outline" size={28} color={c.primary} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: c.text }]}>No Scans Yet</Text>
                        <Text style={[styles.emptySub, { color: c.muted }]}>
                            When someone scans your tag, each event will appear here.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </LinearGradient>
    );
}

// ─── Global Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    flex: { flex: 1 },

    // Nav
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    navTitle: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.4,
    },

    // Content
    content: {
        paddingHorizontal: 20,
    },

    // Hero
    heroCard: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 24,
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 4,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginBottom: 20,
        gap: 6,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    vehicleIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    plate: {
        borderRadius: 10,
        borderWidth: 2,
        paddingHorizontal: 24,
        paddingVertical: 10,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    plateText: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: 4,
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
        textTransform: 'uppercase',
    },
    nickname: {
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: -0.5,
        marginTop: 4,
    },
    tagCode: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
        letterSpacing: 0.5,
    },
    statsRow: {
        flexDirection: 'row',
        width: '100%',
        borderTopWidth: 1,
        marginTop: 20,
        paddingTop: 20,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statVal: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    statLabel: {
        fontSize: 11,
        marginTop: 3,
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        height: '100%',
    },

    // Timeline
    timeline: {
        paddingLeft: 4,
    },

    // Empty
    emptyState: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 32,
        alignItems: 'center',
    },
    emptyIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.3,
        marginBottom: 8,
    },
    emptySub: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },

    // Center state (not found)
    centerState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 36,
        gap: 10,
    },
    stateIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    stateTitle: {
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    stateSub: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
    },
    ghostBtn: {
        borderWidth: 1.5,
        borderRadius: 14,
        paddingHorizontal: 32,
        paddingVertical: 14,
        alignItems: 'center',
    },
});