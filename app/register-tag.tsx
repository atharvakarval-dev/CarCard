/**
 * RegisterTagScreen — Elite Redesign v2
 *
 * Design Direction: Apple Product Setup — "Onboarding Moment"
 *
 * Key enhancements over v1:
 *  - NFC scanner → "Breathing Orb" with gradient core + elegant ring borders
 *  - Step indicator → animated connector fill + active dot pulse
 *  - Staggered entrance animations for every section (60fps native driver)
 *  - Premium fields with animated focus border + success state
 *  - Vehicle picker → inner glow gradient on active, ghost inactive
 *  - Register CTA → shimmer highlight + muted gradient disabled state
 *  - Glass panels → deeper blur + double-border glass technique
 *  - Login gate → more immersive with enhanced icon sequencing
 *
 *  Preserved: All handlers, stores, navigation, functionality unchanged.
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Easing,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { Tag, useTagStore } from '../store/tagStore';
import { useAppTheme } from '../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    shimmer: string;
    disabledGrad: readonly string[];
}

const PALETTE: Record<'light' | 'dark', Palette> = {
    light: {
        bg: ['#F0F4FF', '#ECF0FF', '#F5F2FF'],
        surface: 'rgba(255,255,255,0.82)',
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
        fieldBorder: 'rgba(0,0,0,0.08)',
        fieldBorderActive: '#4F6EF7',
        label: '#374151',
        placeholder: '#C4C9D4',
        callGrad: ['#4F6EF7', '#6C3EF5'],
        nfcRing1: 'rgba(79,110,247,0.25)',
        nfcRing2: 'rgba(79,110,247,0.15)',
        nfcRing3: 'rgba(79,110,247,0.08)',
        backBtn: 'rgba(255,255,255,0.80)',
        stepActive: '#4F6EF7',
        stepDone: '#10B981',
        stepInactive: 'rgba(0,0,0,0.10)',
        shimmer: 'rgba(255,255,255,0.35)',
        disabledGrad: ['#D1D5DB', '#C4C8CF'],
    },
    dark: {
        bg: ['#080C1A', '#0D1230', '#0A0C1E'],
        surface: 'rgba(255,255,255,0.05)',
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
        fieldBg: 'rgba(255,255,255,0.04)',
        fieldBorder: 'rgba(255,255,255,0.08)',
        fieldBorderActive: '#6C8EFF',
        label: '#94A3B8',
        placeholder: '#3D4F6B',
        callGrad: ['#4F6EF7', '#7C3AED'],
        nfcRing1: 'rgba(108,142,255,0.30)',
        nfcRing2: 'rgba(108,142,255,0.18)',
        nfcRing3: 'rgba(108,142,255,0.08)',
        backBtn: 'rgba(17,24,39,0.80)',
        stepActive: '#6C8EFF',
        stepDone: '#34D399',
        stepInactive: 'rgba(255,255,255,0.10)',
        shimmer: 'rgba(255,255,255,0.08)',
        disabledGrad: ['#374151', '#2D3748'],
    },
};

// ─── Stagger Animation Hook ───────────────────────────────────────────────────

function useStaggerEntrance(count: number, delay = 80) {
    const anims = useRef(Array.from({ length: count }, () => new Animated.Value(0))).current;

    useEffect(() => {
        Animated.stagger(
            delay,
            anims.map(a =>
                Animated.spring(a, {
                    toValue: 1,
                    useNativeDriver: true,
                    damping: 20,
                    stiffness: 180,
                    mass: 0.8,
                })
            )
        ).start();
    }, []);

    return anims.map(a => ({
        opacity: a,
        transform: [
            {
                translateY: a.interpolate({
                    inputRange: [0, 1],
                    outputRange: [28, 0],
                }),
            },
        ],
    }));
}

// ─── Press Scale ───────────────────────────────────────────────────────────────

const PressScale = React.memo(function PressScale({
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
});

// ─── Animated NFC Scanner — "Breathing Orb" ────────────────────────────────────

const ORB_SIZE = 72;
const CENTER_SIZE = 200;

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
    const orbGlow = useRef(new Animated.Value(0.6)).current;
    const orbScale = useRef(new Animated.Value(1)).current;
    const successScale = useRef(new Animated.Value(0)).current;
    const iconOpacity = useRef(new Animated.Value(1)).current;
    const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
    const glowLoop = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
        if (!scanned) {
            // Staggered ring pulse
            const pulse = Animated.loop(
                Animated.stagger(350, [
                    Animated.timing(ring1, { toValue: 1, duration: 2200, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
                    Animated.timing(ring2, { toValue: 1, duration: 2200, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
                    Animated.timing(ring3, { toValue: 1, duration: 2200, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
                ])
            );
            pulseLoop.current = pulse;
            pulse.start();

            // Orb breathing glow
            const glow = Animated.loop(
                Animated.sequence([
                    Animated.timing(orbGlow, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    Animated.timing(orbGlow, { toValue: 0.6, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                ])
            );
            glowLoop.current = glow;
            glow.start();

            // Reset success state
            successScale.setValue(0);
            iconOpacity.setValue(1);
            orbScale.setValue(1);
        } else {
            // Stop loops
            pulseLoop.current?.stop();
            glowLoop.current?.stop();
            [ring1, ring2, ring3].forEach(r => r.setValue(0));

            // Success animation sequence
            Animated.parallel([
                Animated.timing(iconOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
                Animated.spring(orbScale, { toValue: 1.15, useNativeDriver: true, damping: 12, stiffness: 200 }),
            ]).start(() => {
                Animated.parallel([
                    Animated.spring(successScale, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 180 }),
                    Animated.spring(orbScale, { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 160 }),
                ]).start();
            });
            orbGlow.setValue(1);
        }

        return () => {
            pulseLoop.current?.stop();
            glowLoop.current?.stop();
        };
    }, [scanned]);

    const makeRingStyle = (anim: Animated.Value, size: number, color: string) => ({
        position: 'absolute' as const,
        width: size,
        height: size,
        borderRadius: size / 2,
        top: (CENTER_SIZE - size) / 2,
        left: (CENTER_SIZE - size) / 2,
        borderWidth: 1.5,
        borderColor: scanned ? c.success : color,
        backgroundColor: 'transparent',
        opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.7, 0] }),
        transform: [{
            scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.8] }),
        }],
    });

    return (
        <PressScale onPress={scanned ? undefined : onScan} haptic="medium" style={nfcStyles.wrapper} accessibilityLabel="Scan NFC Tag">
            <View style={[nfcStyles.center, { width: CENTER_SIZE, height: CENTER_SIZE }]}>
                {/* Pulsing border rings */}
                <Animated.View style={makeRingStyle(ring3, 160, c.nfcRing3)} />
                <Animated.View style={makeRingStyle(ring2, 120, c.nfcRing2)} />
                <Animated.View style={makeRingStyle(ring1, 88, c.nfcRing1)} />

                {/* Orb glow halo */}
                <Animated.View style={[
                    nfcStyles.orbGlow,
                    {
                        top: (CENTER_SIZE - ORB_SIZE * 2) / 2,
                        left: (CENTER_SIZE - ORB_SIZE * 2) / 2,
                        backgroundColor: scanned ? c.successBg : c.primaryBg,
                        opacity: orbGlow,
                        transform: [{ scale: orbScale }],
                    },
                ]} />

                {/* Core gradient orb */}
                <Animated.View style={[
                    nfcStyles.orbWrap,
                    {
                        top: (CENTER_SIZE - ORB_SIZE) / 2,
                        left: (CENTER_SIZE - ORB_SIZE) / 2,
                        transform: [{ scale: orbScale }],
                    },
                ]}>
                    <LinearGradient
                        colors={scanned ? [c.success, '#059669'] : c.callGrad as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={nfcStyles.orb}
                    >
                        {/* Scan icon */}
                        <Animated.View style={{ opacity: iconOpacity }}>
                            <Ionicons name="scan-outline" size={28} color="#FFF" />
                        </Animated.View>
                        {/* Success checkmark */}
                        <Animated.View style={{
                            position: 'absolute',
                            transform: [{ scale: successScale }],
                        }}>
                            <Ionicons name="checkmark" size={32} color="#FFF" />
                        </Animated.View>
                    </LinearGradient>
                </Animated.View>
            </View>

            {/* Label */}
            <View style={nfcStyles.labelWrap}>
                <Text style={[nfcStyles.label, { color: scanned ? c.success : c.primary }]}>
                    {scanned ? 'Tag Detected!' : 'Tap to Scan NFC Tag'}
                </Text>
                <Text style={[nfcStyles.sublabel, { color: c.muted }]}>
                    {scanned ? 'Code filled automatically' : 'or enter the code manually below'}
                </Text>
            </View>
        </PressScale>
    );
}

