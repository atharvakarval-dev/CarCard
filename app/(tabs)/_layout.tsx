import { Tabs } from 'expo-router';
import { TabBar } from '../../components/shared/TabBar';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';

export default function TabLayout() {
  const { mode } = useThemeStore();
  const theme = colors[mode === 'dark' ? 'dark' : 'light'];

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="tags"
        options={{
          title: 'My Tags',
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
