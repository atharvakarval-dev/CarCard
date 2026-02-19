import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';

export default function OtpScreen() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const { mode } = useThemeStore();
    const theme = colors[mode === 'dark' ? 'dark' : 'light'];
    const { verifyOtp, setUser } = useAuthStore();

    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [timer, setTimer] = useState(60);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleVerify = async () => {
        if (otp.length < 6) return;

        setLoading(true);
        setError('');

        // Simulate verification
        // const success = await verifyOtp(phone, otp);
        const success = true; // FORCE SUCCESS FOR DEMO

        setLoading(false);

        if (success) {
            // Mock user login
            setUser({
                _id: 'mock-id',
                phoneNumber: phone || '9876543210',
                token: 'mock-token',
                role: 'user',
            });
            router.replace('/(tabs)');
        } else {
            setError('Invalid OTP');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.title, { color: theme.text }]}>Enter OTP</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                Sent to +91 {phone}
            </Text>

            <View style={styles.otpContainer}>
                <Input
                    placeholder="000000"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    textAlign="center"
                    style={{ fontSize: 24, letterSpacing: 8 }}
                    error={error}
                />
            </View>

            <Button
                title="Verify & Continue"
                onPress={handleVerify}
                loading={loading}
                disabled={otp.length !== 6}
            />

            <TouchableOpacity disabled={timer > 0} onPress={() => setTimer(60)}>
                <Text style={[styles.resend, { color: timer > 0 ? theme.textMuted : theme.primary }]}>
                    Resend OTP {timer > 0 ? `in ${timer}s` : ''}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
    },
    otpContainer: {
        marginBottom: 24,
    },
    resend: {
        marginTop: 24,
        textAlign: 'center',
        fontWeight: '600',
    },
});
