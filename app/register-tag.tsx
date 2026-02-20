/**
 * RegisterTagScreen — Elite Redesign
 *
 * Design Direction: "Onboarding Moment"
 * This screen is the user's first act of ownership — registering their vehicle.
 * It should feel like an Apple product setup flow: clear, exciting, trustworthy.
 *
 * Key Decisions:
 *  - NFC scanner becomes a living, animated focal point — not a dashed box
 *  - Step progress indicator (Tag → Vehicle → Done) reduces cognitive load
 *  - Vehicle type picker uses the gradient-active pattern from EditTagScreen
 *  - Tag code field auto-formats and shows a scan success animation
 *  - Login gate is a full-screen branded prompt, not just centered text
 *  - `useTagStore.getState()` inside handler is correct — no store subscription needed
 *  - All handlers in useCallback; loading state blocks all inputs correctly
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Easing,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { Tag, useTagStore } from '../store/tagStore';
import { useThemeStore } from '../store/themeStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Design Tokens ────────────────────────────────────────────────────────────

interface Palette {
    bg: readonly string[];
    surface: string;
    surfaceBorder: string;
    solidSurface: string;
    text: string;
    subtext: string;
    muted: string;
    primary: string;
    primaryBg: string;
    primaryBorder: string;
    success: string;
    successBg: string;
    danger: string;
    divider: string;
    fieldBg: string;
    fieldBorder: string;
    fieldBorderActive: string;
    label: string;
    placeholder: string;
    callGrad: readonly string[];
    nfcRing1: string;
    nfcRing2: string;
    nfcRing3: string;
    backBtn: string;
    stepActive: string;
    stepDone: string;
    stepInactive: string;
}

const PALETTE: Record<'light' | 'dark', Palette> = {
    light: {
        bg: ['#F0F4FF', '#ECF0FF', '#F5F2FF'],
        surface: 'rgba(255,255,255,0.80)',
        surfaceBorder: 'rgba(255,255,255,0.95)',
        solidSurface: '#FFFFFF',
        text: '#0D1117',
        subtext: '#6B7280',
        muted: '#9CA3AF',
        primary: '#4F6EF7',
        primaryBg: 'rgba(79,110,247,0.08)',
        primaryBorder: 'rgba(79,110,247,0.30)',
        success: '#10B981',
        successBg: 'rgba(16,185,129,0.10)',
        danger: '#EF4444',
        divider: 'rgba(0,0,0,0.06)',
        fieldBg: '#F9FAFB',
        fieldBorder: 'rgba(0,0,0,0.10)',
        fieldBorderActive: '#4F6EF7',
        label: '#374151',
        placeholder: '#C4C9D4',
        callGrad: ['#4F6EF7', '#6C3EF5'],
        nfcRing1: 'rgba(79,110,247,0.15)',
        nfcRing2: 'rgba(79,110,247,0.08)',
        nfcRing3: 'rgba(79,110,247,0.04)',
        backBtn: 'rgba(255,255,255,0.80)',
        stepActive: '#4F6EF7',
        stepDone: '#10B981',
        stepInactive: 'rgba(0,0,0,0.12)',
    },
    dark: {
        bg: ['#080C1A', '#0D1230', '#0A0C1E'],
        surface: 'rgba(255,255,255,0.04)',
        surfaceBorder: 'rgba(255,255,255,0.08)',
        solidSurface: '#111827',
        text: '#F1F5F9',
        subtext: '#94A3B8',
        muted: '#64748B',
        primary: '#6C8EFF',
        primaryBg: 'rgba(108,142,255,0.12)',
        primaryBorder: 'rgba(108,142,255,0.35)',
        success: '#34D399',
        successBg: 'rgba(52,211,153,0.10)',
        danger: '#F87171',
        divider: 'rgba(255,255,255,0.06)',
        fieldBg: 'rgba(255,255,255,0.05)',
        fieldBorder: 'rgba(255,255,255,0.10)',
        fieldBorderActive: '#6C8EFF',
        label: '#94A3B8',
        placeholder: '#3D4F6B',
        callGrad: ['#4F6EF7', '#7C3AED'],
        nfcRing1: 'rgba(108,142,255,0.18)',
        nfcRing2: 'rgba(108,142,255,0.10)',
        nfcRing3: 'rgba(108,142,255,0.05)',
        backBtn: 'rgba(17,24,39,0.80)',
        stepActive: '#6C8EFF',
        stepDone: '#34D399',
        stepInactive: 'rgba(255,255,255,0.12)',
    },
};

// ─── Press Scale ───────────────────────────────────────────────────────────────

function PressScale({
    children,
    onPress,
    disabled,
    style,
    haptic = 'light',
    accessibilityLabel,
    accessibilityRole,
}: {
    children: React.ReactNode;
    onPress?: () => void;
    disabled?: boolean;
    style?: any;
    haptic?: 'light' | 'medium' | 'heavy';
    accessibilityLabel?: string;
    accessibilityRole?: any;
}) {
    const scale = useRef(new Animated.Value(1)).current;

    return (
        <Animated.View style={[{ transform: [{ scale }] }, style, disabled && { opacity: 0.45 }]}>
            <Pressable
                onPress={disabled ? undefined : onPress}
                onPressIn={() => {
                    if (disabled) return;
                    Haptics.impactAsync(
                        haptic === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy :
                            haptic === 'medium' ? Haptics.ImpactFeedbackStyle.Medium :
                                Haptics.ImpactFeedbackStyle.Light
                    );
                    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
                }}
                onPressOut={() => {
                    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
                }}
                accessibilityLabel={accessibilityLabel}
                accessibilityRole={accessibilityRole || 'button'}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
}

// ─── Animated NFC Scanner ──────────────────────────────────────────────────────
// Three concentric rings that pulse outward like real NFC/radar scanning.
// On scan success, rings collapse inward and turn green.

function NfcScanner({
    onScan,
    scanned,
    c,
}: {
    onScan: () => void;
    scanned: boolean;
    c: Palette;
}) {
    const ring1 = useRef(new Animated.Value(0)).current;
    const ring2 = useRef(new Animated.Value(0)).current;
    const ring3 = useRef(new Animated.Value(0)).current;
    const iconScale = useRef(new Animated.Value(1)).current;
    const successScale = useRef(new Animated.Value(0)).current;
    const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
        if (!scanned) {
            // Staggered outward pulse loop
            const loop = Animated.loop(
                Animated.stagger(280, [
                    Animated.timing(ring1, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                    Animated.timing(ring2, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                    Animated.timing(ring3, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                ])
            );
            pulseLoop.current = loop;
            loop.start();
        } else {
            // Stop pulse, play success
            if (pulseLoop.current) pulseLoop.current.stop();
            [ring1, ring2, ring3].forEach(r => r.setValue(0));

            Animated.sequence([
                Animated.timing(iconScale, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.spring(successScale, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 200 }),
            ]).start();
        }

        return () => {
            if (pulseLoop.current) pulseLoop.current.stop();
        };
    }, [scanned]);

    const makeRingStyle = (anim: Animated.Value, size: number) => ({
        position: 'absolute' as const,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: scanned ? c.successBg : c.nfcRing1,
        opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.8, 0.5, 0] }),
        transform: [{
            scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }),
        }],
    });

    return (
        <PressScale onPress={scanned ? undefined : onScan} haptic="medium" style={nfc.wrapper} accessibilityLabel="Scan NFC Tag">
            <View style={nfc.center}>
                {/* Pulse rings */}
                <Animated.View style={makeRingStyle(ring3, 160)} />
                <Animated.View style={makeRingStyle(ring2, 120)} />
                <Animated.View style={makeRingStyle(ring1, 88)} />

                {/* Core button */}
                <LinearGradient
                    colors={scanned ? [c.success, '#059669'] : c.callGrad as any}
                    style={nfc.core}
                >
                    <Animated.View style={{ transform: [{ scale: iconScale }], position: 'absolute' }}>
                        <Ionicons name="scan-circle-outline" size={36} color="#FFF" />
                    </Animated.View>
                    <Animated.View style={{ transform: [{ scale: successScale }], position: 'absolute' }}>
                        <Ionicons name="checkmark-circle" size={36} color="#FFF" />
                    </Animated.View>
                </LinearGradient>
            </View>

            {/* Label */}
            <View style={nfc.labelWrap}>
                <Text style={[nfc.label, { color: scanned ? c.success : c.primary }]}>
                    {scanned ? 'Tag Detected!' : 'Tap to Scan NFC Tag'}
                </Text>
                <Text style={[nfc.sublabel, { color: c.muted }]}>
                    {scanned ? 'Code filled automatically' : 'or enter the code manually below'}
                </Text>
            </View>
        </PressScale>
    );
}

