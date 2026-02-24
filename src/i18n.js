import { createI18n } from 'vue-i18n';
import fr from './locales/fr.json';
import en from './locales/en.json';

// Récupérer la locale de manière sûre
const getInitialLocale = () => {
  try {
    return localStorage.getItem('user-locale') || 'fr';
  } catch {
    return 'fr';
  }
};

const i18n = createI18n({
  legacy: false, // Vue 3 Composition API
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  messages: { fr, en },
  globalInjection: true
});

export default i18n;