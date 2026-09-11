import { type Href, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookIcon, CartIcon } from '@/components/ui/icons';
import { ToastBottomAnchor } from '@/components/ui/KomiToast';
import { Colors, Fonts, Radii, Shadows, Spacing, TabBarHeight, Typography } from '@/constants/theme';
import { useTranslation } from '@/i18n/useTranslation';
import { useKomiStore } from '@/store/komi-store';

/** Raised + FAB overhang above the tab bar layout box. */
const TAB_FAB_RISE = 28;

type TabRoute = {
  key: string;
  name: string;
};

export type KomiTabBarProps = {
  state: {
    index: number;
    routes: TabRoute[];
  };
  navigation: {
    emit: (event: {
      type: 'tabPress';
      target: string;
      canPreventDefault: boolean;
    }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
};

export function KomiTabBar({ state, navigation }: KomiTabBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Spacing.two);
  const uncheckedCount = useKomiStore(
    (store) => store.shoppingList.filter((item) => !item.isChecked).length,
  );

  const recipesRoute = state.routes.find((route) => route.name === 'index');
  const shoppingRoute = state.routes.find((route) => route.name === 'shopping');
  const activeName = state.routes[state.index]?.name;
  const recipesFocused = activeName === 'index';
  const shoppingFocused = activeName === 'shopping';

  return (
    <ToastBottomAnchor
      id="tab-bar"
      extraTop={TAB_FAB_RISE}
      style={[styles.wrapper, { paddingBottom: bottomPad }]}>
      <View style={styles.bar}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: recipesFocused }}
          accessibilityLabel={t('tabs.recipes')}
          style={styles.sideTab}
          onPress={() => {
            if (!recipesRoute) return;
            const event = navigation.emit({
              type: 'tabPress',
              target: recipesRoute.key,
              canPreventDefault: true,
            });
            if (!recipesFocused && !event.defaultPrevented) {
              navigation.navigate(recipesRoute.name);
            }
          }}>
          <BookIcon filled={recipesFocused} />
          <Text style={[styles.label, recipesFocused && styles.labelActive]}>{t('tabs.recipes')}</Text>
        </Pressable>

        <View style={styles.fabSlot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('tabs.newRecipeA11y')}
            style={styles.fab}
            onPress={() => router.push('/recipe/new' as Href)}>
            <Text style={styles.fabLabel}>+</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: shoppingFocused }}
          accessibilityLabel={t('tabs.shopping')}
          style={styles.sideTab}
          onPress={() => {
            if (!shoppingRoute) return;
            const event = navigation.emit({
              type: 'tabPress',
              target: shoppingRoute.key,
              canPreventDefault: true,
            });
            if (!shoppingFocused && !event.defaultPrevented) {
              navigation.navigate(shoppingRoute.name);
            }
          }}>
          <View style={styles.coursesIconWrap}>
            <CartIcon filled={shoppingFocused} />
            {uncheckedCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeLabel}>{uncheckedCount > 99 ? '99+' : uncheckedCount}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.label, shoppingFocused && styles.labelActive]}>{t('tabs.shopping')}</Text>
        </Pressable>
      </View>
    </ToastBottomAnchor>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.line,
  },
  bar: {
    minHeight: TabBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.five,
  },
  sideTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  label: {
    ...Typography.tab,
    color: Colors.text,
  },
  labelActive: {
    color: Colors.accent,
  },
  fabSlot: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 58,
    height: 58,
    marginTop: -28,
    borderRadius: Radii.fab,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  fabLabel: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: '400',
    marginTop: -2,
  },
  coursesIconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: Radii.pill,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.white,
  },
});
