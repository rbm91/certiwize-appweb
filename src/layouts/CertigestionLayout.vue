<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const route = useRoute();
const router = useRouter();

const navLinks = [
  { path: '/landing', label: 'Accueil' },
  { path: '/landing/offres', label: 'Offres' },
  { path: '/landing/fonctionnalites', label: 'Fonctionnalités' },
  { path: '/landing/diagnostic', label: 'Diagnostic' },
  { path: '/landing/preuves', label: 'Preuves' },
  { path: '/landing/contact', label: 'Contact' },
];

const footerNav = navLinks;
const footerServices = [
  { path: '/landing/fonctionnalites', label: 'Gestion OF' },
  { path: '/landing/fonctionnalites', label: 'CRM Formation' },
  { path: '/landing/fonctionnalites', label: 'Qualité Qualiopi' },
  { path: '/landing/fonctionnalites', label: 'Audit blanc' },
  { path: '/landing/fonctionnalites', label: 'IA & Automatisation' },
];

const scrolled = ref(false);
const menuOpen = ref(false);

function onScroll() {
  scrolled.value = window.scrollY > 20;
}
onMounted(() => window.addEventListener('scroll', onScroll));
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll));
watch(() => route.fullPath, () => { menuOpen.value = false; });

function isActive(path) {
  return route.path === path;
}

const year = new Date().getFullYear();
</script>

