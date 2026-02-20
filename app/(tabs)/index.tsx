/**
 * HomeScreen — Elite Redesign
 *
 * Aesthetic: "Refined Automotive Luxury"
 * Inspiration: Apple Wallet meets BMW ConnectedDrive meets Stripe Dashboard
 *
 * Key Design Decisions:
 * ─────────────────────────────────────────────────────────────────────
 * 1. HERO: Deep navy-to-indigo mesh gradient with floating glass stats
 *    chips — gives a premium "live data" feel without visual noise.
 *
 * 2. TYPOGRAPHY: SF Pro sizing scale (11/12/13/15/18/22/42) with tight
 *    letter-spacing on headings. Weight contrast (400↔800) creates
 *    natural hierarchy without extra colour usage.
 *
 * 3. CARDS: Unified 20px radius, 1px border in semi-transparent white
 *    (light) / dark surface (dark), subtle shadow ring — feels raised
 *    without drop-shadow heaviness.
 *
 * 4. MOTION:
 *    - Section-level staggered fade+translate on mount (no jank).
 *    - Scale-spring on tag card press (native driver).
 *    - Skeleton shimmer using Animated loop.
 *    All animations are useNativeDriver: true except layout values.
 *
 * 5. QUICK ACTIONS: Pill-shaped row with icon-only first pass on narrow
 *    screens; labels always visible. Colour-coded icons use 10% opacity
 *    tinted backgrounds for restraint.
 *
 * 6. SCAN TIMELINE: Left-rail dot connector creates spatial flow —
 *    familiar from iOS Activity / Stripe feed patterns.
 *
 * 7. PROMO BANNER: Grid-break element — overlapping decorative orbs,
 *    frosted badge, bold weight contrast. Serves as visual "break" from
 *    list content.
 *
 * 8. ACCESSIBILITY: All interactive elements ≥ 44×44 pt. Semantic labels
 *    via accessibilityLabel. Color is never the sole information carrier.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
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

// ─── Design System ────────────────────────────────────────────────────────────

const RADII = { sm: 10, md: 14, lg: 20, xl: 24, full: 9999 };
const UNIT = 8;
const sp = (n: number) => UNIT * n;

// Semantic palette — only reference these throughout
const COLOR = {
  // Brand
  navy: '#0A1628',
  indigo: '#1A2F5E',
  blue: '#2563EB',
  blueVivid: '#3B82F6',
  blueLight: '#DBEAFE',
  blueFrost: 'rgba(37,99,235,0.08)',

  // Accent
  emerald: '#10B981',
  emeraldLight: '#D1FAE5',
  amber: '#F59E0B',
  amberLight: '#FEF3C7',
  rose: '#F43F5E',
  roseLight: '#FFE4E6',
  whatsapp: '#25D366',
  whatsappLight: '#DCFCE7',

  // Neutral
  white: '#FFFFFF',
  grey50: '#F8FAFC',
  grey100: '#F1F5F9',
  grey150: '#E8EEF4',
  grey200: '#E2E8F0',
  grey300: '#CBD5E1',
  grey400: '#94A3B8',
  grey500: '#64748B',
  grey600: '#475569',
  grey700: '#334155',
  grey800: '#1E293B',
  grey900: '#0F172A',
  grey950: '#020617',
};

// Theme tokens
type ThemeTokens = typeof LIGHT_THEME;
const LIGHT_THEME = {
  bg: COLOR.grey50,
  bgElevated: COLOR.white,
  surface: COLOR.white,
  surfaceSub: COLOR.grey100,
  surfaceSub2: COLOR.grey150,
  border: COLOR.grey200,
  borderStrong: COLOR.grey300,
  text: COLOR.grey900,
  textSub: COLOR.grey600,
  textMuted: COLOR.grey400,
  primary: COLOR.blue,
  primaryFrost: COLOR.blueFrost,
  shadow: COLOR.grey400,
  isDark: false,
};

const DARK_THEME: ThemeTokens = {
  bg: '#0B0F1A',
  bgElevated: '#111827',
  surface: '#131C2E',
  surfaceSub: '#1A2540',
  surfaceSub2: '#1F2D4A',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.13)',
  text: '#EEF2FF',
  textSub: '#8B9FCC',
  textMuted: '#4B5E8A',
  primary: COLOR.blueVivid,
  primaryFrost: 'rgba(59,130,246,0.12)',
  shadow: '#000000',
  isDark: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Animation Hook ───────────────────────────────────────────────────────────

/**
 * Staggered section reveal — each child fades in + slides up with a delay.
 * Uses native driver for opacity + translateY — zero JS thread cost.
 */