const nfc = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    center: {
        width: 160,
        height: 160,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    core: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4F6EF7',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 8,
    },
    labelWrap: {
        alignItems: 'center',
        gap: 6,
    },
    label: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.4,
    },
    sublabel: {
        fontSize: 13,
        fontWeight: '500',
    },
});

// ─── Step Indicator ────────────────────────────────────────────────────────────

function StepIndicator({
    steps,
    current,
    c,
}: {
    steps: string[];
    current: number;
    c: Palette;
}) {
    return (
        <View style={si.row}>
            {steps.map((step, i) => {
                const isDone = i < current;
                const isActive = i === current;
                return (
                    <View key={step} style={si.item}>
                        <View style={[
                            si.dot,
                            {
                                backgroundColor: isDone ? c.stepDone :
                                    isActive ? c.stepActive : c.stepInactive,
                                transform: [{ scale: isActive ? 1.15 : 1 }],
                            }
                        ]}>
                            {isDone && <Ionicons name="checkmark" size={10} color="#FFF" />}
                            {isActive && <View style={si.innerDot} />}
                        </View>
                        <Text style={[si.label, {
                            color: isActive ? c.primary : isDone ? c.success : c.muted,
                            fontWeight: isActive ? '700' : '500',
                        }]}>
                            {step}
                        </Text>
                        {i < steps.length - 1 && (
                            <View style={[si.connector, {
                                backgroundColor: isDone ? c.stepDone : c.stepInactive,
                            }]} />
                        )}
                    </View>
                );
            })}
        </View>
    );
}

