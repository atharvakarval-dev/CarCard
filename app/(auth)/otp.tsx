/**
 * OtpScreen — Elite Production UI
 *
 * Design Decisions:
 * - Individual OTP boxes > single input: industry standard (WhatsApp, Paytm, GPay)
 *   Each box = focused, tactile, satisfying to fill
 * - Animated success state: shields user from jarring navigation flash
 * - Shake animation on error: physical metaphor for "wrong" without a modal
 * - Progress ring on resend timer: premium, glanceable, no cognitive load
 * - Auto-advance cursor: zero friction, feels native-smart
 * - Keyboard auto-dismisses on success to reveal checkmark clearly
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';

const OTP_LENGTH = 6;
const RESEND_DURATION = 60;

// ─── OTP Box ──────────────────────────────────────────────────────────────────

interface OtpBoxProps {
    value: string;
    isFocused: boolean;
    hasError: boolean;
    isSuccess: boolean;
    theme: any;
    index: number;
}

function OtpBox({ value, isFocused, hasError, isSuccess, theme, index }: OtpBoxProps) {
    const scale = useRef(new Animated.Value(1)).current;
    const borderAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (value) {
            Animated.sequence([
                Animated.timing(scale, {
                    toValue: 1.12,
                    duration: 80,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.quad),
                }),
                Animated.spring(scale, {
                    toValue: 1,
                    tension: 200,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [value]);

    useEffect(() => {
        Animated.timing(borderAnim, {
            toValue: isFocused ? 1 : 0,
            duration: 180,
            useNativeDriver: false,
        }).start();
    }, [isFocused]);

    const borderColor = hasError
        ? '#FF3B30'
        : isSuccess
            ? '#34C759'
            : borderAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [theme.border ?? '#E0E0E0', theme.primary],
            });

    const bgColor = hasError
        ? '#FF3B3010'
        : isSuccess
            ? '#34C75910'
            : value
                ? theme.primary + '10'
                : theme.card ?? theme.surface;

    return (
        <Animated.View
            style={[
                styles.otpBox,
                {
                    borderColor: borderColor as any,
                    backgroundColor: bgColor,
                    transform: [{ scale }],
                    shadowColor: isFocused ? theme.primary : 'transparent',
                    shadowOpacity: isFocused ? 0.25 : 0,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: isFocused ? 4 : 0,
                },
            ]}
        >
            {isSuccess ? (
                <Ionicons name="checkmark" size={20} color="#34C759" />
            ) : (
                <Text style={[styles.otpDigit, { color: theme.text }]}>
                    {value ? '●' : ''}
                </Text>
            )}
        </Animated.View>
    );
}

// ─── Resend Timer Ring ────────────────────────────────────────────────────────

function ResendTimer({
    timer,
    onResend,
    theme,
}: {
    timer: number;
    onResend: () => void;
    theme: any;
}) {
    const progressAnim = useRef(new Animated.Value(1)).current;
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: timer / RESEND_DURATION,
            duration: 1000,
            useNativeDriver: false,
            easing: Easing.linear,
        }).start();
    }, [timer]);

    const handlePress = () => {
        if (timer > 0) return;
        Animated.sequence([
            Animated.timing(scale, { toValue: 0.93, duration: 80, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, tension: 180, friction: 6, useNativeDriver: true }),
        ]).start();
        onResend();
    };

    return (
        <Pressable onPress={handlePress} style={styles.resendContainer}>
            <Animated.View style={{ transform: [{ scale }] }}>
                <Text
                    style={[
                        styles.resendText,
                        {
                            color: timer > 0 ? theme.textMuted : theme.primary,
                            fontWeight: timer > 0 ? '400' : '600',
                        },
                    ]}
                >
                    {timer > 0 ? (
                        <>
                            Resend OTP in{' '}
                            <Text style={{ color: theme.primary, fontWeight: '700' }}>
                                {timer}s
                            </Text>
                        </>
                    ) : (
                        'Resend OTP'
                    )}
                </Text>
            </Animated.View>
        </Pressable>
    );
}

// ─── Success Overlay ──────────────────────────────────────────────────────────

function SuccessOverlay({ theme }: { theme: any }) {
    const scale = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const ringScale = useRef(new Animated.Value(0.6)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.spring(scale, {
                toValue: 1,
                tension: 100,
                friction: 6,
                useNativeDriver: true,
            }),
            Animated.spring(ringScale, {
                toValue: 1,
                tension: 60,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[styles.successOverlay, { opacity, backgroundColor: theme.background }]}>
            <Animated.View style={{ transform: [{ scale: ringScale }] }}>
                <View style={[styles.successRing, { borderColor: '#34C75930' }]}>
                    <Animated.View
                        style={[
                            styles.successCircle,
                            { backgroundColor: '#34C759', transform: [{ scale }] },
                        ]}
                    >
                        <Ionicons name="checkmark" size={40} color="#fff" />
                    </Animated.View>
                </View>
            </Animated.View>
            <Text style={[styles.successTitle, { color: theme.text }]}>Verified!</Text>
            <Text style={[styles.successSubtitle, { color: theme.textMuted }]}>
                Taking you in…
            </Text>
        </Animated.View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OtpScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const { mode } = useThemeStore();
    const theme = colors[mode === 'dark' ? 'dark' : 'light'];
    const { verifyOtp, setUser } = useAuthStore();

    const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [focusedIndex, setFocusedIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [timer, setTimer] = useState(RESEND_DURATION);

    // Refs for each hidden input
    const inputRef = useRef<TextInput>(null);
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const buttonScale = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(24)).current;

    // Entrance animation
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 80,
                friction: 10,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Timer countdown
    useEffect(() => {
        if (timer === 0) return;
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [timer]);

    // Auto-focus the hidden input
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 400);
    }, []);

    const shake = useCallback(() => {
        shakeAnim.setValue(0);
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleDigitChange = useCallback(
        (text: string) => {
            // Handle paste (all 6 digits at once)
            const cleaned = text.replace(/\D/g, '');
            if (cleaned.length >= OTP_LENGTH) {
                const newDigits = cleaned.slice(0, OTP_LENGTH).split('');
                setDigits(newDigits);
                setFocusedIndex(OTP_LENGTH - 1);
                setError('');
                return;
            }

            // Handle single digit input
            const lastChar = cleaned.slice(-1);
            const newDigits = [...digits];

            if (lastChar) {
                newDigits[focusedIndex] = lastChar;
                setDigits(newDigits);
                setError('');
                if (focusedIndex < OTP_LENGTH - 1) {
                    setFocusedIndex(focusedIndex + 1);
                }
            } else {
                // Backspace
                if (digits[focusedIndex]) {
                    newDigits[focusedIndex] = '';
                    setDigits(newDigits);
                } else if (focusedIndex > 0) {
                    newDigits[focusedIndex - 1] = '';
                    setDigits(newDigits);
                    setFocusedIndex(focusedIndex - 1);
                }
            }
        },
        [digits, focusedIndex]
    );

    const handleVerify = useCallback(async () => {
        const otp = digits.join('');
        if (otp.length < OTP_LENGTH) return;

        Keyboard.dismiss();
        setLoading(true);
        setError('');

        // Press animation
        Animated.sequence([
            Animated.timing(buttonScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
            Animated.spring(buttonScale, { toValue: 1, tension: 200, friction: 6, useNativeDriver: true }),
        ]).start();

        // const success = await verifyOtp(phone, otp);
        const isSuccess = true; // FORCE SUCCESS FOR DEMO

        setLoading(false);

        if (isSuccess) {
            setSuccess(true);
            setTimeout(() => {
                setUser({
                    _id: 'mock-id',
                    phoneNumber: phone || '9876543210',
                    token: 'mock-token',
                    role: 'user',
                });
                router.replace('/(tabs)');
            }, 1600);
        } else {
            shake();
            setError('The code you entered is incorrect. Please try again.');
            setDigits(Array(OTP_LENGTH).fill(''));
            setFocusedIndex(0);
            inputRef.current?.focus();
        }
    }, [digits, phone, shake]);

    // Auto-submit when all digits filled
    useEffect(() => {
        if (digits.every((d) => d !== '') && !loading) {
            handleVerify();
        }
    }, [digits]);

    const otpValue = digits.join('');
    const isComplete = otpValue.length === OTP_LENGTH;
    const maskedPhone = phone
        ? phone.replace(/(\d{2})\d+(\d{4})/, '$1XXXXXX$2')
        : 'your number';

    return (
        <>
            <StatusBar
                barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
                translucent
                backgroundColor="transparent"
            />

            <KeyboardAvoidingView
                style={[styles.container, { backgroundColor: theme.background }]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <Animated.View
                    style={[
                        styles.inner,
                        {
                            paddingTop: insets.top + 24,
                            paddingBottom: insets.bottom + 24,
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {/* ── Back ── */}
                    <Pressable
                        onPress={() => router.back()}
                        style={({ pressed }) => [
                            styles.backButton,
                            { backgroundColor: theme.card ?? theme.surface },
                            pressed && { opacity: 0.7 },
                        ]}
                        accessibilityLabel="Go back"
                        accessibilityRole="button"
                    >
                        <Ionicons name="arrow-back" size={20} color={theme.text} />
                    </Pressable>

                    {/* ── Icon ── */}
                    <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                        <Ionicons name="shield-checkmark-outline" size={36} color={theme.primary} />
                    </View>

                    {/* ── Heading ── */}
                    <Text style={[styles.title, { color: theme.text }]}>
                        Verify your number
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                        We sent a 6-digit code to{'\n'}
                        <Text style={[styles.phone, { color: theme.text }]}>
                            +91 {maskedPhone}
                        </Text>
                    </Text>

                    {/* ── OTP Boxes ── */}
                    <Animated.View
                        style={[
                            styles.boxRow,
                            { transform: [{ translateX: shakeAnim }] },
                        ]}
                    >
                        {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                            <Pressable key={i} onPress={() => {
                                setFocusedIndex(i);
                                inputRef.current?.focus();
                            }}>
                                <OtpBox
                                    index={i}
                                    value={digits[i]}
                                    isFocused={focusedIndex === i && !success}
                                    hasError={!!error}
                                    isSuccess={success}
                                    theme={theme}
                                />
                            </Pressable>
                        ))}
                    </Animated.View>

                    {/* Hidden TextInput (single source of input) */}
                    <TextInput
                        ref={inputRef}
                        value={otpValue}
                        onChangeText={handleDigitChange}
                        keyboardType="number-pad"
                        maxLength={OTP_LENGTH}
                        style={styles.hiddenInput}
                        caretHidden
                        autoComplete="sms-otp"
                        textContentType="oneTimeCode"
                        onFocus={() => !success && setFocusedIndex(otpValue.length < OTP_LENGTH ? otpValue.length : OTP_LENGTH - 1)}
                    />

                    {/* ── Error Message ── */}
                    {!!error && (
                        <Text style={styles.errorText}>{error}</Text>
                    )}

                    {/* ── Verify Button ── */}
                    <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%', marginTop: 12 }}>
                        <Pressable
                            onPress={handleVerify}
                            disabled={!isComplete || loading || success}
                            style={({ pressed }) => [
                                styles.verifyButton,
                                {
                                    backgroundColor: isComplete && !loading
                                        ? theme.primary
                                        : theme.primary + '50',
                                },
                                pressed && isComplete && styles.verifyButtonPressed,
                            ]}
                            accessibilityLabel="Verify OTP"
                            accessibilityRole="button"
                        >
                            {loading ? (
                                <LoadingDots theme={theme} />
                            ) : (
                                <>
                                    <Text style={styles.verifyButtonText}>
                                        Verify & Continue
                                    </Text>
                                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                                </>
                            )}
                        </Pressable>
                    </Animated.View>

                    {/* ── Resend ── */}
                    <ResendTimer
                        timer={timer}
                        onResend={() => setTimer(RESEND_DURATION)}
                        theme={theme}
                    />

                    {/* ── Trust line ── */}
                    <View style={styles.trustRow}>
                        <Ionicons name="lock-closed-outline" size={13} color={theme.textMuted} />
                        <Text style={[styles.trustText, { color: theme.textMuted }]}>
                            Secured with end-to-end encryption
                        </Text>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>

            {/* ── Success Overlay ── */}
            {success && <SuccessOverlay theme={theme} />}
        </>
    );
}

