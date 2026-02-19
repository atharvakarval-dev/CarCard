import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';

export default function LoginScreen() {
    const router = useRouter();
    const { mode } = useThemeStore();
    const theme = colors[mode === 'dark' ? 'dark' : 'light'];
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
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
                <Text style={[styles.subtitle, { color: theme.textMuted }]}>Enter your phone number to continue</Text>
            </View>

            <View style={styles.form}>
                <Input
                    label="Phone Number"
                    placeholder="9876543210"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    error={error}
                    leftIcon={<Text style={{ color: theme.textMuted }}>+91</Text>}
                />

                <Button
                    title="Send OTP"
                    onPress={handleSendOtp}
                    loading={loading}
                    style={styles.button}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
    },
    form: {
        gap: 16,
    },
    button: {
        marginTop: 16,
    },
});