const nfcStyles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        width: '100%',
        paddingVertical: 8,
    },
    center: {
        marginBottom: 12,
    },
    orbGlow: {
        position: 'absolute',
        width: ORB_SIZE * 2,
        height: ORB_SIZE * 2,
        borderRadius: ORB_SIZE,
    },
    orbWrap: {
        position: 'absolute',
        width: ORB_SIZE,
        height: ORB_SIZE,
        borderRadius: ORB_SIZE / 2,
        shadowColor: '#4F6EF7',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 8,
    },
    orb: {
        width: ORB_SIZE,
        height: ORB_SIZE,
        borderRadius: ORB_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    labelWrap: {
        alignItems: 'center',
        gap: 5,
        width: '100%',
        paddingHorizontal: 24,
    },
    label: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.4,
        textAlign: 'center',
    },
    sublabel: {
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 19,
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
    // Animated fill for connector
    const fillAnim = useRef(new Animated.Value(current)).current;
    // Active dot pulse
    const dotPulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.spring(fillAnim, { toValue: current, useNativeDriver: false, damping: 20, stiffness: 120 }).start();
    }, [current]);

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(dotPulse, { toValue: 1.12, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(dotPulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    return (
        <View style={siStyles.row}>
            {steps.map((step, i) => {
                const isDone = i < current;
                const isActive = i === current;
                return (
                    <View key={step} style={siStyles.item}>
                        {/* Connector line (background track + animated fill) */}
                        {i < steps.length - 1 && (
                            <View style={siStyles.connectorWrap}>
                                <View style={[siStyles.connectorTrack, { backgroundColor: c.stepInactive }]} />
                                <Animated.View style={[
                                    siStyles.connectorFill,
                                    {
                                        backgroundColor: c.stepDone,
                                        transform: [{
                                            scaleX: fillAnim.interpolate({
                                                inputRange: [i, i + 1, steps.length],
                                                outputRange: [0, 1, 1],
                                                extrapolate: 'clamp',
                                            }),
                                        }],
                                    },
                                ]} />
                            </View>
                        )}
                        {/* Dot */}
                        <Animated.View style={[
                            siStyles.dot,
                            {
                                backgroundColor: isDone ? c.stepDone : isActive ? c.stepActive : c.stepInactive,
                                borderWidth: isActive ? 0 : 0,
                                transform: [{ scale: isActive ? dotPulse : 1 }],
                            },
                        ]}>
                            {isDone && <Ionicons name="checkmark" size={12} color="#FFF" />}
                            {isActive && <View style={siStyles.innerDot} />}
                        </Animated.View>
                        <Text style={[siStyles.label, {
                            color: isActive ? c.primary : isDone ? c.success : c.muted,
                            fontWeight: isActive ? '700' : '500',
                        }]}>
                            {step}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}

const siStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    item: {
        alignItems: 'center',
        flex: 1,
    },
    dot: {
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
        zIndex: 2,
    },
    innerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFF',
    },
    label: {
        fontSize: 11,
        letterSpacing: 0.3,
        textAlign: 'center',
    },
    connectorWrap: {
        position: 'absolute',
        top: 12,
        left: '55%',
        right: 0,
        width: '90%',
        height: 2.5,
        borderRadius: 1.5,
        overflow: 'hidden',
        zIndex: 0,
    },
    connectorTrack: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 1.5,
    },
    connectorFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        borderRadius: 1.5,
        transformOrigin: 'left',
    },
});

// ─── Vehicle Type Picker ───────────────────────────────────────────────────────

const VEHICLE_TYPES = [
    { value: 'car', label: 'Car', icon: 'car-sport' },
    { value: 'bike', label: 'Bike', icon: 'bicycle' },
    { value: 'business', label: 'Business', icon: 'briefcase' },
] as const;

const VehicleTypePicker = React.memo(function VehicleTypePicker({ value, onChange, c }: {
    value: Tag['type'];
    onChange: (v: Tag['type']) => void;
    c: Palette;
}) {
    return (
        <View style={vtStyles.row}>
            {VEHICLE_TYPES.map(opt => {
                const active = value === opt.value;
                return (
                    <PressScale
                        key={opt.value}
                        onPress={() => onChange(opt.value as Tag['type'])}
                        haptic="light"
                        style={{ flex: 1, marginHorizontal: 5 }}
                        accessibilityLabel={`Select ${opt.label}`}
                        accessibilityRole="radio"
                    >
                        {active ? (
                            <LinearGradient
                                colors={c.callGrad as any}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={vtStyles.option}
                            >
                                <Ionicons name={opt.icon as any} size={24} color="#FFF" />
                                <Text style={[vtStyles.label, { color: '#FFF' }]}>{opt.label}</Text>
                            </LinearGradient>
                        ) : (
                            <View style={[vtStyles.option, {
                                backgroundColor: c.fieldBg,
                                borderWidth: 1,
                                borderColor: c.fieldBorder,
                            }]}>
                                <Ionicons name={opt.icon as any} size={22} color={c.muted} />
                                <Text style={[vtStyles.label, { color: c.muted }]}>{opt.label}</Text>
                            </View>
                        )}
                    </PressScale>
                );
            })}
        </View>
    );
});

const vtStyles = StyleSheet.create({
    row: { flexDirection: 'row', marginHorizontal: -5 },
    option: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 16,
        gap: 6,
        minHeight: 76,
    },
    label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
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
        Animated.timing(focusAnim, {
            toValue: focused ? 1 : 0,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [focused]);

    const borderColor = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [c.fieldBorder, c.fieldBorderActive],
    });

    const borderWidth = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.5],
    });

    return (
        <View>
            <Text style={[pfStyles.label, { color: focused ? c.primary : c.label }]}>{label}</Text>
            <Animated.View style={[pfStyles.row, { backgroundColor: c.fieldBg, borderColor, borderWidth }]}>
                {leftIcon && <View style={pfStyles.leftIcon}>{leftIcon}</View>}
                <TextInput
                    style={[pfStyles.input, { color: c.text, paddingLeft: leftIcon ? 0 : 16 }]}
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
                {rightNode && <View style={pfStyles.rightNode}>{rightNode}</View>}
            </Animated.View>
        </View>
    );
}