function useSectionAnim(index: number, delay = 0) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 520,
      delay: index * 90 + delay,
      useNativeDriver: true,
    }).start();
  }, []);
  return {
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = memo(
  ({ width, height, radius = RADII.md, style }: {
    width: number | string; height: number; radius?: number; style?: any;
  }) => {
    const shimmer = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, { toValue: 1, duration: 750, useNativeDriver: true }),
          Animated.timing(shimmer, { toValue: 0, duration: 750, useNativeDriver: true }),
        ])
      ).start();
    }, []);
    return (
      <Animated.View
        style={[
          { width, height, borderRadius: radius, backgroundColor: COLOR.grey200, opacity: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.65] }) },
          style,
        ]}
      />
    );
  }
);

// ─── Pressable with spring feedback ──────────────────────────────────────────

const SpringPress = memo(
  ({ onPress, style, children, accessibilityLabel }: {
    onPress: () => void; style?: any; children: React.ReactNode; accessibilityLabel?: string;
  }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const handlePress = useCallback(() => {
      Animated.sequence([
        Animated.spring(scale, { toValue: 0.955, useNativeDriver: true, speed: 300, bounciness: 0 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 200, bounciness: 6 }),
      ]).start();
      onPress();
    }, [onPress]);

    return (
      <Pressable
        onPress={handlePress}
        style={style}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
      </Pressable>
    );
  }
);

// ─── Hero Glass Stat Chip ─────────────────────────────────────────────────────

const HeroStat = memo(
  ({ value, label }: { value: number; label: string }) => (
    <View style={heroStyles.statChip}>
      <Text style={heroStyles.statValue}>{value}</Text>
      <Text style={heroStyles.statLabel}>{label}</Text>
    </View>
  )
);

// ─── Quick Action Button ──────────────────────────────────────────────────────

