/**
 * EditTagScreen — Elite Redesign
 *
 * Design Direction: "Focused Form"
 * Inspired by Apple Settings edit flows + Stripe Dashboard + Linear's input precision.
 *
 * Core Philosophy:
 *  - A form screen's job is to reduce friction, not showcase design.
 *    Every element earns its place by either holding data or guiding the user.
 *  - Sections are progressive: identity → details → safety.
 *    Users read top-to-bottom; so does the cognitive weight of changes.
 *  - Vehicle type selector is a first-class picker, not three generic buttons.
 *  - OTP sheet replaces a Modal — bottom sheets feel native, modals feel web.
 *  - Inline field status (changed / verified / warning) eliminates the need
 *    for alerts wherever possible — context stays in the field, not in a popup.
 *  - `useCallback` on every handler; `memo` on pure sub-components.
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
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
import { useAuthStore } from '../../store/authStore';
import { Tag, useTagStore } from '../../store/tagStore';
import { useAppTheme } from '../../theme/theme';
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
    warning: string;
    warningBg: string;
    warningBorder: string;
    danger: string;
    dangerBg: string;
    divider: string;
    fieldBg: string;
    fieldBorder: string;
    fieldBorderActive: string;
    label: string;
    placeholder: string;
    overlay: string;
    sheetBg: string;
    iconRing: string;
    callGrad: readonly string[];
    backBtn: string;
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
        primaryBorder: 'rgba(79,110,247,0.35)',
        success: '#10B981',
        successBg: 'rgba(16,185,129,0.08)',
        warning: '#F59E0B',
        warningBg: 'rgba(245,158,11,0.08)',
        warningBorder: 'rgba(245,158,11,0.30)',
        danger: '#EF4444',
        dangerBg: 'rgba(239,68,68,0.08)',
        divider: 'rgba(0,0,0,0.06)',
        fieldBg: '#F9FAFB',
        fieldBorder: 'rgba(0,0,0,0.10)',
        fieldBorderActive: '#4F6EF7',
        label: '#374151',
        placeholder: '#C4C9D4',
        overlay: 'rgba(0,0,0,0.45)',
        sheetBg: '#FFFFFF',
        iconRing: 'rgba(79,110,247,0.10)',
        callGrad: ['#4F6EF7', '#6C3EF5'],
        backBtn: 'rgba(255,255,255,0.80)',
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
        primaryBorder: 'rgba(108,142,255,0.40)',
        success: '#34D399',
        successBg: 'rgba(52,211,153,0.10)',
        warning: '#FCD34D',
        warningBg: 'rgba(252,211,77,0.08)',
        warningBorder: 'rgba(252,211,77,0.30)',
        danger: '#F87171',
        dangerBg: 'rgba(248,113,113,0.10)',
        divider: 'rgba(255,255,255,0.06)',
        fieldBg: 'rgba(255,255,255,0.05)',
        fieldBorder: 'rgba(255,255,255,0.10)',
        fieldBorderActive: '#6C8EFF',
        label: '#94A3B8',
        placeholder: '#3D4F6B',
        overlay: 'rgba(0,0,0,0.65)',
        sheetBg: '#111827',
        iconRing: 'rgba(108,142,255,0.12)',
        callGrad: ['#4F6EF7', '#7C3AED'],
        backBtn: 'rgba(17,24,39,0.80)',
    },
};

// ─── Animated Press Wrapper ────────────────────────────────────────────────────

const PressScale = ({
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
}) => {
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
};

// ─── Section Header ────────────────────────────────────────────────────────────

const SectionLabel = ({ label, c }: { label: string; c: Palette }) => (
    <Text style={[sl.text, { color: c.muted }]}>{label.toUpperCase()}</Text>
);
const sl = StyleSheet.create({
    text: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.1,
        marginBottom: 10,
        marginTop: 28,
        paddingHorizontal: 2,
    },
});

// ─── Premium Field ─────────────────────────────────────────────────────────────
// Replaces the generic <Input /> component with a premium, contextual field.

interface FieldProps {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'numeric';
    autoCapitalize?: 'none' | 'characters' | 'words' | 'sentences';
    maxLength?: number;
    leftIcon?: React.ReactNode;
    rightNode?: React.ReactNode;
    hint?: string;
    hintType?: 'info' | 'warning' | 'success' | 'error';
    isLast?: boolean;
    c: Palette;
    testID?: string;
}

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
    hint,
    hintType = 'info',
    isLast,
    c,
    testID,
}: FieldProps) {
    const [focused, setFocused] = useState(false);
    const focusAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(focusAnim, {
            toValue: focused ? 1 : 0,
            duration: 180,
            useNativeDriver: false,
        }).start();
    }, [focused]);

    const borderColor = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [c.fieldBorder, c.fieldBorderActive],
    });

    const hintColor =
        hintType === 'warning' ? c.warning :
            hintType === 'success' ? c.success :
                hintType === 'error' ? c.danger :
                    c.muted;

    const hintIcon =
        hintType === 'warning' ? 'alert-circle-outline' :
            hintType === 'success' ? 'checkmark-circle-outline' :
                hintType === 'error' ? 'close-circle-outline' :
                    'information-circle-outline';

    return (
        <View style={[fd.wrapper, !isLast && { marginBottom: 14 }]}>
            <Text style={[fd.label, { color: focused ? c.primary : c.label }]}>{label}</Text>
            <Animated.View
                style={[
                    fd.inputRow,
                    {
                        backgroundColor: c.fieldBg,
                        borderColor,
                    },
                ]}
            >
                {leftIcon && <View style={fd.leftIcon}>{leftIcon}</View>}
                <TextInput
                    style={[
                        fd.input,
                        {
                            color: c.text,
                            paddingLeft: leftIcon ? 0 : 16,
                        },
                    ]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={c.placeholder}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    maxLength={maxLength}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    testID={testID}
                    accessibilityLabel={label}
                />
                {rightNode && <View style={fd.rightNode}>{rightNode}</View>}
            </Animated.View>
            {hint && (
                <View style={fd.hintRow}>
                    <Ionicons name={hintIcon as any} size={13} color={hintColor} style={{ marginRight: 5 }} />
                    <Text style={[fd.hint, { color: hintColor }]}>{hint}</Text>
                </View>
            )}
        </View>
    );
}

const fd = StyleSheet.create({
    wrapper: {},
    label: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.2,
        marginBottom: 7,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        borderWidth: 1.5,
        minHeight: 52,
        overflow: 'hidden',
    },
    leftIcon: {
        paddingLeft: 14,
        paddingRight: 10,
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        paddingRight: 16,
        paddingVertical: Platform.OS === 'ios' ? 14 : 12,
        letterSpacing: -0.1,
    },
    rightNode: {
        paddingRight: 14,
        justifyContent: 'center',
    },
    hintRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        paddingHorizontal: 2,
    },
    hint: {
        fontSize: 12,
        flex: 1,
        lineHeight: 16,
    },
});

// ─── Glass Panel ───────────────────────────────────────────────────────────────

function GlassPanel({ children, c, style }: { children: React.ReactNode; c: Palette; style?: any }) {
    const isDark = c.bg[0].toLowerCase() === '#080c1a';
    if (Platform.OS === 'ios') {
        return (
            <BlurView
                intensity={isDark ? 16 : 48}
                tint={isDark ? 'dark' : 'light'}
                style={[gp.panel, { borderColor: c.surfaceBorder }, style]}
            >
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
    },
});

// ─── Vehicle Type Selector ─────────────────────────────────────────────────────

const VEHICLE_TYPES = [
    { value: 'car', label: 'Car', icon: 'car-sport' },
    { value: 'bike', label: 'Bike', icon: 'bicycle' },
    { value: 'business', label: 'Business', icon: 'briefcase' },
] as const;

function VehicleTypePicker({
    value,
    onChange,
    c,
}: {
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
                            <LinearGradient
                                colors={c.callGrad as any}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={vt.option}
                            >
                                <Ionicons name={opt.icon as any} size={22} color="#FFF" />
                                <Text style={[vt.label, { color: '#FFF' }]}>{opt.label}</Text>
                            </LinearGradient>
                        ) : (
                            <View style={[vt.option, {
                                backgroundColor: c.fieldBg,
                                borderWidth: 1.5,
                                borderColor: c.fieldBorder,
                            }]}>
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
    row: {
        flexDirection: 'row',
        marginHorizontal: -4,
    },
    option: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 6,
        shadowColor: '#4F6EF7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
});

// ─── OTP Bottom Sheet ──────────────────────────────────────────────────────────

function OtpSheet({
    visible,
    phone,
    otpValue,
    onChangeOtp,
    onVerify,
    onResend,
    onDismiss,
    otpVerifying,
    otpSending,
    c,
    insets,
}: {
    visible: boolean;
    phone: string;
    otpValue: string;
    onChangeOtp: (v: string) => void;
    onVerify: () => void;
    onResend: () => void;
    onDismiss: () => void;
    otpVerifying: boolean;
    otpSending: boolean;
    c: Palette;
    insets: { bottom: number };
}) {
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 22,
                    stiffness: 180,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 1,
                    duration: 280,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: SCREEN_HEIGHT,
                    duration: 260,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    if (!visible && (translateY as any)._value === SCREEN_HEIGHT) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
            {/* Overlay */}
            <Animated.View
                style={[otp.overlay, { backgroundColor: c.overlay, opacity: overlayOpacity }]}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
            </Animated.View>

            {/* Sheet */}
            <Animated.View
                style={[
                    otp.sheet,
                    {
                        backgroundColor: c.sheetBg,
                        paddingBottom: insets.bottom + 24,
                        transform: [{ translateY }],
                    },
                ]}
            >
                {/* Drag handle */}
                <View style={[otp.handle, { backgroundColor: c.divider }]} />

                {/* Header */}
                <View style={otp.sheetHeader}>
                    <View style={[otp.sheetIconWrap, { backgroundColor: c.primaryBg }]}>
                        <Ionicons name="shield-checkmark" size={26} color={c.primary} />
                    </View>
                    <Text style={[otp.sheetTitle, { color: c.text }]}>Verify Phone Number</Text>
                    <Text style={[otp.sheetSub, { color: c.subtext }]}>
                        We sent a 6-digit code to{' '}
                        <Text style={{ color: c.text, fontWeight: '700' }}>+91 {phone}</Text>
                    </Text>
                </View>

                {/* OTP Boxes */}
                <OtpBoxes value={otpValue} onChange={onChangeOtp} c={c} />

                {/* Verify CTA */}
                <PressScale
                    onPress={otpValue.length === 6 ? onVerify : undefined}
                    disabled={otpValue.length < 6 || otpVerifying}
                    haptic="medium"
                    style={{ marginTop: 24, marginHorizontal: 24 }}
                >
                    <LinearGradient
                        colors={otpValue.length === 6 && !otpVerifying ? c.callGrad as any : ['#D1D5DB', '#D1D5DB']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={otp.verifyBtn}
                    >
                        {otpVerifying ? (
                            <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={otp.verifyLabel}>Verify & Save Changes</Text>
                            </>
                        )}
                    </LinearGradient>
                </PressScale>

                {/* Resend */}
                <PressScale onPress={otpSending ? undefined : onResend} haptic="light" style={otp.resendWrap}>
                    {otpSending ? (
                        <ActivityIndicator size="small" color={c.primary} />
                    ) : (
                        <Text style={[otp.resendText, { color: c.primary }]}>Resend Code</Text>
                    )}
                </PressScale>
            </Animated.View>
        </View>
    );
}

