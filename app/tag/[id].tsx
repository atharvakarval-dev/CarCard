import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { useAuthStore } from '../../store/authStore';
import { useTagStore } from '../../store/tagStore';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export default function TagDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { mode } = useThemeStore();
    const theme = colors[mode === 'dark' ? 'dark' : 'light'];
    const { tags, togglePrivacy } = useTagStore();

    const { user } = useAuthStore();
    const tag = tags.find(t => t._id === id);
    const isOwner = tag?.userId === (user as any)?._id || tag?.userId === (user as any)?.id; // handle inconsistent id field

    if (!tag) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: theme.text }}>Tag not found</Text>
                <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 20 }} />
            </View>
        );
    }

    const SettingRow = ({ label, value, onChange, icon }: any) => (
        <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
                <Ionicons name={icon} size={24} color={theme.textMuted} style={{ marginRight: 12 }} />
                <Text style={[styles.settingLabel, { color: theme.text }]}>{label}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: theme.border, true: theme.success + '80' }}
                thumbColor={value ? theme.success : '#f4f3f4'}
            />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title="Tag Details" showBack />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Header Info */}
                <View style={styles.headerInfo}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
                        <Ionicons name={tag.type === 'car' ? 'car-sport' : 'bicycle'} size={32} color={theme.primary} />
                    </View>
                    <View>
                        <Text style={[styles.nickname, { color: theme.text }]}>{tag.nickname}</Text>
                        <Text style={[styles.plate, { color: theme.textMuted }]}>{tag.plateNumber}</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <Badge label={tag.isActive ? 'Active' : 'Disabled'} variant={tag.isActive ? 'success' : 'danger'} />
                    </View>
                </View>

                {/* Privacy Settings */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Privacy Settings</Text>
                <Card variant="glass" style={styles.card}>
                    <SettingRow
                        label="Allow Masked Calls"
                        value={tag.privacy.allowMaskedCall}
                        onChange={() => togglePrivacy(tag._id, 'allowMaskedCall')}
                        icon="call-outline"
                    />
                    <SettingRow
                        label="Allow WhatsApp"
                        value={tag.privacy.allowWhatsapp}
                        onChange={() => togglePrivacy(tag._id, 'allowWhatsapp')}
                        icon="logo-whatsapp"
                    />
                    <SettingRow
                        label="Allow SMS"
                        value={tag.privacy.allowSms}
                        onChange={() => togglePrivacy(tag._id, 'allowSms')}
                        icon="chatbubble-outline"
                    />
                    <SettingRow
                        label="Show Emergency Contact"
                        value={tag.privacy.showEmergencyContact}
                        onChange={() => togglePrivacy(tag._id, 'showEmergencyContact')}
                        icon="alert-circle-outline"
                    />
                </Card>

                {/* Documents */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Vehicle Documents</Text>
                <Card variant="solid" style={styles.card}>
                    <TouchableOpacity style={styles.docRow}>
                        <Ionicons name="document-text-outline" size={24} color={theme.primary} />
                        <Text style={[styles.docLabel, { color: theme.text }]}>RC Book</Text>
                        <Ionicons name="cloud-upload-outline" size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <TouchableOpacity style={styles.docRow}>
                        <Ionicons name="shield-checkmark-outline" size={24} color={theme.primary} />
                        <Text style={[styles.docLabel, { color: theme.text }]}>Insurance Policy</Text>
                        <Ionicons name="cloud-upload-outline" size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                </Card>

                {/* Actions - Owner Only */}
                {isOwner && (
                    <>
                        <Button
                            title="Edit Tag Details"
                            icon={<Ionicons name="create-outline" size={20} color="#FFF" />}
                            onPress={() => router.push({ pathname: '/tag/edit-[id]' as any, params: { id: tag._id } })}
                            style={{ marginBottom: 12 }}
                        />
                        <Button
                            title="Download eTag PDF"
                            variant="outline"
                            icon={<Ionicons name="download-outline" size={20} color={theme.primary} />}
                            onPress={() => { }}
                            style={{ marginBottom: 12 }}
                        />
                        <Button
                            title="Deactivate Tag"
                            variant="danger"
                            onPress={() => { }}
                        />
                    </>
                )}

                {/* Scan History */}
                <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Scan History</Text>
                {tag.scans.length > 0 ? (
                    tag.scans.map((scan, index) => (
                        <Card key={index} variant="solid" style={{ marginBottom: 8, padding: 12 }}>
                            <Text style={{ color: theme.text }}>Scanned at {scan.location}</Text>
                            <Text style={{ color: theme.textMuted, fontSize: 12 }}>{new Date(scan.timestamp).toLocaleString()}</Text>
                        </Card>
                    ))
                ) : (
                    <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 12 }}>No scan history available.</Text>
                )}
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
        paddingBottom: 40,
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: borderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    nickname: {
        ...typography.h3,
        fontWeight: '600',
    },
    plate: {
        ...typography.body,
    },
    sectionTitle: {
        ...typography.body,
        fontWeight: '700',
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    card: {
        marginBottom: spacing.md,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingLabel: {
        ...typography.body,
    },
    docRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    docLabel: {
        flex: 1,
        marginLeft: spacing.sm,
        ...typography.body,
    },
    divider: {
        height: 1,
        marginVertical: 4,
    },
});