const QuickAction = memo(
  ({ icon, label, onPress, tint, bg }: {
    icon: string; label: string; onPress: () => void; tint: string; bg: string;
  }) => (
    <SpringPress onPress={onPress} accessibilityLabel={label} style={styles.qaItem}>
      <View style={[styles.qaIconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={20} color={tint} />
      </View>
      <Text style={styles.qaLabel}>{label}</Text>
    </SpringPress>
  )
);

// ─── Scan Row ─────────────────────────────────────────────────────────────────

const ScanRow = memo(
  ({ scan, theme, isFirst, isLast }: {
    scan: any; theme: ThemeTokens; isFirst: boolean; isLast: boolean;
  }) => (
    <View style={[
      scanStyles.row,
      !isFirst && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
    ]}>
      {/* Timeline rail */}
      <View style={scanStyles.rail}>
        <View style={[scanStyles.dot, { backgroundColor: theme.primary }]} />
        {!isLast && <View style={[scanStyles.line, { backgroundColor: theme.border }]} />}
      </View>

      <View style={scanStyles.body}>
        <Text style={[scanStyles.location, { color: theme.text }]} numberOfLines={1}>
          {scan.location || 'Unknown Location'}
        </Text>
        <Text style={[scanStyles.time, { color: theme.textMuted }]}>
          {timeAgo(scan.timestamp)}
        </Text>
      </View>
      <View style={[scanStyles.badge, { backgroundColor: theme.primaryFrost }]}>
        <Ionicons name="scan-outline" size={13} color={theme.primary} />
      </View>
    </View>
  )
);

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader = memo(
  ({ title, cta, onCtaPress, badge, theme }: {
    title: string; cta?: string; onCtaPress?: () => void; badge?: number; theme: ThemeTokens;
  }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        {badge !== undefined && badge > 0 && (
          <View style={[styles.sectionBadge, { backgroundColor: theme.primaryFrost }]}>
            <Text style={[styles.sectionBadgeText, { color: theme.primary }]}>{badge}</Text>
          </View>
        )}
      </View>
      {cta && onCtaPress && (
        <Pressable
          onPress={onCtaPress}
          hitSlop={12}
          style={styles.ctaBtn}
          accessibilityLabel={`${cta} ${title}`}
          accessibilityRole="button"
        >
          <Text style={[styles.ctaText, { color: theme.primary }]}>{cta}</Text>
          <Ionicons name="chevron-forward" size={13} color={theme.primary} />
        </Pressable>
      )}
    </View>
  )
);

// ─── Card wrapper ─────────────────────────────────────────────────────────────

const Card = memo(
  ({ children, theme, style }: { children: React.ReactNode; theme: ThemeTokens; style?: any }) => (
    <View style={[
      cardStyles.card,
      {
        backgroundColor: theme.surface,
        borderColor: theme.border,
        shadowColor: theme.shadow,
      },
      style,
    ]}>
      {children}
    </View>
  )
);

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = memo(
  ({ icon, title, body, ctaLabel, onCta, iconBg, iconColor, theme }: {
    icon: string; title: string; body: string; ctaLabel?: string;
    onCta?: () => void; iconBg: string; iconColor: string; theme: ThemeTokens;
  }) => (
    <Card theme={theme} style={cardStyles.emptyCard}>
      <View style={[cardStyles.emptyIconRing, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={28} color={iconColor} />
      </View>
      <Text style={[cardStyles.emptyTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[cardStyles.emptyBody, { color: theme.textSub }]}>{body}</Text>
      {ctaLabel && onCta && (
        <SpringPress onPress={onCta} accessibilityLabel={ctaLabel}>
          <View style={[cardStyles.emptyCta, { backgroundColor: theme.primary }]}>
            <Text style={cardStyles.emptyCtaText}>{ctaLabel}</Text>
          </View>
        </SpringPress>
      )}
    </Card>
  )
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useThemeStore();
  const theme = mode === 'dark' ? DARK_THEME : LIGHT_THEME;
  const { user } = useAuthStore();
  const { tags, fetchTags, togglePrivacy, isLoading } = useTagStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchTags(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTags();
    setRefreshing(false);
  }, [fetchTags]);

  // Derived data — memoized to prevent recalculation on re-renders
  const totalScans = React.useMemo(
    () => tags.reduce((acc: number, t: any) => acc + (t.scans?.length ?? 0), 0),
    [tags]
  );
  const activeTags = React.useMemo(
    () => tags.filter((t: any) => !t.isPrivate).length,
    [tags]
  );
  const recentScans = React.useMemo(
    () => tags
      .flatMap((t: any) => t.scans ?? [])
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5),
    [tags]
  );

  // Staggered section animations
  const heroAnim = useSectionAnim(0);
  const actionsAnim = useSectionAnim(1, 60);
  const tagsAnim = useSectionAnim(2, 120);
  const scansAnim = useSectionAnim(3, 180);
  const promoAnim = useSectionAnim(4, 240);

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>

      {/* ══════════════════════════════════════
          HERO — Deep gradient with glass stats
         ══════════════════════════════════════ */}
      <Animated.View style={[heroStyles.heroWrap, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={
            mode === 'dark'
              ? ['#060D1F', '#0A1628', '#112244']
              : ['#0F2557', '#1A3A8F', '#2563EB']
          }
          locations={[0, 0.5, 1]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Decorative mesh orbs */}
        <View style={heroStyles.orb1} />
        <View style={heroStyles.orb2} />

        {/* Nav row */}
        <Animated.View style={[heroStyles.navRow, heroAnim]}>
          <View style={heroStyles.greetingCol}>
            <Text style={heroStyles.greeting}>{greeting()}</Text>
            <Text style={heroStyles.name} numberOfLines={1}>
              {user?.name || 'Driver'}
            </Text>
          </View>

          <Pressable
            style={heroStyles.notifBtn}
            onPress={() => { }}
            hitSlop={12}
            accessibilityLabel="Notifications"
            accessibilityRole="button"
          >
            <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.9)" />
            <View style={heroStyles.notifDot} />
          </Pressable>
        </Animated.View>

        {/* Glass stats row */}
        <Animated.View style={[heroStyles.statsRow, heroAnim]}>
          <HeroStat value={tags.length} label="Tags" />
          <View style={heroStyles.statsDivider} />
          <HeroStat value={totalScans} label="Scans" />
          <View style={heroStyles.statsDivider} />
          <HeroStat value={activeTags} label="Active" />
        </Animated.View>
      </Animated.View>

      {/* ══════════════════════════════════════
          SCROLLABLE CONTENT
         ══════════════════════════════════════ */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 110 },
        ]}
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

        {/* Admin shortcut */}
        {user?.role === 'admin' && (
          <Animated.View style={[actionsAnim, { marginBottom: sp(2) }]}>
            <Button
              title="Admin Dashboard"
              variant="outline"
              icon={<Ionicons name="shield-checkmark" size={18} color={theme.primary} />}
              onPress={() => router.push('/admin/dashboard' as any)}
            />
          </Animated.View>
        )}

        {/* ─── Quick Actions ─────────────────── */}
        <Animated.View style={[actionsAnim, styles.section]}>
          <Card theme={theme} style={styles.qaCard}>
            <QuickAction
              icon="call"
              label="Call"
              onPress={() => { }}
              tint={COLOR.blue}
              bg={COLOR.blueLight}
            />
            <QuickAction
              icon="logo-whatsapp"
              label="WhatsApp"
              onPress={() => { }}
              tint={COLOR.whatsapp}
              bg={COLOR.whatsappLight}
            />
            <QuickAction
              icon="document-text-outline"
              label="eTab"
              onPress={() => { }}
              tint={COLOR.amber}
              bg={COLOR.amberLight}
            />
            <QuickAction
              icon="alert-circle-outline"
              label="SOS"
              onPress={() => { }}
              tint={COLOR.rose}
              bg={COLOR.roseLight}
            />
          </Card>
        </Animated.View>

        {/* ─── Your Tags ─────────────────────── */}
        <Animated.View style={[tagsAnim, styles.section]}>
          <SectionHeader
            title="Your Tags"
            cta="View All"
            onCtaPress={() => router.push('/(tabs)/tags')}
            theme={theme}
          />

          {isLoading && !refreshing ? (
            /* Skeleton loading */
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[0, 1].map((k) => (
                <View key={k} style={{ marginRight: sp(2) }}>
                  <Skeleton width={280} height={148} radius={RADII.lg} />
                </View>
              ))}
              <Skeleton width={100} height={148} radius={RADII.lg} />
            </ScrollView>
          ) : tags.length === 0 ? (
            <EmptyState
              icon="car-sport-outline"
              title="No tags yet"
              body="Register your first tag to protect your vehicle and connect with others instantly."
              ctaLabel="Get a Tag"
              onCta={() => router.push('/(tabs)/shop')}
              iconBg={COLOR.blueLight}
              iconColor={COLOR.blue}
              theme={theme}
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={288 + sp(2)} // tag width + gap
              snapToAlignment="start"
              contentContainerStyle={styles.tagScrollContent}
            >
              {tags.map((tag: any) => (
                <View key={tag._id} style={styles.tagCardWrap}>
                  <TagCard
                    tag={tag}
                    onTogglePrivacy={togglePrivacy}
                    onPress={() =>
                      router.push({ pathname: '/tag/[id]', params: { id: tag._id } })
                    }
                  />
                </View>
              ))}
              {/* Add new tag tile */}
              <SpringPress
                onPress={() => router.push('/register-tag')}
                accessibilityLabel="Add new tag"
              >
                <View style={[styles.addTagTile, {
                  borderColor: theme.borderStrong,
                  backgroundColor: theme.surfaceSub,
                }]}>
                  <View style={[styles.addTagIconWrap, { backgroundColor: theme.primaryFrost }]}>
                    <Ionicons name="add" size={26} color={theme.primary} />
                  </View>
                  <Text style={[styles.addTagLabel, { color: theme.textSub }]}>
                    Add{'\n'}Tag
                  </Text>
                </View>
              </SpringPress>
            </ScrollView>
          )}
        </Animated.View>

        {/* ─── Recent Scans ──────────────────── */}
        <Animated.View style={[scansAnim, styles.section]}>
          <SectionHeader
            title="Recent Scans"
            badge={totalScans}
            theme={theme}
          />

          {recentScans.length === 0 ? (
            <EmptyState
              icon="eye-off-outline"
              title="No scans yet"
              body="When someone scans one of your tags, it'll appear here in real time."
              iconBg={theme.surfaceSub}
              iconColor={theme.textMuted}
              theme={theme}
            />
          ) : (
            <Card theme={theme}>
              {recentScans.map((scan: any, i: number) => (
                <ScanRow
                  key={`${scan.timestamp}-${i}`}
                  scan={scan}
                  theme={theme}
                  isFirst={i === 0}
                  isLast={i === recentScans.length - 1}
                />
              ))}
            </Card>
          )}
        </Animated.View>

        {/* ─── Promo Banner ──────────────────── */}
        <Animated.View style={[promoAnim, styles.section]}>
          <SpringPress
            onPress={() => router.push('/(tabs)/shop')}
            accessibilityLabel="Shop now - 20% off premium metal tags"
          >
            <View style={promoStyles.banner}>
              <LinearGradient
                colors={['#0C1F6B', '#1A3FAF', '#2563EB']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />

              {/* Decorative elements */}
              <View style={promoStyles.orb1} />
              <View style={promoStyles.orb2} />
              <View style={promoStyles.gridLine1} />
              <View style={promoStyles.gridLine2} />

              <View style={promoStyles.content}>
                <View style={promoStyles.pill}>
                  <Text style={promoStyles.pillText}>LIMITED OFFER</Text>
                </View>
                <Text style={promoStyles.discount}>20%{'\n'}OFF</Text>
                <Text style={promoStyles.subtitle}>Premium Metal Tags</Text>
                <View style={promoStyles.cta}>
                  <Text style={promoStyles.ctaText}>Shop Now</Text>
                  <Ionicons name="arrow-forward" size={14} color={COLOR.blue} />
                </View>
              </View>

              <View style={promoStyles.iconContainer}>
                <Ionicons name="pricetag" size={88} color="rgba(255,255,255,0.1)" />
              </View>
            </View>
          </SpringPress>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const { width: SW } = Dimensions.get('window');

// Root / scroll
const styles = StyleSheet.create({
  root: { flex: 1 },

  scrollContent: {
    paddingTop: sp(2.5),
    paddingHorizontal: sp(2),
  },

  section: {
    marginBottom: sp(3),
  },

  // Quick actions card
  qaCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: sp(2),
    paddingHorizontal: sp(0.5),
  },
  qaItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: sp(1),
    minHeight: 44,
    justifyContent: 'center',
    gap: sp(0.75),
  },
  qaIconWrap: {
    width: 52,
    height: 52,
    borderRadius: RADII.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLOR.grey500,
    letterSpacing: 0.15,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sp(1.5),
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(1),
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionBadge: {
    paddingHorizontal: sp(1),
    paddingVertical: 2,
    borderRadius: RADII.full,
    minWidth: 24,
    alignItems: 'center',
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 44,
    paddingHorizontal: sp(0.5),
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Tag horizontal list
  tagScrollContent: {
    paddingRight: sp(2),
  },
  tagCardWrap: {
    width: 288,
    marginRight: sp(2),
  },
  addTagTile: {
    width: 100,
    height: 148,
    borderRadius: RADII.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: sp(1),
  },
  addTagIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
});

// Card styles
const cardStyles = StyleSheet.create({
  card: {
    borderRadius: RADII.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },

  // Empty state card
  emptyCard: {
    padding: sp(3),
    alignItems: 'center',
  },
  emptyIconRing: {
    width: 60,
    height: 60,
    borderRadius: RADII.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: sp(2),
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: sp(0.75),
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 250,
    marginBottom: sp(2.5),
  },
  emptyCta: {
    paddingHorizontal: sp(3),
    paddingVertical: sp(1.5),
    borderRadius: RADII.md,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCtaText: {
    color: COLOR.white,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});

// Hero styles
const heroStyles = StyleSheet.create({
  heroWrap: {
    paddingHorizontal: sp(2),
    paddingBottom: sp(3),
    overflow: 'hidden',
  },
  orb1: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(99,130,255,0.12)',
    top: -80,
    right: -60,
  },
  orb2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(37,99,235,0.15)',
    bottom: -50,
    left: -40,
  },

  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: sp(1.5),
    marginBottom: sp(2.5),
  },
  greetingCol: { gap: 3 },
  greeting: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.2,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: COLOR.white,
    letterSpacing: -0.5,
    maxWidth: SW * 0.6,
  },

  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.13)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLOR.amber,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },

  // Glass stats pill
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: RADII.md + 2,
    paddingVertical: sp(1.5),
    paddingHorizontal: sp(1),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 21,
    fontWeight: '800',
    color: COLOR.white,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  statsDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});

