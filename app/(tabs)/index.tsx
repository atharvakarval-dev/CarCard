import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TagCard } from '../../components/tag/TagCard';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { useTagStore } from '../../store/tagStore';
import { useThemeStore } from '../../store/themeStore';
import { spacing } from '../../theme/spacing';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  blue: '#3B82F6',
  blueDark: '#1D4ED8',
  blueLight: '#EFF6FF',
  green: '#22C55E',
  greenLight: '#F0FDF4',
  amber: '#F59E0B',
  amberLight: '#FFFBEB',
  red: '#EF4444',
  redLight: '#FEF2F2',
  whatsapp: '#25D366',
  whatsappLight: '#DCFCE7',
  white: '#FFFFFF',
  grey50: '#F8FAFC',
  grey100: '#F1F5F9',
  grey200: '#E2E8F0',
  grey400: '#94A3B8',
  grey500: '#64748B',
  grey700: '#334155',
  grey900: '#0F172A',
};

const LIGHT = {
  bg: PALETTE.grey50,
  surface: PALETTE.white,
  surfaceAlt: PALETTE.grey100,
  border: PALETTE.grey200,
  text: PALETTE.grey900,
  textSub: PALETTE.grey500,
  textMuted: PALETTE.grey400,
  primary: PALETTE.blue,
  primaryDark: PALETTE.blueDark,
};

const DARK = {
  bg: '#0D1117',
  surface: '#161B22',
  surfaceAlt: '#21262D',
  border: '#30363D',
  text: '#F0F6FC',
  textSub: '#8B949E',
  textMuted: '#484F58',
  primary: PALETTE.blue,
  primaryDark: PALETTE.blueDark,
};

const S = 8; // spacing unit

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Animated press feedback wrapper */
function Touchable({ onPress, style, children }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () =>
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start(onPress);
  return (
    <Pressable onPress={press} style={style}>
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
    </Pressable>
  );
}

/** Quick action pill */
function QuickAction({
  icon, label, onPress, bg, iconColor,
}: {
  icon: string; label: string; onPress: () => void; bg: string; iconColor: string;
}) {
  return (
    <Touchable onPress={onPress} style={styles.qaWrapper}>
      <View style={[styles.qaIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={22} color={iconColor} />
      </View>
      <Text style={styles.qaLabel}>{label}</Text>
    </Touchable>
  );
}

/** Skeleton shimmer block */
function Skeleton({ width, height, radius = 8, style }: any) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: PALETTE.grey200, opacity: anim },
        style,
      ]}
    />
  );
}

