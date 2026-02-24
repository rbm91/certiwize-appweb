// ── Polyfill structuredClone pour Safari < 15.4 ──
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import Tooltip from 'primevue/tooltip';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

import App from './App.vue';
import router from './router'; // Import router d'abord
import i18n from './i18n';
import './style.css';
import { useAuthStore } from './stores/auth'; // Import store après createPinia
import { initSentry } from './lib/sentry';

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.use(router);
app.use(i18n);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.dark',
        }
    }
});

// Enregistrer la directive Tooltip globalement
app.directive('tooltip', Tooltip);
app.use(ConfirmationService);
app.use(ToastService);

// Initialiser Sentry pour le monitoring d'erreurs (nécessite VITE_SENTRY_DSN)
initSentry(app, router);

// Initialiser l'auth avant de monter l'app (avec timeout de sécurité)
const authStore = useAuthStore();

const AUTH_TIMEOUT_MS = 5000; // 5 secondes max pour l'auth

const authWithTimeout = Promise.race([
    authStore.initializeAuth(),
    new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth initialization timeout after 5s')), AUTH_TIMEOUT_MS)
    )
]);

authWithTimeout
    .catch((err) => {
        console.warn('[Main] Auth initialization failed (running without Supabase):', err.message);
    })
    .finally(() => {
        app.mount('#app');
    });