<template>
  <div class="min-h-screen flex flex-col" style="font-family: var(--font-editorial);">
    <!-- ─── Navigation ─── -->
    <header
      class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-gray-100"
      :class="scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-white'"
    >
      <div class="marketing-container">
        <div class="flex items-center justify-between h-16 lg:h-[72px]">
          <!-- Logo -->
          <button
            type="button"
            class="flex items-center gap-2 flex-shrink-0 cursor-pointer"
            @click="router.push('/landing')"
          >
            <div
              class="w-9 h-9 flex items-center justify-center"
              style="background: var(--color-editorial-green);"
            >
              <span class="text-white font-bold text-sm" style="font-family: var(--font-serif);">CG</span>
            </div>
            <span class="text-xl font-bold text-gray-900" style="font-family: var(--font-serif);">
              Certigestion
            </span>
          </button>

          <!-- Desktop nav -->
          <nav class="hidden lg:flex items-center gap-5 mx-6">
            <router-link
              v-for="link in navLinks"
              :key="link.path"
              :to="link.path"
              class="text-sm transition-colors duration-200"
              :style="{
                color: isActive(link.path) ? 'var(--color-editorial-green)' : '#444',
                fontWeight: isActive(link.path) ? 600 : 400,
              }"
            >
              {{ link.label }}
            </router-link>
          </nav>

          <!-- Desktop CTA -->
          <div class="hidden lg:flex items-center gap-3 flex-shrink-0">
            <router-link to="/landing/contact" class="editorial-btn-outline" style="white-space: nowrap;">
              Échange gratuit
            </router-link>
            <router-link to="/landing/diagnostic" class="editorial-btn-primary" style="padding: 0.5rem 1.25rem; font-size: 0.875rem; white-space: nowrap; border-radius: 4px;">
              Tester mon niveau Qualiopi
            </router-link>
          </div>

          <!-- Mobile menu button -->
          <button
            type="button"
            class="lg:hidden p-2 text-gray-700"
            aria-label="Menu"
            @click="menuOpen = !menuOpen"
          >
            <i :class="menuOpen ? 'pi pi-times' : 'pi pi-bars'" style="font-size: 1.25rem;" />
          </button>
        </div>
      </div>

      <!-- Mobile menu -->
      <div v-if="menuOpen" class="lg:hidden bg-white border-t border-gray-100 shadow-lg">
        <div class="marketing-container py-4 flex flex-col gap-1">
          <router-link
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            class="py-3 px-2 text-sm font-medium border-b border-gray-50"
            :style="{
              color: isActive(link.path) ? 'var(--color-editorial-green)' : '#444',
              fontWeight: isActive(link.path) ? 600 : 400,
            }"
          >
            {{ link.label }}
          </router-link>
          <div class="pt-3 flex flex-col gap-2">
            <router-link to="/landing/contact" class="editorial-btn-outline justify-center text-center">
              Échange gratuit
            </router-link>
            <router-link to="/landing/diagnostic" class="editorial-btn-primary justify-center text-center" style="border-radius: 4px;">
              Tester mon niveau Qualiopi
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <!-- ─── Page content ─── -->
    <main class="flex-1 pt-16 lg:pt-[72px]">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="$route.fullPath" />
        </transition>
      </router-view>
    </main>

    <!-- ─── Footer ─── -->
    <footer class="section-dark">
      <div class="marketing-container py-16">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <!-- Brand -->
          <div class="lg:col-span-1">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 flex items-center justify-center" style="background: var(--color-editorial-green);">
                <span class="text-white font-bold text-sm" style="font-family: var(--font-serif);">CG</span>
              </div>
              <span class="text-xl font-bold text-white" style="font-family: var(--font-serif);">Certigestion</span>
            </div>
            <p class="text-gray-400 text-sm leading-relaxed mb-6">
              Certigestion structure votre organisme de formation en continu. Preuves accessibles, process clairs, organisation fiable.
            </p>
            <a
              href="https://www.linkedin.com/company/certigestion"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <i class="pi pi-linkedin" /> LinkedIn
            </a>
          </div>

          <!-- Navigation -->
          <div>
            <h4 class="text-white font-semibold mb-4 text-sm tracking-wide uppercase">Navigation</h4>
            <ul class="space-y-2">
              <li v-for="link in footerNav" :key="link.path">
                <router-link :to="link.path" class="text-gray-400 hover:text-white transition-colors text-sm">
                  {{ link.label }}
                </router-link>
              </li>
            </ul>
          </div>

          <!-- Services -->
          <div>
            <h4 class="text-white font-semibold mb-4 text-sm tracking-wide uppercase">Services</h4>
            <ul class="space-y-2">
              <li v-for="(service, i) in footerServices" :key="i">
                <router-link :to="service.path" class="text-gray-400 hover:text-white transition-colors text-sm">
                  {{ service.label }}
                </router-link>
              </li>
            </ul>
          </div>

          <!-- Contact -->
          <div>
            <h4 class="text-white font-semibold mb-4 text-sm tracking-wide uppercase">Contact</h4>
            <ul class="space-y-3">
              <li>
                <a href="tel:+33745089227" class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                  <i class="pi pi-phone text-xs" /> +33 7 45 08 92 27
                </a>
              </li>
              <li>
                <a href="tel:+33678066156" class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                  <i class="pi pi-phone text-xs" /> +33 6 78 06 61 56
                </a>
              </li>
              <li>
                <a href="mailto:contact@certigestion.fr" class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                  <i class="pi pi-envelope text-xs" /> contact@certigestion.fr
                </a>
              </li>
              <li>
                <div class="flex items-start gap-2 text-gray-400 text-sm">
                  <i class="pi pi-map-marker text-xs mt-0.5 flex-shrink-0" /> Paris et périphérie
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- Pont Certiwize -->
        <div class="border-t border-gray-700 mt-10 pt-6">
          <router-link to="/landing/certiwize" class="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            Besoin d'une transformation complète ? <i class="pi pi-arrow-right text-xs" /> Certiwize
          </router-link>
        </div>

        <!-- Bottom -->
        <div class="border-t border-gray-700 mt-6 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p class="text-gray-500 text-xs">© {{ year }} Certigestion. Tous droits réservés.</p>
          <div class="flex gap-6">
            <router-link to="/landing/mentions-legales" class="text-gray-500 hover:text-gray-300 text-xs transition-colors">Mentions légales</router-link>
            <router-link to="/landing/politique-confidentialite" class="text-gray-500 hover:text-gray-300 text-xs transition-colors">Politique de confidentialité</router-link>
            <router-link to="/landing/cgv" class="text-gray-500 hover:text-gray-300 text-xs transition-colors">CGV</router-link>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
