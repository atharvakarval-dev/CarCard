import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Header } from '../../components/ui/Header';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';

export default function ProfileScreen() {
    const router = useRouter();
    const { mode, toggleMode } = useThemeStore();
    const { user, logout } = useAuthStore();
    const theme = colors[mode === 'dark' ? 'dark' : 'light'];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title="Profile" />
            <View style={styles.content}>
                <Text style={[styles.text, { color: theme.text }]}>Settings and Preferences.</Text>

                {user?.role === 'admin' && (
                    <Button
                        title="Admin Dashboard"
                        onPress={() => router.push('/admin/dashboard')}
                        style={{ marginTop: 20, backgroundColor: theme.primary }}
                    />
                )}

                <Button
                    title={`Switch to ${mode === 'dark' ? 'Light' : 'Dark'} Mode`}
                    onPress={toggleMode}
                    style={{ marginTop: 20 }}
                />

                <Button
                    title="Logout"
                    onPress={logout}
                    variant="outline"
                    style={{ marginTop: 20, borderColor: theme.danger }}
                    textStyle={{ color: theme.danger }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    text: {
        fontSize: 16,
    },
});
