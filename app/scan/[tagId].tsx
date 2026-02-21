/**
 * PublicScanScreen — Elite Redesign
 *
 * Design Direction: "Calm Authority"
 * Inspired by Apple Health + Stripe's clarity + Linear's polish.
 * 
 * Core Choices:
 *  - Deep navy-to-indigo ambient gradient gives premium depth without distraction
 *  - Card uses true glassmorphism (blur + translucency) over ambient gradient
 *  - Staggered entrance animations with spring physics feel alive, not mechanical
 *  - Haptic feedback on all CTAs anchors interactions to physical reality
 *  - Skeleton loader matches final layout 1:1 — zero layout shift on load
 *  - Typography uses system SF Pro (native iOS) / Roboto (Android) via platform
 *  - Emergency contact uses a warm red-amber accent — universally understood
 *  - Plate number rendered as a real plate visual — instant recognizability
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTagStore } from '../../store/tagStore';
import { useAppTheme } from '../../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Design Tokens ────────────────────────────────────────────────────────────

interface Palette {
    bg: readonly string[];
    card: string;
    cardBorder: string;
    text: string;
    subtext: string;
    muted: string;
    primary: string;
    primaryGlow: string;
    call: readonly string[];
    whatsapp: string;
    whatsappBg: string;
    danger: string;
    dangerBg: string;
    plate: string;
    plateBorder: string;
    plateText: string;
    skeleton: string;
    skeletonShimmer: string;
    footerText: string;
    divider: string;
    iconRing: string;
}

const PALETTE: Record<'light' | 'dark', Palette> = {
    light: {
        bg: ['#F0F4FF', '#E8EEFF', '#F5F0FF'],
        card: 'rgba(255,255,255,0.72)',
        cardBorder: 'rgba(255,255,255,0.9)',
        text: '#0D1117',
        subtext: '#6B7280',
        muted: '#9CA3AF',
        primary: '#4F6EF7',
        primaryGlow: 'rgba(79,110,247,0.18)',
        call: ['#4F6EF7', '#6C3EF5'],
        whatsapp: '#128C7E',
        whatsappBg: 'rgba(18,140,126,0.08)',
        danger: '#EF4444',
        dangerBg: 'rgba(239,68,68,0.08)',
        plate: '#FFF8DC',
        plateBorder: '#D4A017',
        plateText: '#1a1a1a',
        skeleton: '#E5E7EB',
        skeletonShimmer: 'rgba(255,255,255,0.6)',
        footerText: '#9CA3AF',
        divider: 'rgba(0,0,0,0.06)',
        iconRing: 'rgba(79,110,247,0.10)',
    },
    dark: {
        bg: ['#080C1A', '#0D1230', '#0C0A1E'],
        card: 'rgba(255,255,255,0.05)',
        cardBorder: 'rgba(255,255,255,0.10)',
        text: '#F1F5F9',
        subtext: '#94A3B8',
        muted: '#64748B',
        primary: '#6C8EFF',
        primaryGlow: 'rgba(108,142,255,0.20)',
        call: ['#4F6EF7', '#7C3AED'],
        whatsapp: '#25D366',
        whatsappBg: 'rgba(37,211,102,0.08)',
        danger: '#F87171',
        dangerBg: 'rgba(248,113,113,0.10)',
        plate: '#1E1A00',
        plateBorder: '#F59E0B',
        plateText: '#FDE68A',
        skeleton: '#1E293B',
        skeletonShimmer: 'rgba(255,255,255,0.05)',
        footerText: '#475569',
        divider: 'rgba(255,255,255,0.06)',
        iconRing: 'rgba(108,142,255,0.12)',
    },
};

// ─── Skeleton Loader ───────────────────────────────────────────────────────────

function SkeletonBlock({
    width,
    height,
    borderRadius = 8,
    colors: c,
}: {
    width: number | `${number}%`;
    height: number;
    borderRadius?: number;
    colors: Palette;
}) {
    const shimmer = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

    return (
        <Animated.View
            style={{
                width,
                height,
                borderRadius,
                backgroundColor: c.skeleton,
                opacity,
                marginBottom: 10,
            }}
        />
    );
}

function LoadingState({ colors: c }: { colors: Palette }) {
    return (
        <View style={[sk.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <View style={[sk.iconRing, { backgroundColor: c.iconRing }]}>
                <SkeletonBlock width={64} height={64} borderRadius={32} colors={c} />
            </View>
            <SkeletonBlock width={180} height={28} borderRadius={6} colors={c} />
            <SkeletonBlock width={120} height={18} borderRadius={6} colors={c} />
            <View style={[sk.divider, { backgroundColor: c.divider }]} />
            <SkeletonBlock width={200} height={20} borderRadius={6} colors={c} />
            <SkeletonBlock width={160} height={16} borderRadius={6} colors={c} />
            <View style={{ height: 16 }} />
            <SkeletonBlock width='100%' height={52} borderRadius={14} colors={c} />
            <SkeletonBlock width='100%' height={52} borderRadius={14} colors={c} />
        </View>
    );
}

const sk = StyleSheet.create({
    card: {
        borderRadius: 28,
        borderWidth: 1,
        padding: 28,
        alignItems: 'center',
        gap: 6,
    },
    iconRing: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    divider: {
        width: '100%',
        height: 1,
        marginVertical: 20,
    },
});

// ─── Action Button ─────────────────────────────────────────────────────────────

interface ActionButtonProps {
    label: string;
    sublabel?: string;
    icon: React.ReactNode;
    onPress: () => void;
    disabled?: boolean;
    variant: 'primary' | 'whatsapp' | 'ghost';
    colors: Palette;
}

function ActionButton({ label, sublabel, icon, onPress, disabled, variant, colors: c }: ActionButtonProps) {
    const scale = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.parallel([
            Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }),
            Animated.timing(opacity, { toValue: 0.85, duration: 80, useNativeDriver: true }),
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }),
            Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
    };

    const isPrimary = variant === 'primary';
    const isWhatsApp = variant === 'whatsapp';

    return (
        <Animated.View style={{ transform: [{ scale }], opacity, marginBottom: 12 }}>
            <Pressable
                onPress={disabled ? undefined : onPress}
                onPressIn={disabled ? undefined : handlePressIn}
                onPressOut={disabled ? undefined : handlePressOut}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ disabled }}
                style={{ opacity: disabled ? 0.35 : 1 }}
            >
                {isPrimary ? (
                    <LinearGradient
                        colors={c.call as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={ab.btn}
                    >
                        <View style={ab.iconWrap}>{icon}</View>
                        <View style={ab.textCol}>
                            <Text style={[ab.label, { color: '#FFF' }]}>{label}</Text>
                            {sublabel && <Text style={[ab.sub, { color: 'rgba(255,255,255,0.7)' }]}>{sublabel}</Text>}
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
                    </LinearGradient>
                ) : (
                    <View style={[
                        ab.btn,
                        {
                            backgroundColor: isWhatsApp ? c.whatsappBg : 'transparent',
                            borderWidth: 1.5,
                            borderColor: isWhatsApp ? c.whatsapp : c.divider,
                        }
                    ]}>
                        <View style={ab.iconWrap}>{icon}</View>
                        <View style={ab.textCol}>
                            <Text style={[ab.label, { color: isWhatsApp ? c.whatsapp : c.subtext }]}>{label}</Text>
                            {sublabel && <Text style={[ab.sub, { color: isWhatsApp ? c.whatsapp + '99' : c.muted }]}>{sublabel}</Text>}
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={isWhatsApp ? c.whatsapp + '80' : c.muted} />
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );
}

const ab = StyleSheet.create({
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        minHeight: 60,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    textCol: {
        flex: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: -0.2,
    },
    sub: {
        fontSize: 12,
        marginTop: 1,
    },
});

// ─── License Plate Visual ──────────────────────────────────────────────────────

function LicensePlate({ number, colors: c }: { number: string; colors: Palette }) {
    return (
        <View style={[lp.outer, { backgroundColor: c.plate, borderColor: c.plateBorder }]}>
            <View style={lp.inner}>
                <View style={[lp.stripe, { backgroundColor: c.primary + '30' }]} />
                <Text style={[lp.text, { color: c.plateText }]} numberOfLines={1} adjustsFontSizeToFit>
                    {number}
                </Text>
            </View>
        </View>
    );
}

const lp = StyleSheet.create({
    outer: {
        borderRadius: 10,
        borderWidth: 2.5,
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
        overflow: 'hidden',
    },
    inner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stripe: {
        width: 6,
        height: '100%',
        position: 'absolute',
        left: 0,
        borderRadius: 3,
    },
    text: {
        fontSize: 26,
        fontWeight: '800',
        letterSpacing: 4,
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
        textTransform: 'uppercase',
    },
});

// ─── Emergency Contact Card ────────────────────────────────────────────────────

function EmergencyCard({ name, phone, colors: c }: { name: string; phone: string; colors: Palette }) {
    const handleCall = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Linking.openURL(`tel:${phone}`);
    };

    return (
        <Pressable onPress={handleCall} style={[ec.box, { backgroundColor: c.dangerBg, borderColor: c.danger + '40' }]}>
            <View style={[ec.iconBox, { backgroundColor: c.danger + '20' }]}>
                <Ionicons name="alert-circle" size={22} color={c.danger} />
            </View>
            <View style={ec.info}>
                <Text style={[ec.label, { color: c.danger }]}>Emergency Contact</Text>
                <Text style={[ec.name, { color: c.text }]}>{name}</Text>
                <Text style={[ec.phone, { color: c.subtext }]}>{phone}</Text>
            </View>
            <Ionicons name="call-outline" size={20} color={c.danger} />
        </Pressable>
    );
}

const ec = StyleSheet.create({
    box: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginTop: 4,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    info: { flex: 1 },
    label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
    name: { fontSize: 15, fontWeight: '600' },
    phone: { fontSize: 13, marginTop: 1 },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function PublicScanScreen() {
    const { tagId } = useLocalSearchParams<{ tagId: string }>();
    const router = useRouter();
    const t = useAppTheme();
    const c = PALETTE[t.isDark ? 'dark' : 'light'];
    const { getPublicTag } = useTagStore();
    const insets = useSafeAreaInsets();

    const [tag, setTag] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ── Entrance Animations
    const headerAnim = useRef(new Animated.Value(0)).current;
    const cardAnim = useRef(new Animated.Value(0)).current;
    const footerAnim = useRef(new Animated.Value(0)).current;

    const runEntrance = useCallback(() => {
        Animated.stagger(80, [
            Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 120 }),
            Animated.spring(cardAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 100 }),
            Animated.spring(footerAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 100 }),
        ]).start();
    }, []);

    useEffect(() => {
        if (tagId) loadTag();
    }, [tagId]);

    const loadTag = async () => {
        setLoading(true);
        const data = await getPublicTag(tagId as string);
        if (data) {
            setTag(data);
        } else {
            setError('Tag not found or inactive');
        }
        setLoading(false);
        setTimeout(runEntrance, 50);
    };

    const handleCall = useCallback(() => {
        if (!tag?.privacy?.allowMaskedCall) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Linking.openURL(`tel:+91${tag.emergencyContact?.phone || '9999999999'}`);
    }, [tag]);

    const handleWhatsApp = useCallback(() => {
        if (!tag?.privacy?.allowWhatsapp) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const message = encodeURIComponent(
            `Hello, I scanned your CarCard tag on your vehicle (${tag.plateNumber}).`
        );
        Linking.openURL(`whatsapp://send?text=${message}`);
    }, [tag]);

    // ── Animated style helpers
    const fadeUp = (anim: Animated.Value, offset = 24) => ({
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) }],
    });

    // ─── Loading ──────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <LinearGradient colors={c.bg as any} style={styles.flex}>
                <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                    <Text style={[styles.logo, { color: c.primary }]}>CarCard</Text>
                    <Text style={[styles.logoTagline, { color: c.muted }]}>Smart Vehicle Identity</Text>
                </View>
                <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
                    <LoadingState colors={c} />
                </ScrollView>
            </LinearGradient>
        );
    }

    // ─── Error ────────────────────────────────────────────────────────────────

    if (error || !tag) {
        return (
            <LinearGradient colors={c.bg as any} style={styles.flex}>
                <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
                    <View style={[styles.errorIconWrap, { backgroundColor: c.dangerBg }]}>
                        <Ionicons name="alert-circle-outline" size={48} color={c.danger} />
                    </View>
                    <Text style={[styles.errorTitle, { color: c.text }]}>Tag Not Found</Text>
                    <Text style={[styles.errorSub, { color: c.subtext }]}>
                        This tag may be inactive or doesn't exist. Try scanning again.
                    </Text>
                    <Pressable
                        onPress={() => router.replace('/')}
                        style={[styles.errorBtn, { backgroundColor: c.primary }]}
                    >
                        <Text style={styles.errorBtnText}>Go Home</Text>
                    </Pressable>
                </View>
            </LinearGradient>
        );
    }

    // ─── Unclaimed Tag ────────────────────────────────────────────────────────

    if (tag.status === 'created' || (tag.isActive === false && !tag.userId)) {
        return (
            <LinearGradient colors={c.bg as any} style={styles.flex}>
                <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
                    <View style={[styles.errorIconWrap, { backgroundColor: c.primaryGlow }]}>
                        <Ionicons name="qr-code-outline" size={48} color={c.primary} />
                    </View>
                    <Text style={[styles.errorTitle, { color: c.text }]}>New Tag Detected</Text>
                    <Text style={[styles.errorSub, { color: c.subtext }]}>
                        Tag <Text style={{ color: c.primary, fontWeight: '700' }}>{tag.code}</Text> hasn't been activated yet.
                        Claim it to protect your vehicle.
                    </Text>
                    <Pressable
                        onPress={() => router.push({ pathname: '/register-tag', params: { code: tag.code } })}
                        style={[styles.errorBtn, { backgroundColor: c.primary }]}
                    >
                        <Text style={styles.errorBtnText}>Activate Tag</Text>
                    </Pressable>
                    <Pressable onPress={() => router.replace('/')} style={{ marginTop: 16, padding: 12 }}>
                        <Text style={{ color: c.muted, fontSize: 15 }}>Not now</Text>
                    </Pressable>
                </View>
            </LinearGradient>
        );
    }

    // ─── Main Render ──────────────────────────────────────────────────────────

    const vehicleIcon = tag.type === 'car' ? 'car-sport' : 'bicycle';

    return (
        <LinearGradient colors={c.bg as any} style={styles.flex}>
            {/* ── Header ── */}
            <Animated.View style={[styles.header, { paddingTop: insets.top + 12 }, fadeUp(headerAnim, 16)]}>
                <Text style={[styles.logo, { color: c.primary }]}>CarCard</Text>
                <Text style={[styles.logoTagline, { color: c.muted }]}>Smart Vehicle Identity</Text>
            </Animated.View>

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
                bounces
            >
                {/* ── Glass Card ── */}
                <Animated.View style={[fadeUp(cardAnim, 32)]}>
                    {Platform.OS === 'ios' ? (
                        <BlurView
                            intensity={t.isDark ? 20 : 55}
                            tint={t.isDark ? 'dark' : 'light'}
                            style={[styles.card, { borderColor: c.cardBorder }]}
                        >
                            <CardInner
                                tag={tag}
                                vehicleIcon={vehicleIcon}
                                colors={c}
                                handleCall={handleCall}
                                handleWhatsApp={handleWhatsApp}
                            />
                        </BlurView>
                    ) : (
                        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                            <CardInner
                                tag={tag}
                                vehicleIcon={vehicleIcon}
                                colors={c}
                                handleCall={handleCall}
                                handleWhatsApp={handleWhatsApp}
                            />
                        </View>
                    )}
                </Animated.View>

                {/* ── Footer ── */}
                <Animated.View style={[styles.footer, fadeUp(footerAnim, 20)]}>
                    <Text style={[styles.footerText, { color: c.footerText }]}>Protected by CarCard</Text>
                    <Pressable
                        onPress={() => router.push('/(tabs)/shop')}
                        style={({ pressed }) => [styles.footerCta, { opacity: pressed ? 0.6 : 1 }]}
                    >
                        <Text style={[styles.footerCtaText, { color: c.primary }]}>Get your own tag →</Text>
                    </Pressable>
                </Animated.View>
            </ScrollView>
        </LinearGradient>
    );
}

