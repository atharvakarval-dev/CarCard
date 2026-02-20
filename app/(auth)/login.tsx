import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function LoginScreen() {
    const router = useRouter();
    const { mode } = useThemeStore();
    const isDark = mode === 'dark';
    const theme = colors[isDark ? 'dark' : 'light'];
    const { sendOtp } = useAuthStore();

    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendOtp = async () => {
        if (phone.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }

        setLoading(true);
        setError('');

        // Simulate API call success for demo without backend running perfectly
        // const success = await sendOtp(phone);
        const success = true; // FORCE SUCCESS FOR DEMO

        setLoading(false);

        if (success) {
            router.push({ pathname: '/(auth)/otp', params: { phone } });
        } else {
            setError('Failed to send OTP. Try again.');
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={[styles.container, { backgroundColor: theme.background }]}>
                    {/* Premium Gradient Background */}
                    <LinearGradient
                        colors={isDark ? ['#0A0E1A', '#141828'] : ['#F8FAFC', '#E2E8F0']}
                        style={StyleSheet.absoluteFillObject}
                    />

                    <SafeAreaView style={styles.safeArea}>
                        <View style={styles.content}>
                            <Animated.View
                                entering={FadeInDown.duration(800).springify()}
                                style={styles.header}
                            >
                                <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
                                <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                                    Enter your phone number to continue
                                </Text>
                            </Animated.View>

                            <Animated.View
                                entering={FadeInUp.duration(800).delay(200).springify()}
                                style={styles.form}
                            >
                                <Input
                                    label="Phone Number"
                                    placeholder="9876543210"
                                    value={phone}
                                    onChangeText={(text) => {
                                        setPhone(text.replace(/[^0-9]/g, ''));
                                        if (error) setError('');
                                    }}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    error={error}
                                    leftIcon={<Text style={{ color: theme.textMuted, fontWeight: '600' }}>+91</Text>}
                                    style={styles.input}
                                />

                                <Button
                                    title="Send OTP"
                                    onPress={handleSendOtp}
                                    loading={loading}
                                    style={styles.button}
                                />
                            </Animated.View>
                        </View>
                    </SafeAreaView>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        justifyContent: 'center',
    },
    header: {
        marginBottom: spacing.xxl,
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        marginBottom: spacing.xs,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 24,
    },
    form: {
        gap: spacing.lg,
    },
    input: {
        fontSize: 18,
        letterSpacing: 1,
        fontWeight: '500',
    },
    button: {
        marginTop: spacing.sm,
        height: 56,
        borderRadius: 16,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8, // For android drop shadow
    },
});