const pfStyles = StyleSheet.create({
    label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3, marginBottom: 7, textTransform: 'uppercase' },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        minHeight: 52,
        overflow: 'hidden',
    },
    leftIcon: { paddingLeft: 14, paddingRight: 10, justifyContent: 'center' },
    input: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        paddingRight: 16,
        paddingVertical: Platform.OS === 'ios' ? 15 : 12,
        letterSpacing: -0.1,
    },
    rightNode: { paddingRight: 14, justifyContent: 'center' },
});

// ─── Glass Panel ───────────────────────────────────────────────────────────────

function GlassPanel({ children, c, style }: { children: React.ReactNode; c: Palette; style?: any }) {
    const isDark = c.bg[0].toLowerCase() === '#080c1a';
    if (Platform.OS === 'ios') {
        return (
            <BlurView
                intensity={isDark ? 24 : 60}
                tint={isDark ? 'dark' : 'light'}
                style={[gpStyles.panel, { borderColor: c.surfaceBorder }, style]}
            >
                {children}
            </BlurView>
        );
    }
    return (
        <View style={[gpStyles.panel, { backgroundColor: c.solidSurface, borderColor: c.surfaceBorder }, style]}>
            {children}
        </View>
    );
}

const gpStyles = StyleSheet.create({
    panel: {
        borderRadius: 22,
        borderWidth: 1,
        padding: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
        gap: 16,
    },
});