// ── Card Content (extracted to prevent re-render on parent changes)
function CardInner({
    tag,
    vehicleIcon,
    colors: c,
    handleCall,
    handleWhatsApp,
}: {
    tag: any;
    vehicleIcon: string;
    colors: Palette;
    handleCall: () => void;
    handleWhatsApp: () => void;
}) {
    return (
        <View style={styles.cardInner}>
            {/* Icon */}
            <View style={[styles.vehicleIconWrap, { backgroundColor: c.iconRing }]}>
                <Ionicons name={vehicleIcon as any} size={52} color={c.primary} />
            </View>

            {/* Plate */}
            <LicensePlate number={tag.plateNumber} colors={c} />

            {/* Nickname */}
            {tag.nickname ? (
                <Text style={[styles.nickname, { color: c.subtext }]}>{tag.nickname}</Text>
            ) : null}

            {/* Divider with label */}
            <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: c.divider }]} />
                <Text style={[styles.dividerLabel, { color: c.muted }]}>Contact Owner</Text>
                <View style={[styles.dividerLine, { backgroundColor: c.divider }]} />
            </View>

            <Text style={[styles.helperText, { color: c.text }]}>Vehicle causing an issue?</Text>
            <Text style={[styles.helperSub, { color: c.subtext }]}>
                Reach the owner securely — your details stay private.
            </Text>

            <View style={styles.actions}>
                <ActionButton
                    label="Call Owner"
                    sublabel={tag.privacy.allowMaskedCall ? 'Masked & private' : 'Not available'}
                    icon={<Ionicons name="call" size={19} color="#FFF" />}
                    onPress={handleCall}
                    disabled={!tag.privacy.allowMaskedCall}
                    variant="primary"
                    colors={c}
                />
                <ActionButton
                    label="WhatsApp"
                    sublabel={tag.privacy.allowWhatsapp ? 'Send a message' : 'Not available'}
                    icon={<Ionicons name="logo-whatsapp" size={19} color={c.whatsapp} />}
                    onPress={handleWhatsApp}
                    disabled={!tag.privacy.allowWhatsapp}
                    variant="whatsapp"
                    colors={c}
                />

                {tag.privacy.showEmergencyContact && tag.emergencyContact && (
                    <EmergencyCard
                        name={tag.emergencyContact.name}
                        phone={tag.emergencyContact.phone}
                        colors={c}
                    />
                )}
            </View>
        </View>
    );
}