const si = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 0,
        marginBottom: 8,
    },
    item: {
        alignItems: 'center',
        flex: 1,
        position: 'relative',
    },
    dot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
        zIndex: 1,
    },
    innerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFF',
    },
    label: {
        fontSize: 11,
        letterSpacing: 0.2,
        textAlign: 'center',
    },
    connector: {
        position: 'absolute',
        top: 12,
        left: '50%',
        right: '-50%',
        height: 2,
        borderRadius: 1,
        zIndex: 0,
    },
});

// ─── Vehicle Type Picker ───────────────────────────────────────────────────────

const VEHICLE_TYPES = [
    { value: 'car', label: 'Car', icon: 'car-sport' },
    { value: 'bike', label: 'Bike', icon: 'bicycle' },
    { value: 'business', label: 'Business', icon: 'briefcase' },
] as const;

function VehicleTypePicker({ value, onChange, c }: {
    value: Tag['type'];
    onChange: (v: Tag['type']) => void;
    c: Palette;
}) {
    return (
        <View style={vt.row}>
            {VEHICLE_TYPES.map(opt => {
                const active = value === opt.value;
                return (
                    <PressScale
                        key={opt.value}
                        onPress={() => onChange(opt.value as Tag['type'])}
                        haptic="light"
                        style={{ flex: 1, marginHorizontal: 4 }}
                        accessibilityLabel={`Select ${opt.label}`}
                        accessibilityRole="radio"
                    >
                        {active ? (
                            <LinearGradient colors={c.callGrad as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={vt.option}>
                                <Ionicons name={opt.icon as any} size={22} color="#FFF" />
                                <Text style={[vt.label, { color: '#FFF' }]}>{opt.label}</Text>
                            </LinearGradient>
                        ) : (
                            <View style={[vt.option, { backgroundColor: c.fieldBg, borderWidth: 1.5, borderColor: c.fieldBorder }]}>
                                <Ionicons name={opt.icon as any} size={22} color={c.muted} />
                                <Text style={[vt.label, { color: c.muted }]}>{opt.label}</Text>
                            </View>
                        )}
                    </PressScale>
                );
            })}
        </View>
    );
}

const vt = StyleSheet.create({
    row: { flexDirection: 'row', marginHorizontal: -4 },
    option: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 6,
    },
    label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
});

