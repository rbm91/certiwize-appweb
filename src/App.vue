<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import Navbar from './components/Navbar.vue';
import ChatWidget from './components/ChatWidget.vue';
import Toast from 'primevue/toast';
import { useAuthStore } from './stores/auth';

const authStore = useAuthStore();
const { locale } = useI18n();

// Timestamp du dernier rafraîchissement pour éviter les rafraîchissements trop fréquents
let lastRefresh = Date.now();
const MIN_REFRESH_INTERVAL = 30000; // 30 secondes minimum entre les rafraîchissements

// Handler pour quand l'onglet redevient visible
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible') {
    const now = Date.now();
    // Rafraîchir seulement si assez de temps s'est écoulé
    if (now - lastRefresh > MIN_REFRESH_INTERVAL) {
      lastRefresh = now;
      // Rafraîchir la session auth avec gestion d'erreur
      if (authStore.initialized && authStore.user) {
        try {
          await authStore.refreshSession();
        } catch (err) {
          console.warn('[App] Failed to refresh session on visibility change:', err);
          // Ne pas bloquer l'UI si le refresh échoue
        }
      }
    }
  }
};

// Handler pour les changements de localStorage dans d'autres onglets
const handleStorageChange = (event) => {
  // Synchroniser la langue entre onglets
  if (event.key === 'user-locale' && event.newValue) {
    locale.value = event.newValue;
  }
};

onMounted(() => {
  // Écouter les changements de visibilité de l'onglet
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Écouter les changements de localStorage (déclenché par d'autres onglets)
  window.addEventListener('storage', handleStorageChange);
});

onUnmounted(() => {
  // Nettoyer les listeners
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('storage', handleStorageChange);

  // Cleanup du store auth
  authStore.cleanup();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300 flex flex-col">
    <Navbar />

    <main class="flex-grow pt-16">
      <router-view />
    </main>

    <Toast />

    <ChatWidget />
  </div>
</template>
