<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../../stores/auth';
import { useNavigation } from '../../composables/useNavigation';
import LayoutToggleButton from './LayoutToggleButton.vue';

const { t } = useI18n();
const authStore = useAuthStore();
const { navigation, isCurrent } = useNavigation();

const hoveredMenu = ref(null);
const submenuStyle = ref({});

const handleMouseEnter = (event, itemName) => {
  const rect = event.currentTarget.getBoundingClientRect();
  submenuStyle.value = {
    top: `${rect.top}px`,
    left: `${rect.right + 8}px`
  };
  hoveredMenu.value = itemName;
};

const handleMouseLeave = () => {
  hoveredMenu.value = null;
};

const logout = async () => {
  await authStore.signOut();
  window.location.href = '/';
};
</script>

<template>
  <div class="flex flex-col h-full bg-slate-900 w-64 text-white">
    <div class="p-6 flex flex-col items-center justify-center border-b border-slate-800 gap-2">
      <h1 class="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Certiwize</h1>
      <!-- Nom de l'organisation courante -->
      <div v-if="authStore.currentOrganization" class="w-full">
        <select
          v-if="authStore.organizations.length > 1"
          :value="authStore.currentOrganization?.id"
          @change="authStore.switchOrganization($event.target.value)"
          class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option v-for="org in authStore.organizations" :key="org.id" :value="org.id">{{ org.name }}</option>
        </select>
        <p v-else class="text-xs text-slate-400 text-center truncate">{{ authStore.currentOrganization.name }}</p>
      </div>
    </div>

    <nav class="flex-1 p-4 space-y-2 flex flex-col">
      <div class="flex-1 space-y-2">
      <div
        v-for="item in navigation"
        :key="item.name"
        class="relative"
        @mouseenter="item.submenu ? handleMouseEnter($event, item.name) : null"
        @mouseleave="handleMouseLeave"
      >
        <!-- Main Menu Item -->
        <a
          :href="item.disabled ? undefined : (item.submenu ? undefined : item.href)"
          :target="item.href?.startsWith('http') ? '_blank' : undefined"
          :rel="item.href?.startsWith('http') ? 'noopener noreferrer' : undefined"
          class="sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group no-underline"
          :class="[
            item.disabled
              ? 'text-slate-600 cursor-not-allowed'
              : (!item.href?.startsWith('http') && isCurrent(item.href))
                ? 'bg-primary text-white shadow-lg shadow-primary/25 cursor-pointer'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer'
          ]"
          @click="item.disabled ? $event.preventDefault() : (item.submenu ? $event.preventDefault() : null)"
        >
          <i class="pi" :class="[item.icon, item.disabled ? 'text-slate-600' : (!item.href?.startsWith('http') && isCurrent(item.href)) ? 'text-white' : 'text-slate-400 group-hover:text-white']"></i>
          <span class="font-medium flex-1">{{ t(`nav.${item.name}`) }}</span>
          <span v-if="item.disabled" class="text-xs bg-slate-700 px-1.5 py-0.5 rounded">{{ t('nav.coming_soon') }}</span>
          <i v-if="item.submenu" class="pi pi-chevron-right text-xs opacity-50"></i>
        </a>

        <!-- Submenu (rendered via Teleport to body for proper z-index) -->
        <Teleport to="body">
          <transition name="submenu-fade">
            <div
              v-if="item.submenu && hoveredMenu === item.name"
              class="fixed w-48 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 py-2"
              :style="{ ...submenuStyle, zIndex: 99999 }"
              @mouseenter="hoveredMenu = item.name"
              @mouseleave="handleMouseLeave"
            >
              <a
                v-for="sub in item.submenu"
                :key="sub.name"
                :href="sub.disabled ? undefined : sub.href"
                class="flex items-center gap-3 px-4 py-2.5 transition-all no-underline"
                :class="[
                  sub.disabled
                    ? 'text-slate-500 cursor-not-allowed'
                    : isCurrent(sub.href)
                      ? 'text-primary bg-slate-700/50'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer'
                ]"
                @click="sub.disabled ? $event.preventDefault() : null"
              >
                <i class="pi" :class="sub.icon"></i>
                <span class="text-sm">{{ t(`nav.${sub.name}`) }}</span>
                <span v-if="sub.disabled" class="ml-auto text-xs bg-slate-600 px-1.5 py-0.5 rounded">{{ t('nav.coming_soon') }}</span>
              </a>
            </div>
          </transition>
        </Teleport>
      </div>
      </div>

      <!-- Layout Toggle at bottom -->
      <div class="pt-4 border-t border-slate-800">
        <LayoutToggleButton />
      </div>
    </nav>
  </div>
</template>

<style scoped>
/* Forcer la couleur des liens visités dans la sidebar */
.sidebar-link,
.sidebar-link:visited,
.sidebar-link:link {
  color: inherit !important;
}

.submenu-fade-enter-active,
.submenu-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.submenu-fade-enter-from,
.submenu-fade-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>