// ─── Login Gate ────────────────────────────────────────────────────────────────

function LoginGate({ c, router, insets }: { c: Palette; router: any; insets: any }) {
    const iconBounce = useRef(new Animated.Value(0)).current;
    const iconRotate = useRef(new Animated.Value(0)).current;
    const fadeIn = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance fade
        Animated.timing(fadeIn, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();

        // Icon bounce + subtle rotate sequence
        Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(iconBounce, { toValue: -10, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    Animated.timing(iconRotate, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(iconBounce, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    Animated.timing(iconRotate, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                ]),
            ])
        ).start();
    }, []);

    const rotate = iconRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '-8deg'],
    });

    return (
        <LinearGradient colors={c.bg as any} style={styles.flex}>
            <Animated.View style={[lgStyles.container, { paddingTop: insets.top, opacity: fadeIn, transform: [{ translateY: fadeIn.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}>
                <Animated.View style={[
                    lgStyles.iconWrap,
                    { backgroundColor: c.primaryBg, transform: [{ translateY: iconBounce }, { rotate }] },
                ]}>
                    <Ionicons name="lock-closed" size={40} color={c.primary} />
                </Animated.View>
                <Text style={[lgStyles.title, { color: c.text }]}>Sign In Required</Text>
                <Text style={[lgStyles.sub, { color: c.subtext }]}>
                    Create a free account to register and manage your CarCard tags.
                </Text>

                <PressScale onPress={() => router.push('/(auth)/login')} haptic="medium" style={lgStyles.btnWrap}>
                    <LinearGradient colors={c.callGrad as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={lgStyles.btn}>
                        <Ionicons name="person-circle-outline" size={20} color="#FFF" style={{ marginRight: 10 }} />
                        <Text style={lgStyles.btnText}>Login / Sign Up</Text>
                        <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" style={{ marginLeft: 8 }} />
                    </LinearGradient>
                </PressScale>

                <PressScale onPress={() => router.back()} haptic="light" style={{ marginTop: 20, padding: 12 }}>
                    <Text style={{ color: c.muted, fontSize: 15, fontWeight: '500' }}>Not now</Text>
                </PressScale>
            </Animated.View>
        </LinearGradient>
    );
}

const lgStyles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 36,
        gap: 12,
    },
    iconWrap: {
        width: 92,
        height: 92,
        borderRadius: 46,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.8, textAlign: 'center' },
    sub: { fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 280 },
    btnWrap: { marginTop: 20, width: '100%' },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        paddingVertical: 17,
        shadowColor: '#4F6EF7',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    btnText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
});

// ─── Section Label ─────────────────────────────────────────────────────────────

const SectionLabel = React.memo(({ label, c }: { label: string; c: Palette }) => (
    <Text style={[slStyles.text, { color: c.muted }]}>{label.toUpperCase()}</Text>
));
const slStyles = StyleSheet.create({
    text: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8, marginTop: 16, paddingHorizontal: 2 },
});

