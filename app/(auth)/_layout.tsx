import { Stack } from 'expo-router';
import { useAppTheme } from '../../theme/theme';

export default function AuthLayout() {
    const t = useAppTheme();

    return (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }}>
            <Stack.Screen name="login" options={{ title: 'Login' }} />
            <Stack.Screen name="otp" options={{ title: 'Verify OTP' }} />
        </Stack>
    );
}
