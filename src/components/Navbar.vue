<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useThemeStore } from '../stores/theme';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Menu from 'primevue/menu';

const { t, locale } = useI18n();
const themeStore = useThemeStore();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const isScrolled = ref(false);
const profileMenu = ref();
const isMobileMenuOpen = ref(false);

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

// Close mobile menu on route change
watch(() => route.path, () => {
  isMobileMenuOpen.value = false;
});

const toggleLanguage = () => {
  const newLocale = locale.value === 'fr' ? 'en' : 'fr';
  locale.value = newLocale;
  localStorage.setItem('user-locale', newLocale);
};

const logout = async () => {
  await authStore.signOut();
  window.location.href = '/';
};

const profileMenuItems = computed(() => [
  {
    label: t('navbar.settings'),
    icon: 'pi pi-cog',
    command: () => router.push('/settings')
  },
  {
    separator: true
  },
  {
    label: t('navbar.logout'),
    icon: 'pi pi-sign-out',
    command: logout
  }
]);

const toggleProfileMenu = (event) => {
  profileMenu.value.toggle(event);
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};
</script>

<template>
  <nav 
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    :class="isScrolled || isMobileMenuOpen
      ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-md border-b border-gray-200 dark:border-gray-700' 
      : 'bg-transparent border-b border-transparent'"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center cursor-pointer" @click="router.push('/')">
          <img src="/certiwize-logo.png" alt="Certiwize Logo" class="h-10 w-auto" />
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-4">

          
          <router-link 
            v-if="!authStore.user" 
            to="/login" 
            class="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md transition"
          >
            {{ t('nav.login') }}
          </router-link>

          <div v-else class="flex items-center gap-2">
            <a 
              href="/dashboard"
              class="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md transition"
            >
              {{ t('nav.dashboard') }}
            </a>
            
            <!-- Bouton Profil avec menu déroulant -->
            <button 
              @click="toggleProfileMenu"
              class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-primary hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              <i class="pi pi-user"></i>
            </button>
            <Menu ref="profileMenu" :model="profileMenuItems" popup />
          </div>

          <div class="flex items-center border-l pl-4 ml-4 space-x-2 border-gray-300 dark:border-gray-600">
            <button 
              @click="themeStore.toggleDark()" 
              class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <i :class="themeStore.isDark ? 'pi pi-sun' : 'pi pi-moon'" class="text-lg"></i>
            </button>
            
            <button 
              @click="toggleLanguage" 
              class="p-2 font-bold text-sm hover:text-primary transition"
            >
              {{ locale.toUpperCase() }}
            </button>
          </div>
        </div>

        <!-- Mobile Menu Button -->
        <div class="md:hidden flex items-center gap-2">
          <button 
            @click="themeStore.toggleDark()" 
            class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <i :class="themeStore.isDark ? 'pi pi-sun' : 'pi pi-moon'" class="text-lg"></i>
          </button>
          
          <button 
            @click="toggleMobileMenu"
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <i :class="isMobileMenuOpen ? 'pi pi-times' : 'pi pi-bars'" class="text-xl"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu Panel -->
    <div 
      v-if="isMobileMenuOpen"
      class="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg"
    >
      <div class="px-4 py-4 space-y-3">

        
        <template v-if="!authStore.user">
          <router-link 
            to="/login" 
            class="block py-3 px-4 bg-primary text-white rounded-lg text-center font-semibold"
          >
            {{ t('nav.login') }}
          </router-link>
        </template>

        <template v-else>
          <router-link 
            to="/dashboard" 
            class="block py-3 px-4 bg-primary text-white rounded-lg text-center font-semibold"
          >
            <i class="pi pi-th-large mr-2"></i>{{ t('nav.dashboard') }}
          </router-link>
          
          <router-link 
            to="/settings" 
            class="block py-3 px-4 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <i class="pi pi-cog mr-3"></i>{{ t('navbar.settings') }}
          </router-link>
          
          <button 
            @click="logout"
            class="w-full py-3 px-4 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
          >
            <i class="pi pi-sign-out mr-3"></i>{{ t('navbar.logout') }}
          </button>
        </template>

        <div class="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-center">
          <button 
            @click="toggleLanguage" 
            class="px-4 py-2 font-bold text-sm hover:text-primary transition border border-gray-300 dark:border-gray-600 rounded-lg"
          >
            {{ locale === 'fr' ? '🇫🇷 Français' : '🇬🇧 English' }}
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>