import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../locales/en.json';
import ka from '../locales/ka.json';

export const LANG_KEY = '@climbing_trainer_lang';
export type AppLanguage = 'en' | 'ka';

const deviceLang = Localization.getLocales()[0]?.languageCode;

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ka: { translation: ka },
  },
  lng: deviceLang === 'ka' ? 'ka' : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  initImmediate: false,
});

// Call this in App.tsx useEffect to restore user's saved language
export const loadStoredLanguage = async (): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(LANG_KEY);
    if (stored === 'en' || stored === 'ka') {
      await i18n.changeLanguage(stored);
    }
  } catch {
    // ignore
  }
};

export const setLanguage = async (lang: AppLanguage): Promise<void> => {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(LANG_KEY, lang);
  } catch {
    // ignore
  }
};

export const DAY_KEYS = [
  'days.monday',
  'days.tuesday',
  'days.wednesday',
  'days.thursday',
  'days.friday',
  'days.saturday',
  'days.sunday',
] as const;

export default i18n;
