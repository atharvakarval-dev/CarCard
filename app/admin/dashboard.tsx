import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Header } from '../../components/ui/Header';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function AdminDashboard() {
    const router = useRouter();
    const { mode } = useThemeStore();
    const theme = colors[mode === 'dark' ? 'dark' : 'light'];
    const { user, token } = useAuthStore();
    const [loading, setLoading] = useState(false);

    // Basic Role Guard (Frontend only, backend handles real security)
    if (!user || user.role !== 'admin') {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="lock-closed" size={64} color={theme.textMuted} />
                <Text style={{ color: theme.text, marginTop: 16 }}>Access Restricted</Text>
                <Button title="Go Home" onPress={() => router.replace('/')} style={{ marginTop: 20 }} />
            </View>
        );
    }

    const handleGenerateBatch = async () => {
        setLoading(true);
        try {
            const apiUrl = 'http://localhost:5000/api/admin/generate'; // Replace with env var in prod

            if (Platform.OS === 'web') {
                // Web Download Logic
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Generation failed');

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'generated_tags.pdf';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                Alert.alert('Success', 'PDF Downloaded');

            } else {
                // Mobile Download Logic (Expo FileSystem)
                const fileUri = FileSystem.documentDirectory + 'generated_tags.pdf';
                const { uri } = await FileSystem.downloadAsync(
                    apiUrl,
                    fileUri,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri);
                } else {
                    Alert.alert('Saved', `File saved to ${uri}`);
                }
            }

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to generate batch');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title="Admin Dashboard" showBack />

            <View style={styles.content}>
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Ionicons name="documents-outline" size={48} color={theme.primary} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Batch Generation</Text>
                    <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
                        Generate 5000 new generic QR codes and download the PDF for printing.
                    </Text>

                    <Button
                        title="Generate 5000 Tags & PDF"
                        onPress={handleGenerateBatch}
                        loading={loading}
                        style={{ marginTop: 16, width: '100%' }}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: spacing.lg,
    },
    card: {
        padding: spacing.lg,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 12,
        marginBottom: 8,
    },
    cardDesc: {
        textAlign: 'center',
        marginBottom: 8,
    }
});