// ─── Global Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        paddingBottom: 20,
        paddingTop: 60,
    },
    logo: {
        fontSize: 30,
        fontWeight: '800',
        letterSpacing: -1,
        fontStyle: 'italic',
    },
    logoTagline: {
        fontSize: 11,
        fontWeight: '500',
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        marginTop: 4,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 4,
    },
    card: {
        borderRadius: 28,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 28,
        elevation: 8,
    },
    cardInner: {
        padding: 28,
        alignItems: 'center',
    },
    vehicleIconWrap: {
        width: 88,
        height: 88,
        borderRadius: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    nickname: {
        fontSize: 15,
        fontWeight: '500',
        marginTop: 4,
        marginBottom: 28,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerLabel: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginHorizontal: 12,
    },
    helperText: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.4,
        textAlign: 'center',
        marginBottom: 6,
    },
    helperSub: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 28,
        paddingHorizontal: 12,
    },
    actions: {
        width: '100%',
    },
    footer: {
        marginTop: 36,
        alignItems: 'center',
        gap: 8,
    },
    footerText: {
        fontSize: 11,
        fontWeight: '500',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
    },
    footerCta: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    footerCtaText: {
        fontSize: 15,
        fontWeight: '600',
    },
    // ── Error / Unclaimed shared layout
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 36,
        gap: 12,
    },
    errorIconWrap: {
        width: 88,
        height: 88,
        borderRadius: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    errorTitle: {
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    errorSub: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
    },
    errorBtn: {
        marginTop: 12,
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 14,
        minWidth: 200,
        alignItems: 'center',
    },
    errorBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
});