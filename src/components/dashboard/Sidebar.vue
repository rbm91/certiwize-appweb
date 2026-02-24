<script setup>
import { ref, computed, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../../stores/auth';

const route = useRoute();
const { t } = useI18n();
const authStore = useAuthStore();

// Track which menu is hovered and its position
const hoveredMenu = ref(null);
const submenuStyle = ref({});

const baseNavigation = [
  { name: 'dashboard', href: '/dashboard', icon: 'pi-home' },
  {
    name: 'tiers',
    href: '/dashboard/tiers',
    icon: 'pi-users',
    submenu: [
      { name: 'tiers_list', href: '/dashboard/tiers', icon: 'pi-list' },
      { name: 'learners', href: '/dashboard/learners', icon: 'pi-user' }
    ]
  },
  { name: 'catalogue', href: '/dashboard/catalogue', icon: 'pi-book' },
  {
    name: 'projects',
    href: '/dashboard/projets',
    icon: 'pi-briefcase',
    submenu: [
      { name: 'formations', href: '/dashboard/projets', icon: 'pi-graduation-cap' },
      { name: 'conseil', href: '#', icon: 'pi-comments', disabled: true }
    ]
  },
  { name: 'analysis', href: '/dashboard/analyse-doc', icon: 'pi-search' },
  { name: 'manual', href: '/dashboard/manuel-qualiopi', icon: 'pi-book' },
  { name: 'genedoc', href: 'https://qualiopi-modelisation.genedoc.fr/', icon: 'pi-link' },
  {
    name: 'settings',
    href: '/dashboard/company',
    icon: 'pi-cog',
    submenu: [
      { name: 'company_settings', href: '/dashboard/company', icon: 'pi-building' },
      { name: 'quiz_settings', href: '/dashboard/quiz-settings', icon: 'pi-question-circle' }
    ]
  },
];

// Admin-only menu item
const adminNavItem = { name: 'admin', href: '/dashboard/admin', icon: 'pi-shield', adminOnly: true };

// Computed navigation based on user role
const navigation = computed(() => {
  if (authStore.isAdmin) {
    return [...baseNavigation, adminNavItem];
  }
  return baseNavigation;
});

const isCurrent = (path) => {
  if (path === '/dashboard') {
    return route.path === '/dashboard'; 
  }
  return route.path.startsWith(path);
};

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
    <div class="p-6 flex items-center justify-center border-b border-slate-800">
      <h1 class="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Certiwize</h1>
    </div>

    <nav class="flex-1 p-4 space-y-2">
      <div
        v-for="item in navigation"
        :key="item.name"
        class="relative"
        @mouseenter="item.submenu ? handleMouseEnter($event, item.name) : null"
        @mouseleave="handleMouseLeave"
      >
        <!-- Main Menu Item -->
        <a
          :href="item.submenu ? undefined : item.href"
          :target="item.href?.startsWith('http') ? '_blank' : undefined"
          :rel="item.href?.startsWith('http') ? 'noopener noreferrer' : undefined"
          class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group no-underline cursor-pointer"
          :class="[
            isCurrent(item.href)
              ? 'bg-primary text-white shadow-lg shadow-primary/25'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          ]"
          @click="item.submenu ? $event.preventDefault() : null"
        >
          <i class="pi" :class="[item.icon, isCurrent(item.href) ? 'text-white' : 'text-slate-400 group-hover:text-white']"></i>
          <span class="font-medium flex-1">{{ t(`nav.${item.name}`) }}</span>
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
    </nav>
  </div>
</template>

<style scoped>
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