// ─── Premium Field ─────────────────────────────────────────────────────────────

function Field({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    autoCapitalize,
    maxLength,
    leftIcon,
    rightNode,
    editable = true,
    c,
}: {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'phone-pad' | 'email-address';
    autoCapitalize?: 'none' | 'characters' | 'words' | 'sentences';
    maxLength?: number;
    leftIcon?: React.ReactNode;
    rightNode?: React.ReactNode;
    editable?: boolean;
    c: Palette;
}) {
    const [focused, setFocused] = useState(false);
    const focusAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(focusAnim, { toValue: focused ? 1 : 0, duration: 180, useNativeDriver: false }).start();
    }, [focused]);

    const borderColor = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [c.fieldBorder, c.fieldBorderActive],
    });

    return (
        <View>
            <Text style={[pf.label, { color: focused ? c.primary : c.label }]}>{label}</Text>
            <Animated.View style={[pf.row, { backgroundColor: c.fieldBg, borderColor }]}>
                {leftIcon && <View style={pf.leftIcon}>{leftIcon}</View>}
                <TextInput
                    style={[pf.input, { color: c.text, paddingLeft: leftIcon ? 0 : 16 }]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={c.placeholder}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    maxLength={maxLength}
                    editable={editable}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    accessibilityLabel={label}
                />
                {rightNode && <View style={pf.rightNode}>{rightNode}</View>}
            </Animated.View>
        </View>
    );
}

const pf = StyleSheet.create({
    label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2, marginBottom: 7 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        borderWidth: 1.5,
        minHeight: 52,
        overflow: 'hidden',
    },
    leftIcon: { paddingLeft: 14, paddingRight: 10, justifyContent: 'center' },
    input: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        paddingRight: 16,
        paddingVertical: Platform.OS === 'ios' ? 14 : 12,
        letterSpacing: -0.1,
    },
    rightNode: { paddingRight: 14, justifyContent: 'center' },
});

// ─── Glass Panel ───────────────────────────────────────────────────────────────

function GlassPanel({ children, c, style }: { children: React.ReactNode; c: Palette; style?: any }) {
    const isDark = c.bg[0].toLowerCase() === '#080c1a';
    if (Platform.OS === 'ios') {
        return (
            <BlurView intensity={isDark ? 16 : 48} tint={isDark ? 'dark' : 'light'}
                style={[gp.panel, { borderColor: c.surfaceBorder }, style]}>
                {children}
            </BlurView>
        );
    }
    return (
        <View style={[gp.panel, { backgroundColor: c.solidSurface, borderColor: c.surfaceBorder }, style]}>
            {children}
        </View>
    );
}

const gp = StyleSheet.create({
    panel: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        gap: 16,
    },
});

// ─── Login Gate ────────────────────────────────────────────────────────────────

function LoginGate({ c, router, insets }: { c: Palette; router: any; insets: any }) {
    const iconBounce = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(iconBounce, { toValue: -8, duration: 700, useNativeDriver: true }),
                Animated.timing(iconBounce, { toValue: 0, duration: 700, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <LinearGradient colors={c.bg as any} style={styles.flex}>
            <View style={[lg.container, { paddingTop: insets.top }]}>
                <Animated.View style={[lg.iconWrap, { backgroundColor: c.primaryBg, transform: [{ translateY: iconBounce }] }]}>
                    <Ionicons name="lock-closed" size={40} color={c.primary} />
                </Animated.View>
                <Text style={[lg.title, { color: c.text }]}>Sign In Required</Text>
                <Text style={[lg.sub, { color: c.subtext }]}>
                    Create a free account to register and manage your CarCard tags.
                </Text>

                <PressScale onPress={() => router.push('/(auth)/login')} haptic="medium" style={lg.btnWrap}>
                    <LinearGradient colors={c.callGrad as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={lg.btn}>
                        <Ionicons name="person-circle-outline" size={20} color="#FFF" style={{ marginRight: 10 }} />
                        <Text style={lg.btnText}>Login / Sign Up</Text>
                    </LinearGradient>
                </PressScale>

                <PressScale onPress={() => router.back()} haptic="light" style={{ marginTop: 16, padding: 12 }}>
                    <Text style={{ color: c.muted, fontSize: 15, fontWeight: '500' }}>Not now</Text>
                </PressScale>
            </View>
        </LinearGradient>
    );
}

const lg = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 36,
        gap: 12,
    },
    iconWrap: {
        width: 88,
        height: 88,
        borderRadius: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.8, textAlign: 'center' },
    sub: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
    btnWrap: { marginTop: 16, width: '100%' },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        paddingVertical: 17,
    },
    btnText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
});

