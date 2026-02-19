import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useTagStore } from '../../store/tagStore';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export default function PublicScanScreen() {
    const { tagId } = useLocalSearchParams<{ tagId: string }>();
    const router = useRouter();
    const { mode } = useThemeStore();
    const theme = colors[mode === 'dark' ? 'dark' : 'light'];
    const { getPublicTag } = useTagStore();

    const [tag, setTag] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (tagId) {
            loadTag();
        }
    }, [tagId]);

    const loadTag = async () => {
        setLoading(true);
        const data = await getPublicTag(tagId as string);
        if (data) {
            setTag(data);
        } else {
            setError('Tag not found or inactive');
        }
        setLoading(false);
    };

    const handleCall = () => {
        if (tag?.privacy?.allowMaskedCall) {
            // In real app, this would use a masked calling service
            Linking.openURL(`tel:+91${tag.emergencyContact?.phone || '9999999999'}`);
        }
    };

    const handleWhatsApp = () => {
        if (tag?.privacy?.allowWhatsapp) {
            const message = `Hello, I scanned your CarCard tag on your vehicle (${tag.plateNumber}).`;
            Linking.openURL(`whatsapp://send?text=${message}`);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (error || !tag) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Ionicons name="alert-circle" size={64} color={theme.danger} />
                <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
                <Button title="Go Home" onPress={() => router.replace('/')} style={{ marginTop: 20 }} />
            </View>
        );
    }

    // Handle inactive/created tags (Batch generated but not claimed)
    if (tag.status === 'created' || (tag.isActive === false && !tag.userId)) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Ionicons name="qr-code" size={80} color={theme.primary} />
                <Text style={[styles.errorText, { color: theme.text, textAlign: 'center', marginBottom: 8 }]}>New Tag Detected</Text>
                <Text style={{ color: theme.textMuted, textAlign: 'center', marginBottom: 24 }}>
                    This tag ({tag.code}) is not activated yet.
                </Text>
                <Button
                    title="Activate Tag"
                    onPress={() => router.push({ pathname: '/register-tag', params: { code: tag.code } })}
                    style={{ width: '100%' }}
                />
                <Button
                    title="Cancel"
                    variant="ghost"
                    onPress={() => router.replace('/')}
                    style={{ marginTop: 16 }}
                />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.logo, { color: theme.primary }]}>Sampark</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Card variant="glass" style={styles.mainCard} padding="lg">
                    <View style={styles.vehicleIcon}>
                        <Ionicons name={tag.type === 'car' ? 'car-sport' : 'bicycle'} size={64} color={theme.primary} />
                    </View>

                    <Text style={[styles.plateNumber, { color: theme.text }]}>{tag.plateNumber}</Text>
                    <Text style={[styles.vehicleName, { color: theme.textMuted }]}>{tag.nickname}</Text>

                    <View style={styles.divider} />

                    <Text style={[styles.helperText, { color: theme.text }]}>Vehicle is causing an issue?</Text>
                    <Text style={[styles.helperSubtext, { color: theme.textMuted }]}>Contact the owner securely.</Text>

                    <View style={styles.actions}>
                        <Button
                            title="Call Owner"
                            icon={<Ionicons name="call" size={20} color="#FFF" />}
                            onPress={handleCall}
                            disabled={!tag.privacy.allowMaskedCall}
                            style={{ marginBottom: 16 }}
                        />

                        <Button
                            title="WhatsApp"
                            variant="outline"
                            icon={<Ionicons name="logo-whatsapp" size={20} color="#25D366" />}
                            onPress={handleWhatsApp}
                            disabled={!tag.privacy.allowWhatsapp}
                            style={{ marginBottom: 16, borderColor: '#25D366' }}
                            textStyle={{ color: '#25D366' }}
                        />

                        {tag.privacy.showEmergencyContact && tag.emergencyContact && (
                            <View style={[styles.emergencyBox, { backgroundColor: theme.danger + '20', borderColor: theme.danger }]}>
                                <Text style={[styles.emergencyTitle, { color: theme.danger }]}>Emergency Contact</Text>
                                <Text style={{ color: theme.text }}>{tag.emergencyContact.name}: {tag.emergencyContact.phone}</Text>
                            </View>
                        )}
                    </View>
                </Card>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.textMuted }]}>Powered by Sampark.me</Text>
                    <Button title="Get your own Tag" variant="ghost" onPress={() => router.push('/(tabs)/shop')} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        alignItems: 'center',
    },
    logo: {
        fontSize: 32,
        fontWeight: 'bold',
        fontStyle: 'italic',
    },
    content: {
        padding: spacing.lg,
    },
    mainCard: {
        alignItems: 'center',
    },
    vehicleIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    plateNumber: {
        ...typography.h2,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 8,
        textAlign: 'center',
    },
    vehicleName: {
        ...typography.body,
        marginBottom: 24,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(150,150,150,0.2)',
        marginBottom: 24,
    },
    helperText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    helperSubtext: {
        fontSize: 14,
        marginBottom: 24,
    },
    actions: {
        width: '100%',
    },
    emergencyBox: {
        padding: 16,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        alignItems: 'center',
    },
    emergencyTitle: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
    },
});