// ─── Loading Dots ─────────────────────────────────────────────────────────────

function LoadingDots({ theme }: { theme: any }) {
    const anims = [
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
    ];

    useEffect(() => {
        const loop = Animated.loop(
            Animated.stagger(160,
                anims.map((a) =>
                    Animated.sequence([
                        Animated.timing(a, { toValue: -5, duration: 280, useNativeDriver: true }),
                        Animated.timing(a, { toValue: 0, duration: 280, useNativeDriver: true }),
                    ])
                )
            )
        );
        loop.start();
        return () => loop.stop();
    }, []);

    return (
        <View style={styles.dotsRow}>
            {anims.map((anim, i) => (
                <Animated.View
                    key={i}
                    style={[
                        styles.dot,
                        { backgroundColor: '#fff', transform: [{ translateY: anim }] },
                    ]}
                />
            ))}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    inner: {
        flex: 1,
        paddingHorizontal: 28,
        alignItems: 'center',
    },

    // Back
    backButton: {
        alignSelf: 'flex-start',
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },

    // Icon
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },

    // Text
    title: {
        fontSize: 26,
        fontWeight: '700',
        letterSpacing: -0.5,
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 36,
    },
    phone: {
        fontWeight: '700',
        fontSize: 15,
    },

    // OTP boxes
    boxRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 8,
    },
    otpBox: {
        width: 48,
        height: 58,
        borderRadius: 14,
        borderWidth: 1.8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    otpDigit: {
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: 0,
    },

    // Hidden input
    hiddenInput: {
        position: 'absolute',
        width: 1,
        height: 1,
        opacity: 0,
    },

    // Error
    errorText: {
        color: '#FF3B30',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 10,
        fontWeight: '500',
    },

    // Verify button
    verifyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 16,
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 5,
    },
    verifyButtonPressed: {
        opacity: 0.88,
        transform: [{ scale: 0.98 }],
    },
    verifyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.2,
    },

    // Resend
    resendContainer: {
        marginTop: 28,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    resendText: {
        fontSize: 14,
        textAlign: 'center',
    },

    // Trust line
    trustRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 24,
        opacity: 0.6,
    },
    trustText: {
        fontSize: 12,
    },

    // Loading dots
    dotsRow: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
        height: 22,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },

    // Success overlay
    successOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99,
    },
    successRing: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    successCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successTitle: {
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 15,
    },
});