<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';

const { t } = useI18n();
const router = useRouter();
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="flex items-center cursor-pointer" @click="router.push('/')">
            <span class="text-2xl font-bold text-primary">Certiwize</span>
          </div>

          <!-- Navigation -->
          <nav class="flex items-center space-x-4">
            <Button
              :label="t('nav.login')"
              text
              @click="router.push('/login')"
              class="text-gray-700 dark:text-gray-300 hover:text-primary"
            />
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="$route.fullPath" />
        </transition>
      </router-view>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Company Info -->
          <div>
            <h3 class="text-white text-lg font-bold mb-4">Certiwize</h3>
            <p class="text-sm">{{ t('footer.description') }}</p>
          </div>

          <!-- Navigation Links -->
          <div>
            <h4 class="text-white text-sm font-semibold mb-4">{{ t('footer.navigation') }}</h4>
            <ul class="space-y-2 text-sm">
              <li><a href="#" class="hover:text-white transition-colors">{{ t('nav.features') }}</a></li>
              <li><a href="/pricing" class="hover:text-white transition-colors">{{ t('pricing.title') }}</a></li>
              <li><a href="#" class="hover:text-white transition-colors">{{ t('nav.faq') }}</a></li>
              <li><a href="#" class="hover:text-white transition-colors">{{ t('nav.contact') }}</a></li>
            </ul>
          </div>

          <!-- Contact -->
          <div>
            <h4 class="text-white text-sm font-semibold mb-4">{{ t('footer.contact_title') }}</h4>
            <p class="text-sm">{{ t('footer.location') }}</p>
          </div>
        </div>

        <div class="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          <p>&copy; {{ new Date().getFullYear() }} Certiwize. {{ t('footer.copyright') }}</p>
        </div>
      </div>
    </footer>
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
