import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Tag } from '../../store/tagStore';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface TagCardProps {
    tag: Tag;
    onTogglePrivacy: (tagId: string, setting: keyof Tag['privacy']) => void;
    onPress: () => void;
}

export const TagCard: React.FC<TagCardProps> = ({ tag, onTogglePrivacy, onPress }) => {
    const { mode } = useThemeStore();
    const theme = colors[mode === 'dark' ? 'dark' : 'light'];

    const getIconName = () => {
        switch (tag.type) {
            case 'car': return 'car-sport';
            case 'bike': return 'bicycle';
            case 'business': return 'briefcase';
            default: return 'pricetag';
        }
    };

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
            <Card variant="glass" style={styles.card} padding="md" intensity={40}>
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
                        <Ionicons name={getIconName()} size={24} color={theme.primary} />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={[styles.nickname, { color: theme.text }]}>{tag.nickname}</Text>
                        <Text style={[styles.plate, { color: theme.textMuted }]}>{tag.plateNumber}</Text>
                    </View>
                    <Badge label={tag.isActive ? 'Active' : 'Disabled'} variant={tag.isActive ? 'success' : 'danger'} />
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={styles.actions}>
                    <PrivacyToggle
                        label="Call"
                        icon="call"
                        value={tag.privacy.allowMaskedCall}
                        onChange={() => onTogglePrivacy(tag._id, 'allowMaskedCall')}
                        theme={theme}
                    />
                    <PrivacyToggle
                        label="WhatsApp"
                        icon="logo-whatsapp"
                        value={tag.privacy.allowWhatsapp}
                        onChange={() => onTogglePrivacy(tag._id, 'allowWhatsapp')}
                        theme={theme}
                    />
                    <PrivacyToggle
                        label="SMS"
                        icon="chatbubble"
                        value={tag.privacy.allowSms}
                        onChange={() => onTogglePrivacy(tag._id, 'allowSms')}
                        theme={theme}
                    />
                </View>
            </Card>
        </TouchableOpacity>
    );
};

const PrivacyToggle = ({ label, icon, value, onChange, theme }: any) => (
    <View style={styles.toggleContainer}>
        <Ionicons name={icon} size={18} color={value ? theme.success : theme.textMuted} style={{ marginBottom: 4 }} />
        <Switch
            value={value}
            onValueChange={onChange}
            trackColor={{ false: theme.border, true: theme.success + '50' }}
            thumbColor={value ? theme.success : '#f4f3f4'}
            style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }} // Mini switch
        />
    </View>
);

const styles = StyleSheet.create({
    card: {
        marginBottom: spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    headerText: {
        flex: 1,
    },
    nickname: {
        ...typography.body,
        fontWeight: '600',
    },
    plate: {
        ...typography.caption,
    },
    divider: {
        height: 1,
        marginVertical: spacing.sm,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    toggleContainer: {
        alignItems: 'center',
    },
});
