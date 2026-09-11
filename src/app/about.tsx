import { Stack, router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseIcon } from '@/components/ui/form-icons';
import { useTranslation } from '@/i18n/useTranslation';
import type { TranslationKey } from '@/i18n';
import { getAppVersion } from '@/utils/app-version';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

const FEATURES: { label: TranslationKey; body: TranslationKey }[] = [
  {
    label: 'settings.aboutFeatureCarnetLabel',
    body: 'settings.aboutFeatureCarnetBody',
  },
  {
    label: 'settings.aboutFeatureMenuLabel',
    body: 'settings.aboutFeatureMenuBody',
  },
  {
    label: 'settings.aboutFeatureCookLabel',
    body: 'settings.aboutFeatureCookBody',
  },
  {
    label: 'settings.aboutFeatureNotesLabel',
    body: 'settings.aboutFeatureNotesBody',
  },
  {
    label: 'settings.aboutFeatureShoppingLabel',
    body: 'settings.aboutFeatureShoppingBody',
  },
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const version = getAppVersion();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />

      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.aboutTitle')}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={() => router.back()}
          style={styles.closeButton}>
          <CloseIcon />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.tagline}>{t('settings.aboutTagline')}</Text>

        <View style={styles.block}>
          <Text style={styles.body}>{t('settings.aboutIntro1')}</Text>
          <Text style={styles.body}>{t('settings.aboutIntro2')}</Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.sectionTitle}>{t('settings.aboutFeaturesTitle')}</Text>
          {FEATURES.map((feature) => (
            <Text key={feature.label} style={styles.body}>
              <Text style={styles.featureLabel}>{t(feature.label)} : </Text>
              {t(feature.body)}
            </Text>
          ))}
        </View>

        <View style={styles.block}>
          <Text style={styles.sectionTitle}>{t('settings.aboutTechTitle')}</Text>
          <Text style={styles.body}>{t('settings.aboutTechStack')}</Text>
          <Text style={styles.body}>{t('settings.aboutTechLocal')}</Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.sectionTitle}>{t('settings.aboutDesignerTitle')}</Text>
          <Text style={styles.body}>{t('settings.aboutDesignerBody')}</Text>
        </View>

        <Text style={styles.version}>
          {t('settings.version')} {version}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  title: {
    flex: 1,
    fontFamily: Fonts.sansBold,
    fontSize: 28,
    color: Colors.text,
    paddingRight: Spacing.three,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: Radii.pill,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.seven,
    gap: Spacing.five,
  },
  block: {
    gap: Spacing.three,
  },
  tagline: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 18,
    lineHeight: 26,
    color: Colors.text,
  },
  sectionTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    lineHeight: 24,
    color: Colors.text,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
  },
  featureLabel: {
    fontFamily: Fonts.bodyMedium,
  },
  version: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.textMuted,
  },
});