/** Scan timeline row */
function ScanRow({ scan, theme, isLast }: any) {
  return (
    <View style={[styles.scanRow, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}>
      <View style={[styles.scanDot, { backgroundColor: theme.primary + '22' }]}>
        <Ionicons name="scan-outline" size={14} color={theme.primary} />
      </View>
      <View style={styles.scanInfo}>
        <Text style={[styles.scanLocation, { color: theme.text }]} numberOfLines={1}>
          {scan.location || 'Unknown Location'}
        </Text>
        <Text style={[styles.scanTime, { color: theme.textMuted }]}>
          {timeAgo(scan.timestamp)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useThemeStore();
  const theme = mode === 'dark' ? DARK : LIGHT;
  const { user } = useAuthStore();
  const { tags, fetchTags, togglePrivacy, isLoading } = useTagStore();
  const [refreshing, setRefreshing] = useState(false);

  // Subtle fade-in on mount
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fetchTags();
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTags();
    setRefreshing(false);
  };

  const totalScans = tags.reduce((acc: number, t: any) => acc + (t.scans?.length ?? 0), 0);
  const recentScans = tags
    .flatMap((t: any) => t.scans ?? [])
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <View style={[styles.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      {/* ── Status Bar Gradient Header ── */}
      <LinearGradient
        colors={[theme.primaryDark, theme.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        {/* Top Nav Row */}
        <View style={styles.navRow}>
          <View>
            <Text style={styles.heroGreeting}>Good morning 👋</Text>
            <Text style={styles.heroName}>{user?.name || 'Driver'}</Text>
          </View>
          <Pressable
            style={styles.notifBtn}
            onPress={() => console.log('Notifications')}
            hitSlop={12}
          >
            <Ionicons name="notifications-outline" size={22} color="rgba(255,255,255,0.9)" />
            {/* Unread badge */}
            <View style={styles.badge} />
          </Pressable>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{tags.length}</Text>
            <Text style={styles.statLabel}>Tags</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{totalScans}</Text>
            <Text style={styles.statLabel}>Total Scans</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{tags.filter((t: any) => !t.isPrivate).length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>
      </LinearGradient>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {user?.role === 'admin' && (
          <Button
            title="Admin Dashboard"
            variant="outline"
            icon={<Ionicons name="shield-checkmark" size={20} color={theme.primary} />}
            onPress={() => router.push('/admin/dashboard' as any)}
            style={{ marginBottom: spacing.lg }}
          />
        )}

        {/* ── Quick Actions ── */}
        <View style={[styles.qaCard, { backgroundColor: theme.surface, shadowColor: mode === 'dark' ? '#000' : '#94A3B8' }]}>
          <QuickAction
            icon="call"
            label="Calls"
            onPress={() => console.log('Calls')}
            bg={PALETTE.blueLight}
            iconColor={PALETTE.blue}
          />
          <QuickAction
            icon="logo-whatsapp"
            label="WhatsApp"
            onPress={() => console.log('WhatsApp')}
            bg={PALETTE.whatsappLight}
            iconColor={PALETTE.whatsapp}
          />
          <QuickAction
            icon="document-text-outline"
            label="eTab PDF"
            onPress={() => console.log('eTab PDF')}
            bg={PALETTE.amberLight}
            iconColor={PALETTE.amber}
          />
          <QuickAction
            icon="alert-circle-outline"
            label="SOS"
            onPress={() => console.log('SOS')}
            bg={PALETTE.redLight}
            iconColor={PALETTE.red}
          />
        </View>

        {/* ── Your Tags ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Tags</Text>
            <Pressable
              onPress={() => router.push('/(tabs)/tags')}
              hitSlop={8}
              style={styles.viewAllBtn}
            >
              <Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text>
              <Ionicons name="chevron-forward" size={14} color={theme.primary} />
            </Pressable>
          </View>

          {isLoading && !refreshing ? (
            /* Skeleton loading state */
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[1, 2].map((k) => (
                <View key={k} style={styles.skeletonCard}>
                  <Skeleton width={260} height={140} radius={16} />
                </View>
              ))}
            </ScrollView>
          ) : tags.length === 0 ? (
            /* Empty state */
            <View style={[styles.emptyCard, { backgroundColor: theme.surface, shadowColor: mode === 'dark' ? '#000' : '#94A3B8' }]}>
              <View style={[styles.emptyIconWrap, { backgroundColor: PALETTE.blueLight }]}>
                <Ionicons name="car-sport-outline" size={32} color={PALETTE.blue} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No tags yet</Text>
              <Text style={[styles.emptyBody, { color: theme.textSub }]}>
                Register your first tag to protect your vehicle and connect with others instantly.
              </Text>
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                onPress={() => router.push('/(tabs)/shop')}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.primaryBtnText}>Get a Tag</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: S * 2 }}
            >
              {tags.map((tag: any) => (
                <View key={tag._id} style={styles.tagCardWrap}>
                  <TagCard
                    tag={tag}
                    onTogglePrivacy={togglePrivacy}
                    onPress={() => router.push({ pathname: '/tag/[id]', params: { id: tag._id } })}
                  />
                </View>
              ))}
              {/* Add new tag tile */}
              <Touchable
                onPress={() => router.push('/register-tag')}
                style={styles.addTagTile}
              >
                <View style={[styles.addTagInner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={[styles.addTagIconWrap, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="add" size={28} color={theme.primary} />
                  </View>
                  <Text style={[styles.addTagLabel, { color: theme.textSub }]}>Add{'\n'}New Tag</Text>
                </View>
              </Touchable>
            </ScrollView>
          )}
        </View>

        {/* ── Recent Scans ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Scans</Text>
            {recentScans.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: theme.primary + '18' }]}>
                <Text style={[styles.countBadgeText, { color: theme.primary }]}>{totalScans}</Text>
              </View>
            )}
          </View>

          <View style={[styles.scanCard, { backgroundColor: theme.surface, shadowColor: mode === 'dark' ? '#000' : '#94A3B8' }]}>
            {recentScans.length === 0 ? (
              <View style={styles.scanEmpty}>
                <View style={[styles.emptyIconWrap, { backgroundColor: PALETTE.grey100 }]}>
                  <Ionicons name="eye-off-outline" size={24} color={PALETTE.grey400} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text, fontSize: 15 }]}>No scans recorded</Text>
                <Text style={[styles.emptyBody, { color: theme.textSub }]}>
                  When someone scans your tag, it'll appear here.
                </Text>
              </View>
            ) : (
              recentScans.map((scan: any, i: number) => (
                <ScanRow key={i} scan={scan} theme={theme} isLast={i === recentScans.length - 1} />
              ))
            )}
          </View>
        </View>

        {/* ── Promo Banner ── */}
        <View style={styles.section}>
          <LinearGradient
            colors={['#1D4ED8', '#3B82F6', '#06B6D4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promoBanner}
          >
            {/* Background decoration */}
            <View style={styles.promoCircle1} />
            <View style={styles.promoCircle2} />

            <View style={styles.promoContent}>
              <View style={[styles.promoBadge]}>
                <Text style={styles.promoBadgeText}>LIMITED OFFER</Text>
              </View>
              <Text style={styles.promoDiscount}>20% OFF</Text>
              <Text style={styles.promoSubtitle}>on all Premium Metal Tags</Text>
              <Pressable
                style={styles.promoBtn}
                onPress={() => router.push('/(tabs)/shop')}
              >
                <Text style={[styles.promoBtnText, { color: PALETTE.blueDark }]}>Shop Now</Text>
                <Ionicons name="arrow-forward" size={15} color={PALETTE.blueDark} />
              </Pressable>
            </View>

            <Ionicons
              name="pricetag"
              size={100}
              color="rgba(255,255,255,0.08)"
              style={styles.promoIcon}
            />
          </LinearGradient>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // ── Hero ──
  heroGradient: {
    paddingHorizontal: S * 2,       // 16
    paddingTop: S * 2,
    paddingBottom: S * 4,           // 32
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S * 2.5,
  },
  heroGreeting: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: S * 1.5,
    paddingHorizontal: S,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: 4,
  },

  // ── Scroll ──
  scroll: {
    paddingTop: S * 2,
    paddingHorizontal: S * 2,
  },

  // ── Quick Actions ──
  qaCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: S * 2.5,
    paddingHorizontal: S,
    borderRadius: 20,
    marginBottom: S * 3,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  qaWrapper: {
    alignItems: 'center',
    gap: S,
  },
  qaIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.grey500,
    letterSpacing: 0.1,
  },

  // ── Section ──
  section: {
    marginBottom: S * 3,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S * 1.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: S * 0.5,
    paddingHorizontal: S,
    minHeight: 44,
    justifyContent: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: S,
    paddingVertical: 3,
    borderRadius: 20,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Tag Cards ──
  tagCardWrap: {
    width: 300,
    marginRight: S * 2,
  },
  skeletonCard: {
    marginRight: S * 2,
  },
  addTagTile: {
    width: 110,
    alignSelf: 'stretch',
  },
  addTagInner: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S,
    minHeight: 140,
  },
  addTagIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 17,
  },

  // ── Empty State ──
  emptyCard: {
    borderRadius: 20,
    padding: S * 3,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12 },
      android: { elevation: 2 },
    }),
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: S * 1.5,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: S,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: S * 2,
    maxWidth: 240,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: S * 2.5,
    paddingVertical: S * 1.5,
    borderRadius: 14,
    minHeight: 48,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // ── Scans ──
  scanCard: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12 },
      android: { elevation: 2 },
    }),
  },
  scanEmpty: {
    padding: S * 3,
    alignItems: 'center',
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: S * 1.5,
    paddingHorizontal: S * 2,
    gap: S * 1.5,
  },
  scanDot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanInfo: {
    flex: 1,
  },
  scanLocation: {
    fontSize: 14,
    fontWeight: '600',
  },
  scanTime: {
    fontSize: 12,
    marginTop: 2,
  },

  // ── Promo Banner ──
  promoBanner: {
    borderRadius: 24,
    padding: S * 3,
    overflow: 'hidden',
    minHeight: 180,
  },
  promoCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -40,
  },
  promoCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -30,
    right: 60,
  },
  promoContent: {
    zIndex: 1,
  },
  promoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: S * 1.5,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: S,
  },
  promoBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  promoDiscount: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: S * 2,
  },
  promoBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: S * 2.5,
    paddingVertical: S * 1.25,
    borderRadius: 14,
    minHeight: 44,
  },
  promoBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  promoIcon: {
    position: 'absolute',
    right: -16,
    bottom: -16,
  },
});