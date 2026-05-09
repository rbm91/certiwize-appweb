<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const sidebarOpen = ref(false);
const collapsed = ref(false);

const navItems = [
  { to: '/dashboard/admin/funnels', label: 'Tableau de bord', icon: 'pi pi-th-large', exact: true },
  { to: '/dashboard/admin/funnels/list', label: 'Tunnels', icon: 'pi pi-list', exact: false },
];

function isActive(item) {
  if (item.exact) return route.path === item.to;
  return route.path.startsWith(item.to);
}

watch(() => route.fullPath, () => { sidebarOpen.value = false; });

const year = new Date().getFullYear();
</script>

<template>
  <div class="flex h-screen overflow-hidden" style="font-family: var(--font-funnel);">
    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-black/40 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-40 flex flex-col text-white transition-all duration-300 lg:static border-r border-gray-800"
      :class="[
        collapsed ? 'w-[68px]' : 'w-64',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ]"
      style="background: #242566;"
    >
      <!-- Header -->
      <div class="flex h-16 items-center justify-between px-4">
        <span v-if="!collapsed" class="text-lg font-bold tracking-tight">Funnels Admin</span>
        <button
          type="button"
          class="hidden rounded p-1 hover:bg-white/10 lg:flex"
          @click="collapsed = !collapsed"
        >
          <i class="pi pi-chevron-left transition-transform" :class="{ 'rotate-180': collapsed }" />
        </button>
        <button
          type="button"
          class="rounded p-1 hover:bg-white/10 lg:hidden"
          @click="sidebarOpen = false"
        >
          <i class="pi pi-times" />
        </button>
      </div>

      <!-- Nav -->
      <nav class="mt-4 flex flex-1 flex-col gap-1 px-3">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
          :class="[
            isActive(item) ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white',
            collapsed ? 'justify-center' : '',
          ]"
        >
          <i :class="item.icon" />
          <span v-if="!collapsed">{{ item.label }}</span>
        </router-link>

        <!-- Back to main dashboard -->
        <button
          type="button"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-white/60 hover:bg-white/10 hover:text-white mt-auto"
          :class="collapsed ? 'justify-center' : ''"
          @click="router.push('/dashboard')"
        >
          <i class="pi pi-arrow-left" />
          <span v-if="!collapsed">Retour Dashboard</span>
        </button>
      </nav>

      <!-- Footer -->
      <div v-if="!collapsed" class="border-t border-white/10 px-4 py-3 text-xs text-white/40">
        © {{ year }} Certigestion
      </div>
    </aside>

    <!-- Main -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <header class="flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 lg:px-6">
        <button
          type="button"
          class="rounded p-1 hover:bg-gray-100 lg:hidden"
          @click="sidebarOpen = true"
        >
          <i class="pi pi-bars text-gray-700 text-xl" />
        </button>
        <h1 class="text-lg font-semibold text-gray-800">Administration des tunnels</h1>
      </header>

      <main class="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="$route.fullPath" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
