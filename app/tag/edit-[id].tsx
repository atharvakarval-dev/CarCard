import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { Tag, useTagStore } from '../../store/tagStore';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export default function EditTagScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { mode } = useThemeStore();
    const theme = colors[mode === 'dark' ? 'dark' : 'light'];
    const { tags, updateTag, sendTagOtp, verifyTagOtpAndUpdate, fetchTags, isLoading } = useTagStore();
    const { user } = useAuthStore();

    const tag = tags.find(t => t._id === id);

    // ── Form state ──
    const [nickname, setNickname] = useState('');
    const [plateNumber, setPlateNumber] = useState('');
    const [type, setType] = useState<Tag['type']>('car');
    const [vehicleColor, setVehicleColor] = useState('');
    const [vehicleMake, setVehicleMake] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [emergencyName, setEmergencyName] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');

    // ── OTP modal state ──
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpValue, setOtpValue] = useState('');
    const [otpSending, setOtpSending] = useState(false);
    const [otpVerifying, setOtpVerifying] = useState(false);
    const [otpSent, setOtpSent] = useState(false);

    useEffect(() => {
        if (tag) {
            setNickname(tag.nickname || '');
            setPlateNumber(tag.plateNumber || '');
            setType(tag.type || 'car');
            setVehicleColor(tag.vehicleColor || '');
            setVehicleMake(tag.vehicleMake || '');
            setVehicleModel(tag.vehicleModel || '');
            setEmergencyName(tag.emergencyContact?.name || '');
            setEmergencyPhone(tag.emergencyContact?.phone || '');
        }
    }, [tag?._id]);

    if (!tag) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={{ color: theme.textMuted, marginTop: 16 }}>Loading tag...</Text>
            </View>
        );
    }

    const buildPendingData = () => ({
        nickname,
        plateNumber,
        type,
        vehicleColor,
        vehicleMake,
        vehicleModel,
        emergencyContactName: emergencyName,
        emergencyContactPhone: emergencyPhone,
    });

    const handleSave = async () => {
        const data = buildPendingData();
        const result = await updateTag(tag._id, data);

        if (result.otpRequired) {
            // Phone number changed — need OTP
            setShowOtpModal(true);
            handleSendOtp();
            return;
        }

        if (result.success) {
            Alert.alert('Success', 'Tag updated successfully!', [
                { text: 'OK', onPress: () => router.back() },
            ]);
            fetchTags(); // Refresh
        } else {
            Alert.alert('Error', 'Failed to update tag. Please try again.');
        }
    };

    const handleSendOtp = async () => {
        if (!emergencyPhone) {
            Alert.alert('Error', 'Please enter a valid phone number');
            return;
        }
        setOtpSending(true);
        const sent = await sendTagOtp(tag._id, emergencyPhone, buildPendingData());
        setOtpSending(false);
        if (sent) {
            setOtpSent(true);
        } else {
            Alert.alert('Error', 'Failed to send OTP. Please try again.');
        }
    };

    const handleVerifyOtp = async () => {
        if (otpValue.length !== 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit OTP');
            return;
        }
        setOtpVerifying(true);
        const success = await verifyTagOtpAndUpdate(tag._id, emergencyPhone, otpValue, buildPendingData());
        setOtpVerifying(false);

        if (success) {
            setShowOtpModal(false);
            setOtpValue('');
            setOtpSent(false);
            Alert.alert('Success', 'Tag updated and phone verified!', [
                { text: 'OK', onPress: () => router.back() },
            ]);
            fetchTags();
        } else {
            Alert.alert('Error', 'Invalid OTP. Please try again.');
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
            <Header title="Edit Tag" showBack />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Vehicle Type */}
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Vehicle Type</Text>
                    <View style={styles.typeRow}>
                        <TypeSelector value="car" label="Car" icon="car-sport" />
                        <TypeSelector value="bike" label="Bike" icon="bicycle" />
                        <TypeSelector value="business" label="Biz" icon="briefcase" />
                    </View>

                    {/* Basic Info */}
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Basic Info</Text>
                    <Card variant="glass" style={styles.card}>
                        <Input label="Nickname" placeholder="e.g. My Honda City" value={nickname} onChangeText={setNickname} />
                        <Input label="License Plate" placeholder="MH 12 AB 1234" value={plateNumber} onChangeText={setPlateNumber} autoCapitalize="characters" />
                    </Card>

                    {/* Vehicle Details */}
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Vehicle Details</Text>
                    <Card variant="glass" style={styles.card}>
                        <Input label="Color" placeholder="e.g. White" value={vehicleColor} onChangeText={setVehicleColor} />
                        <Input label="Make" placeholder="e.g. Honda" value={vehicleMake} onChangeText={setVehicleMake} />
                        <Input label="Model" placeholder="e.g. City" value={vehicleModel} onChangeText={setVehicleModel} />
                    </Card>

                    {/* Emergency Contact */}
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Emergency Contact</Text>
                    <Card variant="glass" style={styles.card}>
                        <Input label="Contact Name" placeholder="e.g. John Doe" value={emergencyName} onChangeText={setEmergencyName} />
                        <Input
                            label="Contact Phone"
                            placeholder="10-digit mobile number"
                            value={emergencyPhone}
                            onChangeText={setEmergencyPhone}
                            keyboardType="phone-pad"
                            leftIcon={<Ionicons name="call-outline" size={20} color={theme.textMuted} />}
                        />
                        {emergencyPhone !== (tag.emergencyContact?.phone || '') && emergencyPhone.length > 0 && (
                            <View style={[styles.otpHint, { backgroundColor: theme.warning + '15', borderColor: theme.warning }]}>
                                <Ionicons name="shield-checkmark-outline" size={18} color={theme.warning} />
                                <Text style={{ color: theme.warning, marginLeft: 8, flex: 1, fontSize: 13 }}>
                                    Changing the phone number requires OTP verification.
                                </Text>
                            </View>
                        )}
                    </Card>

                    {/* Save */}
                    <Button
                        title="Save Changes"
                        onPress={handleSave}
                        loading={isLoading}
                        style={{ marginTop: 8, marginBottom: 40 }}
                    />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── OTP Verification Modal ── */}
            <Modal visible={showOtpModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Verify Phone Number</Text>
                            <TouchableOpacity onPress={() => { setShowOtpModal(false); setOtpValue(''); }}>
                                <Ionicons name="close" size={24} color={theme.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <Text style={{ color: theme.textMuted, marginBottom: 20, lineHeight: 20 }}>
                            An OTP has been sent to <Text style={{ fontWeight: '700', color: theme.text }}>{emergencyPhone}</Text>.
                            Enter it below to confirm and save your changes.
                        </Text>

                        <Input
                            label="Enter OTP"
                            placeholder="6-digit code"
                            value={otpValue}
                            onChangeText={setOtpValue}
                            keyboardType="number-pad"
                            maxLength={6}
                            leftIcon={<Ionicons name="key-outline" size={20} color={theme.textMuted} />}
                        />

                        <Button
                            title={otpVerifying ? 'Verifying...' : 'Verify & Save'}
                            onPress={handleVerifyOtp}
                            loading={otpVerifying}
                            style={{ marginTop: 8 }}
                        />

                        <TouchableOpacity onPress={handleSendOtp} disabled={otpSending} style={{ marginTop: 16, alignItems: 'center' }}>
                            <Text style={{ color: theme.primary, fontWeight: '600' }}>
                                {otpSending ? 'Sending...' : 'Resend OTP'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    sectionTitle: {
        ...typography.body,
        fontWeight: '700',
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    card: {
        marginBottom: spacing.sm,
    },
    typeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
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
        fontSize: 13,
    },
    otpHint: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        marginTop: 4,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 24,
    },
    modalCard: {
        borderRadius: borderRadius.lg,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        ...typography.h3,
        fontWeight: '700',
    },
});
