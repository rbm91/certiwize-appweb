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


// Initialiser l'auth avant de monter l'app
const authStore = useAuthStore();
authStore.initializeAuth().then(() => {
    app.mount('#app');
});