// Scan timeline styles
const scanStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(2),
    paddingVertical: sp(1.5),
    gap: sp(1.5),
    minHeight: 56,
  },
  rail: {
    width: 18,
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  line: {
    flex: 1,
    width: 1.5,
    borderRadius: 1,
    marginTop: 2,
  },
  body: { flex: 1, gap: 2 },
  location: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  time: {
    fontSize: 12,
    fontWeight: '500',
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: RADII.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Promo banner styles
const promoStyles = StyleSheet.create({
  banner: {
    borderRadius: RADII.xl,
    overflow: 'hidden',
    minHeight: 190,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: sp(3),
    paddingRight: sp(2),
    paddingVertical: sp(3),
  },
  orb1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -70,
    right: -40,
  },
  orb2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -30,
    right: 60,
  },
  gridLine1: {
    position: 'absolute',
    width: 1,
    height: '180%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    right: '38%',
    transform: [{ rotate: '20deg' }],
  },
  gridLine2: {
    position: 'absolute',
    width: 1,
    height: '180%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    right: '52%',
    transform: [{ rotate: '20deg' }],
  },
  content: { flex: 1, gap: sp(0.75) },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: sp(1.25),
    paddingVertical: 3,
    borderRadius: RADII.full,
    marginBottom: sp(0.5),
  },
  pillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: COLOR.white,
  },
  discount: {
    fontSize: 44,
    fontWeight: '900',
    color: COLOR.white,
    letterSpacing: -2,
    lineHeight: 48,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginBottom: sp(1),
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: COLOR.white,
    paddingHorizontal: sp(2),
    paddingVertical: sp(1.25),
    borderRadius: RADII.md,
    minHeight: 44,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLOR.blue,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
  },
});