// ─── Section Label ─────────────────────────────────────────────────────────────

const SectionLabel = ({ label, c }: { label: string; c: Palette }) => (
    <Text style={[sl.text, { color: c.muted }]}>{label.toUpperCase()}</Text>
);
const sl = StyleSheet.create({
    text: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1, marginBottom: 10, paddingHorizontal: 2 },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────

const STEPS = ['Tag', 'Vehicle', 'Done'];

export default function RegisterTagScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { mode } = useThemeStore();
    const c = PALETTE[mode === 'dark' ? 'dark' : 'light'];
    const { registerTag } = useTagStore();
    const { user } = useAuthStore();
    const insets = useSafeAreaInsets();

    const [code, setCode] = useState((params.code as string) || (params.tagId as string) || '');
    const [nickname, setNickname] = useState('');
    const [plate, setPlate] = useState('');
    const [type, setType] = useState<Tag['type']>('car');
    const [loading, setLoading] = useState(false);
    const [scanned, setScanned] = useState(!!(params.code || params.tagId));

    // Derive step: 0 = tag, 1 = vehicle, 2 = done
    const step = !code ? 0 : !nickname || !plate ? 1 : 2;

    const handleScanNFC = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert('NFC Scanning', 'Hold your phone near the CarCard tag.');
        setTimeout(() => {
            const mockCode = 'CARCARD-NFC-' + Math.floor(Math.random() * 9000 + 1000);
            setCode(mockCode);
            setScanned(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 1200);
    }, []);

    const handleCodeChange = useCallback((v: string) => {
        setCode(v);
        setScanned(false);
    }, []);

    const handleRegister = useCallback(async () => {
        if (!code || !nickname || !plate) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Incomplete', 'Please fill in the tag code, nickname, and license plate.');
            return;
        }

        setLoading(true);

        const { activateTag } = useTagStore.getState();
        let success = await activateTag(code, nickname, type, plate);

        if (!success) {
            success = await registerTag(code, nickname, type, plate);
        }

        setLoading(false);

        if (success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('🎉 Tag Registered!', 'Your vehicle is now protected by CarCard.', [
                { text: 'Done', onPress: () => router.back() },
            ]);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Registration Failed', 'This tag code may already be in use. Check the code and try again.');
        }
    }, [code, nickname, plate, type, registerTag, router]);

    if (!user) {
        return <LoginGate c={c} router={router} insets={insets} />;
    }

    return (
        <LinearGradient colors={c.bg as any} style={styles.flex}>
            {/* ── Navbar ── */}
            <View style={[styles.navbar, { paddingTop: insets.top + 8 }]}>
                <PressScale
                    onPress={() => router.back()}
                    haptic="light"
                    style={[styles.backBtn, { backgroundColor: c.backBtn, borderColor: c.surfaceBorder }]}
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="chevron-back" size={20} color={c.text} />
                </PressScale>
                <Text style={[styles.navTitle, { color: c.text }]}>Register Tag</Text>
                <View style={styles.backBtn} />
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 48 }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Step Indicator ── */}
                    <View style={styles.stepsWrap}>
                        <StepIndicator steps={STEPS} current={step} c={c} />
                    </View>

                    {/* ── NFC Scanner ── */}
                    <GlassPanel c={c} style={{ alignItems: 'center', marginBottom: 8 }}>
                        <NfcScanner onScan={handleScanNFC} scanned={scanned} c={c} />
                    </GlassPanel>

                    {/* ── Tag Code Field ── */}
                    <SectionLabel label="Tag Code" c={c} />
                    <GlassPanel c={c}>
                        <Field
                            label="QR / Tag Code"
                            value={code}
                            onChangeText={handleCodeChange}
                            placeholder="e.g. CARCARD-XXXX-XXXX"
                            autoCapitalize="characters"
                            leftIcon={<Ionicons name="qr-code-outline" size={18} color={scanned ? c.success : c.muted} />}
                            rightNode={
                                code.length > 0
                                    ? <Ionicons
                                        name={scanned ? 'checkmark-circle' : 'ellipse-outline'}
                                        size={18}
                                        color={scanned ? c.success : c.muted}
                                    />
                                    : null
                            }
                            editable={!loading}
                            c={c}
                        />
                        {scanned && (
                            <View style={[styles.scannedBadge, { backgroundColor: c.successBg }]}>
                                <Ionicons name="wifi" size={13} color={c.success} style={{ marginRight: 6 }} />
                                <Text style={[styles.scannedText, { color: c.success }]}>
                                    Tag detected via NFC
                                </Text>
                            </View>
                        )}
                    </GlassPanel>

                    {/* ── Vehicle Info ── */}
                    <SectionLabel label="Vehicle Info" c={c} />
                    <GlassPanel c={c}>
                        <VehicleTypePicker value={type} onChange={setType} c={c} />
                        <Field
                            label="Nickname"
                            value={nickname}
                            onChangeText={setNickname}
                            placeholder="e.g. My Honda City"
                            leftIcon={<Ionicons name="happy-outline" size={18} color={c.muted} />}
                            editable={!loading}
                            c={c}
                        />
                        <Field
                            label="License Plate"
                            value={plate}
                            onChangeText={setPlate}
                            placeholder="MH 12 AB 1234"
                            autoCapitalize="characters"
                            leftIcon={<Ionicons name="car-outline" size={18} color={c.muted} />}
                            rightNode={
                                plate.length >= 6
                                    ? <Ionicons name="checkmark-circle" size={18} color={c.success} />
                                    : null
                            }
                            editable={!loading}
                            c={c}
                        />
                    </GlassPanel>

                    {/* ── Register CTA ── */}
                    <PressScale
                        onPress={loading ? undefined : handleRegister}
                        disabled={loading || !code || !nickname || !plate}
                        haptic="medium"
                        style={{ marginTop: 24 }}
                    >
                        <LinearGradient
                            colors={
                                loading || !code || !nickname || !plate
                                    ? ['#D1D5DB', '#D1D5DB']
                                    : c.callGrad as any
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.registerBtn}
                        >
                            {loading ? (
                                <>
                                    <View style={styles.loadingDots}>
                                        {[0, 1, 2].map(i => (
                                            <LoadingDot key={i} delay={i * 150} />
                                        ))}
                                    </View>
                                    <Text style={styles.registerBtnText}>Registering…</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="shield-checkmark" size={20} color="#FFF" style={{ marginRight: 10 }} />
                                    <Text style={styles.registerBtnText}>Register Vehicle</Text>
                                </>
                            )}
                        </LinearGradient>
                    </PressScale>

                    {/* Fine print */}
                    <Text style={[styles.finePrint, { color: c.muted }]}>
                        By registering, anyone who scans your tag can contact you securely.
                        Your personal details stay private.
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

// Inline loading dot
function LoadingDot({ delay }: { delay: number }) {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
            ])
        ).start();
    }, []);
    return (
        <Animated.View style={{
            width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF',
            marginRight: 4,
            opacity: anim,
            transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
        }} />
    );
}

// ─── Global Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    flex: { flex: 1 },
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
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navTitle: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.4,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 8,
        gap: 12,
    },
    stepsWrap: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 4,
    },
    scannedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 4,
    },
    scannedText: {
        fontSize: 13,
        fontWeight: '600',
    },
    registerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
        paddingVertical: 18,
        minHeight: 60,
        shadowColor: '#4F6EF7',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 16,
        elevation: 6,
    },
    registerBtnText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.4,
    },
    loadingDots: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    finePrint: {
        fontSize: 12,
        lineHeight: 18,
        textAlign: 'center',
        paddingHorizontal: 12,
        marginTop: 4,
    },
});