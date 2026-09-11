import { Tabs } from 'expo-router';

import { KomiTabBar, type KomiTabBarProps } from '@/components/navigation/KomiTabBar';
import { Colors } from '@/constants/theme';
import { useTranslation } from '@/i18n/useTranslation';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => (
        <KomiTabBar
          state={props.state}
          navigation={props.navigation as KomiTabBarProps['navigation']}
        />
      )}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: Colors.primary },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.recipes'),
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: t('tabs.shopping'),
        }}
      />
    </Tabs>
  );
}
