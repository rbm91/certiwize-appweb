<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useLayoutStore } from '../stores/layout';
import { useNavConfigStore } from '../stores/navConfig';
import Sidebar from '../components/dashboard/Sidebar.vue';
import TopNavbar from '../components/dashboard/TopNavbar.vue';
import TopnavSidebar from '../components/dashboard/TopnavSidebar.vue';

const BUILD_VERSION = 'v5-' + new Date().toISOString().slice(0, 16);
console.log('[DashboardLayout]', BUILD_VERSION, 'mounted');

const authStore = useAuthStore();
const layoutStore = useLayoutStore();
const navConfigStore = useNavConfigStore();
const route = useRoute();

// Diagnostic : détecter les problèmes d'auth
const showAuthWarning = computed(() => {
  return authStore.initialized && !authStore.user;
});

const showInitWarning = computed(() => {
  return !authStore.initialized;
});

// Charger la config de navigation au démarrage du dashboard
onMounted(() => {
  // Log diagnostic au montage
  console.log('[DashboardLayout] Auth state:', {
    initialized: authStore.initialized,
    user: !!authStore.user,
    userId: authStore.user?.id,
    email: authStore.user?.email,
    org: authStore.currentOrganization?.name || 'none',
    role: authStore.userRole,
  });

  navConfigStore.fetchConfig();
});

// Mobile sidebar state (sidebar mode only)
const isMobileSidebarOpen = ref(false);

const toggleMobileSidebar = () => {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value;
};

const closeMobileSidebar = () => {
  isMobileSidebarOpen.value = false;
};

// Close mobile sidebar on route change
watch(() => route.path, () => {
  closeMobileSidebar();
});
</script>

<template>
  <!-- TOPNAV MODE -->
  <div v-if="layoutStore.isTopnav" class="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
    <TopNavbar />
    <div class="flex flex-1 overflow-hidden">
      <!-- Left sidebar (Dolibarr-style) -->
      <aside class="hidden md:block flex-shrink-0">
        <TopnavSidebar />
      </aside>
      <!-- Main content -->
      <main class="flex-1 overflow-y-auto overflow-x-hidden">
        <!-- Auth warning banners -->
        <div v-if="showAuthWarning" class="m-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
          <div class="flex items-center gap-3">
            <i class="pi pi-exclamation-triangle text-2xl text-red-600"></i>
            <div>
              <p class="font-bold text-red-700 dark:text-red-400">Session expirée ou non connecté</p>
              <p class="text-sm text-red-600 dark:text-red-300 mt-1">Vous devez vous connecter pour accéder au dashboard.</p>
              <a href="/login" class="inline-block mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">Se connecter</a>
            </div>
          </div>
        </div>
        <div v-if="showInitWarning" class="m-4 p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
          <div class="flex items-center gap-3">
            <i class="pi pi-spin pi-spinner text-xl text-yellow-600"></i>
            <p class="text-yellow-700 dark:text-yellow-400">Initialisation de l'authentification en cours...</p>
          </div>
        </div>
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="$route.fullPath" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>

  <!-- SIDEBAR MODE -->
  <div v-else class="flex h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Mobile Menu Button -->
    <button
      @click="toggleMobileSidebar"
      class="md:hidden fixed top-4 left-4 z-50 p-3 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-slate-800 transition-colors"
    >
      <i :class="isMobileSidebarOpen ? 'pi pi-times' : 'pi pi-bars'" class="text-lg"></i>
    </button>

    <!-- Mobile Sidebar Overlay -->
    <div
      v-if="isMobileSidebarOpen"
      @click="closeMobileSidebar"
      class="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
    ></div>

    <!-- Mobile Sidebar -->
    <aside
      class="md:hidden fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out"
      :class="isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <Sidebar />
    </aside>

    <!-- Desktop Sidebar Fixed -->
    <aside class="hidden md:block h-screen sticky top-0">
      <Sidebar />
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto overflow-x-hidden">
      <!-- Spacer for mobile menu button -->
      <div class="md:hidden h-16"></div>

      <!-- Auth warning banners -->
      <div v-if="showAuthWarning" class="m-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
        <div class="flex items-center gap-3">
          <i class="pi pi-exclamation-triangle text-2xl text-red-600"></i>
          <div>
            <p class="font-bold text-red-700 dark:text-red-400">Session expirée ou non connecté</p>
            <p class="text-sm text-red-600 dark:text-red-300 mt-1">Vous devez vous connecter pour accéder au dashboard.</p>
            <a href="/login" class="inline-block mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">Se connecter</a>
          </div>
        </div>
      </div>
      <div v-if="showInitWarning" class="m-4 p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
        <div class="flex items-center gap-3">
          <i class="pi pi-spin pi-spinner text-xl text-yellow-600"></i>
          <p class="text-yellow-700 dark:text-yellow-400">Initialisation de l'authentification en cours...</p>
        </div>
      </div>

      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="$route.fullPath" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