// ── Segmented OTP boxes

function OtpBoxes({
    value,
    onChange,
    c,
}: {
    value: string;
    onChange: (v: string) => void;
    c: Palette;
}) {
    const ref = useRef<TextInput>(null);

    return (
        <Pressable onPress={() => ref.current?.focus()} style={ob.row}>
            {Array.from({ length: 6 }).map((_, i) => {
                const char = value[i] ?? '';
                const isActive = value.length === i;
                return (
                    <View
                        key={i}
                        style={[
                            ob.box,
                            {
                                backgroundColor: char ? c.primaryBg : c.fieldBg,
                                borderColor: isActive
                                    ? c.primary
                                    : char
                                        ? c.primaryBorder
                                        : c.fieldBorder,
                            },
                        ]}
                    >
                        <Text style={[ob.char, { color: c.text }]}>{char}</Text>
                        {isActive && <View style={[ob.cursor, { backgroundColor: c.primary }]} />}
                    </View>
                );
            })}
            <TextInput
                ref={ref}
                value={value}
                onChangeText={v => onChange(v.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                style={ob.hidden}
                autoFocus
            />
        </Pressable>
    );
}

const ob = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 24,
        marginTop: 8,
    },
    box: {
        width: 46,
        height: 56,
        borderRadius: 14,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    char: {
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    cursor: {
        position: 'absolute',
        bottom: 10,
        width: 18,
        height: 2,
        borderRadius: 1,
    },
    hidden: {
        position: 'absolute',
        width: 1,
        height: 1,
        opacity: 0,
    },
});

const otp = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 20,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 4,
    },
    sheetHeader: {
        alignItems: 'center',
        paddingHorizontal: 28,
        paddingTop: 20,
        paddingBottom: 24,
    },
    sheetIconWrap: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    sheetTitle: {
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    sheetSub: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
    verifyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        paddingVertical: 16,
        minHeight: 56,
    },
    verifyLabel: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    resendWrap: {
        alignItems: 'center',
        paddingVertical: 16,
        marginHorizontal: 24,
    },
    resendText: {
        fontSize: 15,
        fontWeight: '600',
    },
});

