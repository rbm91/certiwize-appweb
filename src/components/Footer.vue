<script setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="bg-gray-900 text-gray-300 border-t border-gray-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Logo et description -->
        <div class="col-span-1 md:col-span-2">
          <img src="/certiwize-logo.png" alt="Certiwize Logo" class="h-10 w-auto mb-4" />
          <p class="text-gray-400 max-w-md">
            {{ t('footer.description') }}
          </p>
        </div>

        <!-- Liens rapides -->
        <div>
          <h3 class="font-semibold text-white mb-4">{{ t('footer.navigation') }}</h3>
          <ul class="space-y-2">
            <li>
              <router-link to="/" class="hover:text-primary transition">
                {{ t('nav.home') }}
              </router-link>
            </li>
            <li>
              <router-link to="/features" class="hover:text-primary transition">
                {{ t('nav.features') }}
              </router-link>
            </li>
            <li>
              <router-link to="/contact" class="hover:text-primary transition">
                {{ t('nav.contact') }}
              </router-link>
            </li>
            <li>
              <router-link to="/faq" class="hover:text-primary transition">
                {{ t('nav.faq') }}
              </router-link>
            </li>
            <li>
              <router-link to="/login" class="hover:text-primary transition">
                {{ t('nav.login') }}
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div>
          <h3 class="font-semibold text-white mb-4">{{ t('footer.contact_title') }}</h3>
          <ul class="space-y-2">
            <li class="flex items-center">
              <i class="pi pi-envelope mr-2 text-primary"></i>
              <span>contact@certiwize.com</span>
            </li>
            <li class="flex items-start">
              <i class="pi pi-map-marker mr-2 text-primary mt-1"></i>
              <span>{{ t('footer.location') }}</span>
            </li>
          </ul>
          
          <!-- Réseaux sociaux -->
          <div class="flex space-x-4 mt-6">
            <a href="#" class="w-10 h-10 bg-gray-800 hover:bg-primary rounded-full flex items-center justify-center transition">
              <i class="pi pi-linkedin"></i>
            </a>
            <a href="#" class="w-10 h-10 bg-gray-800 hover:bg-primary rounded-full flex items-center justify-center transition">
              <i class="pi pi-twitter"></i>
            </a>
          </div>
        </div>
      </div>

      <!-- Copyright -->
      <div class="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
        <p>&copy; {{ currentYear }} Certiwize. {{ t('footer.copyright') }}</p>
      </div>
    </div>
  </footer>
</template>