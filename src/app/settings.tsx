import { type Href, Stack, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseIcon } from '@/components/ui/form-icons';
import { KomiActionSheet } from '@/components/ui/KomiActionSheet';
import { useTranslation } from '@/i18n/useTranslation';
import type { AppLocale } from '@/i18n/types';
import { useKomiStore } from '@/store/komi-store';
import { getAppVersion } from '@/utils/app-version';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t, locale, setLocale } = useTranslation();
  const timerSoundEnabled = useKomiStore((state) => state.timerSoundEnabled);
  const setTimerSoundEnabled = useKomiStore((state) => state.setTimerSoundEnabled);
  const version = getAppVersion();
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);

  function selectLocale(next: AppLocale) {
    setLocale(next);
    setLanguageSheetOpen(false);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={() => router.back()}
          style={styles.closeButton}>
          <CloseIcon />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>{t('settings.sectionPreferences')}</Text>
        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('settings.language')}
            onPress={() => setLanguageSheetOpen(true)}
            style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{t('settings.language')}</Text>
              <Text style={styles.rowValue}>
                {locale === 'fr' ? t('settings.languageFr') : t('settings.languageEn')}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{t('settings.timerSound')}</Text>
              <Text style={styles.rowValue}>
                {timerSoundEnabled ? t('settings.timerSoundOn') : t('settings.timerSoundOff')}
              </Text>
            </View>
            <Switch
              value={timerSoundEnabled}
              onValueChange={setTimerSoundEnabled}
              trackColor={{ false: Colors.line, true: '#F0C8C6' }}
              thumbColor={timerSoundEnabled ? Colors.accent : Colors.white}
              ios_backgroundColor={Colors.line}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t('settings.sectionAbout')}</Text>
        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('settings.aboutKomi')}
            onPress={() => router.push('/about' as Href)}
            style={styles.row}>
            <Text style={[styles.rowTitle, styles.rowText]}>{t('settings.aboutKomi')}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>
      </View>

      <Text style={[styles.versionFooter, { paddingBottom: Math.max(insets.bottom, Spacing.four) }]}>
        {version}
      </Text>

      <KomiActionSheet
        visible={languageSheetOpen}
        onClose={() => setLanguageSheetOpen(false)}
        cancelLabel={t('common.cancel')}
        items={[
          {
            label: t('settings.languageFr'),
            onPress: () => selectLocale('fr'),
          },
          {
            label: t('settings.languageEn'),
            onPress: () => selectLocale('en'),
          },
        ]}
      />
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
    fontFamily: Fonts.sansBold,
    fontSize: 28,
    color: Colors.text,
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
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  versionFooter: {
    textAlign: 'center',
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text,
    opacity: 0.5,
  },
  sectionLabel: {
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.line,
    overflow: 'hidden',
  },
  row: {
    minHeight: 56,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    color: Colors.text,
  },
  rowValue: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textMuted,
  },
  chevron: {
    fontFamily: Fonts.sansBold,
    fontSize: 22,
    color: Colors.textMuted,
    marginTop: -2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.line,
    marginLeft: Spacing.four,
  },
});
