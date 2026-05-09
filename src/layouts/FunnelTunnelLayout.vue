<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const mobileOpen = ref(false);

const navLinks = [
  { to: '/funnels/tunnel-1-outils', label: 'Outils & Organisation' },
  { to: '/funnels/tunnel-2-audit', label: "Prêt pour l'audit" },
  { to: '/funnels/tunnel-3-structure', label: 'Structuration' },
  { to: '/funnels/tunnel-4-options', label: 'Options & Tarifs' },
  { to: '/funnels/tunnel-5-tarifs', label: 'Tarifs & Pricing' },
];

watch(() => route.fullPath, () => { mobileOpen.value = false; });

const year = new Date().getFullYear();
</script>

<template>
  <div class="min-h-screen flex flex-col" style="font-family: var(--font-funnel);">
    <!-- ─── Navbar ─── -->
    <header class="fixed top-0 left-0 right-0 z-50 backdrop-blur-md" style="background-color: rgba(27, 27, 58, 0.95);">
      <div class="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <router-link to="/funnels" class="flex items-center shrink-0">
          <span class="text-xl font-bold text-white tracking-tight">Certi</span>
          <span class="text-xl italic tracking-tight" style="font-family: var(--font-serif); color: var(--color-gold);">gestion</span>
        </router-link>

        <nav class="hidden md:flex items-center gap-1">
          <router-link
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            v-slot="{ isActive, navigate }"
            custom
          >
            <a
              @click="navigate"
              class="px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer"
              :class="isActive
                ? 'border'
                : 'text-white/70 border border-transparent hover:opacity-80'"
              :style="isActive
                ? { background: 'rgba(212, 160, 60, 0.15)', borderColor: 'var(--color-gold)', color: 'var(--color-gold)' }
                : {}"
            >
              {{ link.label }}
            </a>
          </router-link>
        </nav>

        <div class="flex items-center gap-3">
          <router-link
            to="/funnels/tunnel-1-outils"
            class="btn-outline-gold hidden sm:inline-flex"
            style="padding: 0.5rem 1.25rem; font-size: 0.75rem;"
          >
            Voir la démo
          </router-link>

          <button
            type="button"
            class="md:hidden p-2 text-white/80 hover:text-white transition-colors"
            aria-label="Menu"
            @click="mobileOpen = !mobileOpen"
          >
            <i :class="mobileOpen ? 'pi pi-times' : 'pi pi-bars'" style="font-size: 1.25rem;" />
          </button>
        </div>
      </div>

      <!-- Mobile -->
      <div v-if="mobileOpen" class="md:hidden border-t border-white/10" style="background: var(--color-navy);">
        <nav class="flex flex-col px-4 py-4 gap-1">
          <router-link
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            v-slot="{ isActive, navigate }"
            custom
          >
            <a
              @click="navigate"
              class="px-4 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              :class="isActive
                ? ''
                : 'text-white/70 hover:text-white hover:bg-white/5'"
              :style="isActive
                ? { background: 'rgba(212, 160, 60, 0.15)', color: 'var(--color-gold)' }
                : {}"
            >
              {{ link.label }}
            </a>
          </router-link>
          <router-link
            to="/funnels/tunnel-1-outils"
            class="btn-outline-gold mt-3 justify-center"
            style="font-size: 0.75rem;"
          >
            Voir la démo
          </router-link>
        </nav>
      </div>
    </header>

    <!-- Content -->
    <main class="flex-1 pt-16">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="$route.fullPath" />
        </transition>
      </router-view>
    </main>

    <!-- Footer -->
    <footer style="background: var(--color-navy);" class="px-6 py-14">
      <div class="mx-auto max-w-6xl">
        <div class="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <router-link to="/funnels" class="flex items-center">
            <span class="text-xl font-bold text-white tracking-tight">Certi</span>
            <span class="text-xl italic tracking-tight" style="font-family: var(--font-serif); color: var(--color-gold);">gestion</span>
          </router-link>

          <nav class="flex flex-wrap justify-center gap-6 text-sm text-white/50">
            <router-link
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="hover:opacity-80 transition-colors"
              style="--hover-color: var(--color-gold);"
            >
              {{ link.label }}
            </router-link>
          </nav>
        </div>
        <div class="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          © {{ year }} Certigestion. Tous droits réservés.
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
