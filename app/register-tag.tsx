import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { Header } from '../components/ui/Header';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { Tag, useTagStore } from '../store/tagStore';
import { useThemeStore } from '../store/themeStore';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export default function RegisterTagScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { mode } = useThemeStore();
    const theme = colors[mode === 'dark' ? 'dark' : 'light'];
    const { registerTag } = useTagStore();

    const [code, setCode] = useState((params.code as string) || (params.tagId as string) || '');
    const [nickname, setNickname] = useState('');
    const [plate, setPlate] = useState('');
    const [type, setType] = useState<Tag['type']>('car');
    const [loading, setLoading] = useState(false);

    const handleScanNFC = () => {
        // Mock NFC for now
        Alert.alert('Scanning...', 'Imagine user tapped an NFC tag. Code filled automatically.');
        setTimeout(() => {
            setCode('CARCARD-NFC-' + Math.floor(Math.random() * 1000));
        }, 1000);
    };

    const { user } = useAuthStore();

    // Redirect to login if not authenticated
    if (!user) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Ionicons name="lock-closed-outline" size={64} color={theme.primary} />
                <Text style={{ color: theme.text, marginTop: 16, textAlign: 'center', marginBottom: 24, fontSize: 18, fontWeight: '600' }}>
                    Login Required
                </Text>
                <Text style={{ color: theme.textMuted, textAlign: 'center', marginBottom: 32 }}>
                    You need to be logged in to register or activate a tag.
                </Text>
                <Button
                    title="Login / Sign Up"
                    onPress={() => router.push('/(auth)/login')}
                    style={{ width: '100%' }}
                />
            </View>
        );
    }

    const handleRegister = async () => {
        if (!code || !nickname || !plate) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setLoading(true);

        // Try to activate existing tag first (Batch generated)
        const { activateTag } = useTagStore.getState();
        let success = await activateTag(code, nickname, type, plate);

        // If activation failed (e.g. tag not found), try to register as new tag
        if (!success) {
            console.log('Activation failed, trying to register new tag...');
            success = await registerTag(code, nickname, type, plate);
        }

        setLoading(false);

        if (success) {
            Alert.alert('Success', 'Tag registered successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } else {
            Alert.alert('Error', 'Failed to register tag. It might be already in use.');
        }
    };

    const TypeSelector = ({ value, label, icon }: any) => (
        <TouchableOpacity
            style={[styles.typeOption, {
                backgroundColor: type === value ? theme.primary + '20' : theme.surface,
                borderColor: type === value ? theme.primary : theme.border,
            }]}
            onPress={() => setType(value)}
        >
            <Ionicons name={icon} size={24} color={type === value ? theme.primary : theme.textMuted} />
            <Text style={[styles.typeLabel, { color: type === value ? theme.primary : theme.textMuted }]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title="Register New Tag" showBack />

            <ScrollView contentContainerStyle={styles.content}>

                {/* Scan Option */}
                <TouchableOpacity style={[styles.scanBox, { borderColor: theme.primary }]} onPress={handleScanNFC}>
                    <Ionicons name="scan-circle-outline" size={48} color={theme.primary} />
                    <Text style={[styles.scanText, { color: theme.primary }]}>Tap to Scan NFC Tag</Text>
                    <Text style={{ color: theme.textMuted, marginTop: 4 }}>or enter manually below</Text>
                </TouchableOpacity>

                <View style={styles.form}>
                    <Text style={[styles.sectionLabel, { color: theme.text }]}>Vehicle Type</Text>
                    <View style={styles.typeRow}>
                        <TypeSelector value="car" label="Car" icon="car-sport" />
                        <TypeSelector value="bike" label="Bike" icon="bicycle" />
                        <TypeSelector value="business" label="Biz" icon="briefcase" />
                    </View>

                    <Input
                        label="Tag Code / QR ID"
                        placeholder="Unique tag code"
                        value={code}
                        onChangeText={setCode}
                        leftIcon={<Ionicons name="qr-code-outline" size={20} color={theme.textMuted} />}
                    />

                    <Input
                        label="Nickname"
                        placeholder="e.g. My Honda City"
                        value={nickname}
                        onChangeText={setNickname}
                    />

                    <Input
                        label="License Plate"
                        placeholder="MH 12 AB 1234"
                        value={plate}
                        onChangeText={setPlate}
                        autoCapitalize="characters"
                    />

                    <Button
                        title="Register Vehicle"
                        onPress={handleRegister}
                        loading={loading}
                        style={{ marginTop: 24 }}
                    />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: spacing.md,
    },
    scanBox: {
        height: 140,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: borderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    scanText: {
        ...typography.h3,
        marginTop: 8,
    },
    form: {
        gap: 16,
    },
    sectionLabel: {
        ...typography.body,
        fontWeight: '600',
        marginBottom: 8,
    },
    typeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    typeOption: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderWidth: 1,
        borderRadius: borderRadius.md,
        marginHorizontal: 4,
    },
    typeLabel: {
        marginTop: 4,
        fontWeight: '600',
    },
});
