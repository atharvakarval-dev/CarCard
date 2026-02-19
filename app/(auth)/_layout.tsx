import { Stack } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';

export default function AuthLayout() {
    const { mode } = useThemeStore();
    const theme = colors[mode === 'dark' ? 'dark' : 'light'];

    return (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
            <Stack.Screen name="login" options={{ title: 'Login' }} />
            <Stack.Screen name="otp" options={{ title: 'Verify OTP' }} />
        </Stack>
    );
}
