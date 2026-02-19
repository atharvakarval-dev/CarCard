import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TagCard } from '../../components/tag/TagCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { useAuthStore } from '../../store/authStore';
import { useTagStore } from '../../store/tagStore';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useThemeStore();
  const theme = colors[mode === 'dark' ? 'dark' : 'light'];
  const { user } = useAuthStore();
  const { tags, fetchTags, togglePrivacy, isLoading } = useTagStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTags();
    setRefreshing(false);
  };

  const QuickAction = ({ icon, label, onPress, color }: any) => (
    <View style={styles.quickAction}>
      <Button
        title=""
        onPress={onPress}
        style={[styles.quickActionButton, { backgroundColor: color + '20' }]}
        icon={<Ionicons name={icon} size={24} color={color} />}
      />
      <Text style={[styles.quickActionLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title={`Hey ${user?.name || 'Driver'} 👋`}
        rightAction={
          <Button
            title=""
            variant="ghost"
            icon={<Ionicons name="notifications-outline" size={24} color={theme.text} />}
            onPress={() => console.log('Notifications pressed')}
          />
        }
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing || isLoading} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Quick Actions */}
        <View style={[styles.quickActionsRow, { zIndex: 100, position: 'relative' }]}>
          <QuickAction
            icon="call"
            label="Calls"
            onPress={() => {
              console.log('Calls pressed');
              /* Implement Call logic or Linking.openURL('tel:...') */
            }}
            color={theme.primary}
          />
          <QuickAction
            icon="logo-whatsapp"
            label="WhatsApp"
            onPress={() => {
              console.log('WhatsApp pressed');
              /* Linking.openURL('whatsapp://send?phone=...') */
            }}
            color="#25D366"
          />
          <QuickAction
            icon="document-text"
            label="eTab PDF"
            onPress={() => console.log('eTab PDF pressed')}
            color={theme.warning}
          />
          <QuickAction
            icon="alert-circle"
            label="SOS"
            onPress={() => console.log('SOS pressed')}
            color={theme.danger}
          />
        </View>

        {/* Tags Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Tags</Text>
          <Button title="View All" variant="ghost" onPress={() => router.push('/(tabs)/tags')} textStyle={{ fontSize: 14 }} style={{ height: 30 }} />
        </View>

        {tags.length === 0 ? (
          <Card variant="glass" style={styles.emptyState}>
            <Ionicons name="car-sport-outline" size={48} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No tags registered yet.</Text>
            <Button title="Buy a Tag" onPress={() => router.push('/(tabs)/shop')} style={{ marginTop: 16 }} />
          </Card>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
            {tags.map((tag) => (
              <View key={tag._id} style={{ width: 300, marginRight: 16 }}>
                <TagCard
                  tag={tag}
                  onTogglePrivacy={togglePrivacy}
                  onPress={() => router.push({ pathname: '/tag/[id]', params: { id: tag._id } })}
                />
              </View>
            ))}
            <View style={{ width: 100, justifyContent: 'center', alignItems: 'center' }}>
              <Button title="+" variant="outline" onPress={() => router.push('/register-tag')} style={{ width: 50, height: 50, borderRadius: 25 }} />
              <Text style={{ color: theme.textMuted, marginTop: 8 }}>Add New</Text>
            </View>
          </ScrollView>
        )}

        {/* Recent Activity */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24, marginBottom: 12 }]}>Recent Scans</Text>
        <Card variant="solid" style={styles.activityCard}>
          {tags.length > 0 && tags[0].scans.length > 0 ? (
            tags[0].scans.map((scan: any, index: number) => (
              <View key={index} style={styles.activityItem}>
                <View style={[styles.dot, { backgroundColor: theme.primary }]} />
                <View>
                  <Text style={{ color: theme.text }}>Scanned at {scan.location}</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>{new Date(scan.timestamp).toLocaleString()}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ color: theme.textMuted, textAlign: 'center', padding: 20 }}>No recent scans.</Text>
          )}
        </Card>

        {/* Promo Banner */}
        <LinearGradient
          colors={[theme.primary, theme.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.banner, { borderRadius: borderRadius.lg }]}
        >
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Get 20% OFF</Text>
            <Text style={styles.bannerText}>on all Premium Metal Tags</Text>
            <Button title="Shop Now" variant="ghost" style={{ backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 10 }} onPress={() => router.push('/(tabs)/shop')} />
          </View>
          <Ionicons name="pricetag" size={80} color="rgba(255,255,255,0.2)" style={{ position: 'absolute', right: -20, bottom: -20 }} />
        </LinearGradient>

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
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: spacing.lg,
  },
  quickAction: {
    alignItems: 'center',
    width: 70,
  },
  quickActionButton: {
    width: 60,
    height: 60,
    borderRadius: 20,
    marginBottom: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    ...typography.caption,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    fontWeight: '700',
  },
  tagsScroll: {
    overflow: 'visible',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    ...typography.body,
  },
  activityCard: {
    padding: 0,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  banner: {
    marginTop: 24,
    padding: 20,
    overflow: 'hidden',
  },
  bannerContent: {
    zIndex: 1,
    alignItems: 'center',
  },
  bannerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bannerText: {
    color: '#FFF',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 10,
  },
});
