import { Tabs } from 'expo-router';

import { KomiTabBar, type KomiTabBarProps } from '@/components/navigation/KomiTabBar';
import { Colors } from '@/constants/theme';

export default function TabsLayout() {
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
          title: 'Recettes',
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'Courses',
        }}
      />
    </Tabs>
  );
}