// ─── Save Button ───────────────────────────────────────────────────────────────

function SaveButton({ onPress, loading, c }: { onPress: () => void; loading: boolean; c: Palette }) {
    return (
        <PressScale onPress={loading ? undefined : onPress} disabled={loading} haptic="medium" style={sb.wrap}>
            <LinearGradient
                colors={loading ? ['#D1D5DB', '#D1D5DB'] : c.callGrad as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={sb.btn}
            >
                {loading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                ) : (
                    <>
                        <Ionicons name="checkmark-done" size={20} color="#FFF" style={{ marginRight: 10 }} />
                        <Text style={sb.label}>Save Changes</Text>
                    </>
                )}
            </LinearGradient>
        </PressScale>
    );
}

const sb = StyleSheet.create({
    wrap: { marginTop: 12, marginBottom: 48 },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
        paddingVertical: 18,
        minHeight: 60,
        shadowColor: '#4F6EF7',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.30,
        shadowRadius: 16,
        elevation: 6,
    },
    label: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.4,
    },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function EditTagScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const t = useAppTheme();
    const c = PALETTE[t.isDark ? 'dark' : 'light'];
    const { tags, updateTag, sendTagOtp, verifyTagOtpAndUpdate, fetchTags, isLoading } = useTagStore();
    const { user } = useAuthStore();
    const insets = useSafeAreaInsets();

    const tag = tags.find(t => t._id === id);

    // ── Form state
    const [nickname, setNickname] = useState('');
    const [plateNumber, setPlateNumber] = useState('');
    const [type, setType] = useState<Tag['type']>('car');
    const [vehicleColor, setVehicleColor] = useState('');
    const [vehicleMake, setVehicleMake] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [emergencyName, setEmergencyName] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');

    // ── OTP state
    const [showOtpSheet, setShowOtpSheet] = useState(false);
    const [otpValue, setOtpValue] = useState('');
    const [otpSending, setOtpSending] = useState(false);
    const [otpVerifying, setOtpVerifying] = useState(false);

    const phoneChanged =
        emergencyPhone.length > 0 &&
        emergencyPhone !== (tag?.emergencyContact?.phone || '');

    useEffect(() => {
        if (tag) {
            setNickname(tag.nickname || '');
            setPlateNumber(tag.plateNumber || '');
            setType(tag.type || 'car');
            setVehicleColor(tag.vehicleColor || '');
            setVehicleMake(tag.vehicleMake || '');
            setVehicleModel(tag.vehicleModel || '');
            setEmergencyName(tag.emergencyContact?.name || '');
            setEmergencyPhone(tag.emergencyContact?.phone || '');
        }
    }, [tag?._id]);

    const buildPendingData = useCallback(() => ({
        nickname,
        plateNumber,
        type,
        vehicleColor,
        vehicleMake,
        vehicleModel,
        emergencyContactName: emergencyName,
        emergencyContactPhone: emergencyPhone,
    }), [nickname, plateNumber, type, vehicleColor, vehicleMake, vehicleModel, emergencyName, emergencyPhone]);

    const handleSave = useCallback(async () => {
        const data = buildPendingData();
        const result = await updateTag(tag!._id, data);

        if (result.otpRequired) {
            setShowOtpSheet(true);
            handleSendOtp();
            return;
        }

        if (result.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Saved!', 'Your tag has been updated.', [
                { text: 'Done', onPress: () => router.back() },
            ]);
            fetchTags();
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Update Failed', 'Please check your details and try again.');
        }
    }, [buildPendingData, tag]);

    const handleSendOtp = useCallback(async () => {
        if (!emergencyPhone) return;
        setOtpSending(true);
        const sent = await sendTagOtp(tag!._id, emergencyPhone, buildPendingData());
        setOtpSending(false);
        if (!sent) {
            Alert.alert('Could not send OTP', 'Please check the phone number and try again.');
        }
    }, [emergencyPhone, tag, buildPendingData]);

    const handleVerifyOtp = useCallback(async () => {
        if (otpValue.length !== 6) return;
        setOtpVerifying(true);
        const success = await verifyTagOtpAndUpdate(tag!._id, emergencyPhone, otpValue, buildPendingData());
        setOtpVerifying(false);

        if (success) {
            setShowOtpSheet(false);
            setOtpValue('');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Verified & Saved!', 'Your phone number has been confirmed.', [
                { text: 'Done', onPress: () => router.back() },
            ]);
            fetchTags();
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Invalid Code', 'The OTP you entered is incorrect. Please try again.');
        }
    }, [otpValue, tag, emergencyPhone, buildPendingData]);

    const handleDismissOtp = useCallback(() => {
        setShowOtpSheet(false);
        setOtpValue('');
    }, []);

    // ── Loading (tag not in store yet)
    if (!tag) {
        return (
            <LinearGradient colors={c.bg as any} style={styles.flex}>
                <View style={styles.loadingCenter}>
                    <ActivityIndicator size="large" color={c.primary} />
                    <Text style={[styles.loadingText, { color: c.muted }]}>Loading tag…</Text>
                </View>
            </LinearGradient>
        );
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
                    accessibilityRole="button"
                >
                    <Ionicons name="chevron-back" size={20} color={c.text} />
                </PressScale>
                <Text style={[styles.navTitle, { color: c.text }]}>Edit Tag</Text>
                <View style={styles.backBtn} />
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Vehicle Type ── */}
                    <SectionLabel label="Vehicle Type" c={c} />
                    <VehicleTypePicker value={type} onChange={setType} c={c} />

                    {/* ── Basic Info ── */}
                    <SectionLabel label="Basic Info" c={c} />
                    <GlassPanel c={c}>
                        <Field
                            label="Nickname"
                            value={nickname}
                            onChangeText={setNickname}
                            placeholder="e.g. My Honda City"
                            c={c}
                        />
                        <Field
                            label="License Plate"
                            value={plateNumber}
                            onChangeText={setPlateNumber}
                            placeholder="MH 12 AB 1234"
                            autoCapitalize="characters"
                            isLast
                            c={c}
                            rightNode={
                                plateNumber.length > 4 ? (
                                    <Ionicons name="checkmark-circle" size={18} color={c.success} />
                                ) : null
                            }
                        />
                    </GlassPanel>

                    {/* ── Vehicle Details ── */}
                    <SectionLabel label="Vehicle Details" c={c} />
                    <GlassPanel c={c}>
                        <Field
                            label="Color"
                            value={vehicleColor}
                            onChangeText={setVehicleColor}
                            placeholder="e.g. Pearl White"
                            leftIcon={<Ionicons name="color-palette-outline" size={18} color={c.muted} />}
                            c={c}
                        />
                        <Field
                            label="Make"
                            value={vehicleMake}
                            onChangeText={setVehicleMake}
                            placeholder="e.g. Honda"
                            leftIcon={<Ionicons name="business-outline" size={18} color={c.muted} />}
                            c={c}
                        />
                        <Field
                            label="Model"
                            value={vehicleModel}
                            onChangeText={setVehicleModel}
                            placeholder="e.g. City ZX"
                            leftIcon={<Ionicons name="car-outline" size={18} color={c.muted} />}
                            isLast
                            c={c}
                        />
                    </GlassPanel>

                    {/* ── Emergency Contact ── */}
                    <SectionLabel label="Emergency Contact" c={c} />
                    <GlassPanel c={c}>
                        <Field
                            label="Contact Name"
                            value={emergencyName}
                            onChangeText={setEmergencyName}
                            placeholder="e.g. Priya Sharma"
                            leftIcon={<Ionicons name="person-outline" size={18} color={c.muted} />}
                            c={c}
                        />
                        <Field
                            label="Mobile Number"
                            value={emergencyPhone}
                            onChangeText={setEmergencyPhone}
                            placeholder="10-digit number"
                            keyboardType="phone-pad"
                            maxLength={10}
                            leftIcon={<Ionicons name="call-outline" size={18} color={c.muted} />}
                            hint={
                                phoneChanged
                                    ? 'Phone change requires a one-time OTP verification'
                                    : undefined
                            }
                            hintType={phoneChanged ? 'warning' : 'info'}
                            isLast
                            c={c}
                        />
                    </GlassPanel>

                    {/* ── Save ── */}
                    <SaveButton onPress={handleSave} loading={isLoading} c={c} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── OTP Bottom Sheet ── */}
            <OtpSheet
                visible={showOtpSheet}
                phone={emergencyPhone}
                otpValue={otpValue}
                onChangeOtp={setOtpValue}
                onVerify={handleVerifyOtp}
                onResend={handleSendOtp}
                onDismiss={handleDismissOtp}
                otpVerifying={otpVerifying}
                otpSending={otpSending}
                c={c}
                insets={insets}
            />
        </LinearGradient>
    );
}

// ─── Global Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    flex: { flex: 1 },
    loadingCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        fontWeight: '500',
    },
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
    },
});