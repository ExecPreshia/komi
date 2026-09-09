import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CartIcon } from '@/components/ui/icons';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useKomiStore } from '@/store/komi-store';

/** Phase 1 shell — full Courses UI arrives in Phase 5. */
export default function ShoppingScreen() {
  const itemCount = useKomiStore((state) => state.shoppingList.length);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Liste de courses</Text>
      </View>

      {itemCount === 0 ? (
        <View style={styles.empty}>
          <CartIcon color={Colors.accent} size={40} />
          <Text style={styles.emptyText}>
            Votre liste est vide. Ajoutez les ingrédients manquants depuis une recette ou ajoutez-les
            manuellement ici.
          </Text>
        </View>
      ) : (
        <Text style={styles.body}>{itemCount} article(s)</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  title: {
    ...Typography.section,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.four,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  body: {
    ...Typography.body,
    paddingHorizontal: Spacing.four,
  },
});
