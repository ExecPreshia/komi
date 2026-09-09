import { type Href, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KomiLogo } from '@/components/brand/KomiLogo';
import { PinnedRecipeCard } from '@/components/home/PinnedRecipeCard';
import { RecipeListCard } from '@/components/home/RecipeListCard';
import { TagFilterRow } from '@/components/home/TagFilterRow';
import { SearchField } from '@/components/ui/SearchField';
import { GearIcon } from '@/components/ui/icons';
import { PinIcon } from '@/components/ui/PinIcon';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useKomiStore } from '@/store/komi-store';

export default function HomeScreen() {
  const recipes = useKomiStore((state) => state.recipes);
  const togglePin = useKomiStore((state) => state.togglePin);

  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const recipe of recipes) {
      for (const tag of recipe.tags) set.add(tag);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [recipes]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return recipes.filter((recipe) => {
      if (selectedTag && !recipe.tags.includes(selectedTag)) return false;
      if (!normalizedQuery) return true;
      const inTitle = recipe.title.toLowerCase().includes(normalizedQuery);
      const inTags = recipe.tags.some((tag) => tag.includes(normalizedQuery));
      const inIngredients = recipe.ingredients.some((item) =>
        item.name.toLowerCase().includes(normalizedQuery),
      );
      return inTitle || inTags || inIngredients;
    });
  }, [recipes, query, selectedTag]);

  const pinned = filtered.filter((recipe) => recipe.isPinned);
  const list = filtered;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <KomiLogo width={87} height={32} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Paramètres"
          style={styles.settingsButton}
          onPress={() => router.push('/settings' as Href)}>
          <GearIcon color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.searchBlock}>
          <SearchField value={query} onChangeText={setQuery} />
        </View>

        {allTags.length > 0 ? (
          <TagFilterRow tags={allTags} selectedTag={selectedTag} onSelect={setSelectedTag} />
        ) : null}

        {recipes.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Mes recettes</Text>
            <Text style={styles.emptyBody}>
              Aucune recette pour le moment. Appuyez sur + pour ajouter une saisie manuelle.
            </Text>
          </View>
        ) : (
          <>
            {pinned.length > 0 ? (
              <View style={styles.pinnedSection}>
                <View style={styles.sectionHeader}>
                  <PinIcon active size={16} />
                  <Text style={styles.sectionTitle}>Au menu</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pinnedRow}>
                  {pinned.map((recipe) => (
                    <PinnedRecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onPressPin={() => togglePin(recipe.id)}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.listSection}>
              <Text style={styles.sectionTitle}>Mes recettes</Text>
              {list.length === 0 ? (
                <Text style={styles.emptyBody}>Aucune recette ne correspond à votre recherche.</Text>
              ) : (
                <View style={styles.list}>
                  {list.map((recipe) => (
                    <RecipeListCard
                      key={recipe.id}
                      recipe={recipe}
                      onPressPin={() => togglePin(recipe.id)}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  settingsButton: {
    width: 47,
    height: 47,
    borderRadius: Radii.pill,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.seven,
    gap: Spacing.four,
  },
  searchBlock: {
    paddingHorizontal: Spacing.four,
  },
  empty: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    gap: Spacing.two,
  },
  emptyTitle: {
    ...Typography.section,
  },
  emptyBody: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  pinnedSection: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  sectionTitle: {
    ...Typography.section,
  },
  pinnedRow: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  listSection: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  list: {
    gap: Spacing.three,
  },
});