// ─── Shimmer CTA Button ────────────────────────────────────────────────────────

function ShimmerButton({
    onPress,
    disabled,
    loading,
    c,
}: {
    onPress: () => void;
    disabled: boolean;
    loading: boolean;
    c: Palette;
}) {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!disabled && !loading) {
            const loop = Animated.loop(
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 2400,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            );
            loop.start();
            return () => loop.stop();
        } else {
            shimmerAnim.setValue(0);
        }
    }, [disabled, loading]);

    const shimmerTranslate = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH * 1.5],
    });

    return (
        <PressScale
            onPress={loading ? undefined : onPress}
            disabled={disabled}
            haptic="medium"
            style={{ marginTop: 28 }}
        >
            <LinearGradient
                colors={disabled ? c.disabledGrad as any : c.callGrad as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={ctaStyles.btn}
            >
                {loading ? (
                    <>
                        <View style={ctaStyles.loadingDots}>
                            {[0, 1, 2].map(i => <LoadingDot key={i} delay={i * 150} />)}
                        </View>
                        <Text style={ctaStyles.btnText}>Registering…</Text>
                    </>
                ) : (
                    <>
                        <Ionicons name="shield-checkmark" size={20} color="#FFF" style={{ marginRight: 10 }} />
                        <Text style={ctaStyles.btnText}>Register Vehicle</Text>
                    </>
                )}

                {/* Shimmer overlay */}
                {!disabled && !loading && (
                    <Animated.View
                        style={[
                            ctaStyles.shimmer,
                            { backgroundColor: c.shimmer, transform: [{ translateX: shimmerTranslate }] },
                        ]}
                        pointerEvents="none"
                    />
                )}
            </LinearGradient>
        </PressScale>
    );
}

const ctaStyles = StyleSheet.create({
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
        paddingVertical: 18,
        minHeight: 60,
        overflow: 'hidden',
        shadowColor: '#4F6EF7',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    btnText: {
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
    shimmer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 60,
        borderRadius: 18,
        opacity: 0.6,
    },
});

// ─── Loading Dot ───────────────────────────────────────────────────────────────

function LoadingDot({ delay }: { delay: number }) {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(anim, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0, duration: 350, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
            ])
        ).start();
    }, []);
    return (
        <Animated.View style={{
            width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF',
            marginRight: 5,
            opacity: anim,
            transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
        }} />
    );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

const STEPS = ['Tag', 'Vehicle', 'Done'];

export default function RegisterTagScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const t = useAppTheme();
    const c = PALETTE[t.isDark ? 'dark' : 'light'];
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

    // Staggered entrance (5 sections: steps, nfc, tagCode, vehicleInfo, cta)
    const entrances = useStaggerEntrance(5, 90);

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
            <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />

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
                <View style={{ width: 40 }} />
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
                    <Animated.View style={[styles.stepsWrap, entrances[0]]}>
                        <StepIndicator steps={STEPS} current={step} c={c} />
                    </Animated.View>

                    {/* ── NFC Scanner ── */}
                    <Animated.View style={entrances[1]}>
                        <GlassPanel c={c} style={{ alignItems: 'center' }}>
                            <NfcScanner onScan={handleScanNFC} scanned={scanned} c={c} />
                        </GlassPanel>
                    </Animated.View>

                    {/* ── Tag Code Field ── */}
                    <Animated.View style={entrances[2]}>
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
                    </Animated.View>

                    {/* ── Vehicle Info ── */}
                    <Animated.View style={entrances[3]}>
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
                    </Animated.View>

                    {/* ── Register CTA ── */}
                    <Animated.View style={entrances[4]}>
                        <ShimmerButton
                            onPress={handleRegister}
                            disabled={loading || !code || !nickname || !plate}
                            loading={loading}
                            c={c}
                        />

                        {/* Fine print */}
                        <Text style={[styles.finePrint, { color: c.muted }]}>
                            By registering, anyone who scans your tag can contact you securely.{'\n'}
                            Your personal details stay private.
                        </Text>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
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
        paddingTop: 4,
        gap: 8,
    },
    stepsWrap: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 4,
    },
    scannedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 7,
        marginTop: 2,
    },
    scannedText: {
        fontSize: 13,
        fontWeight: '600',
    },
    finePrint: {
        fontSize: 12,
        lineHeight: 18,
        textAlign: 'center',
        paddingHorizontal: 16,
        marginTop: 16,
    },
});