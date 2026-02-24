<script setup>
import { ref, nextTick, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useNavigation } from '../../composables/useNavigation';
import { useLayoutStore } from '../../stores/layout';
import { useAuthStore } from '../../stores/auth';
import { useNavConfigStore } from '../../stores/navConfig';
import { useI18n } from 'vue-i18n';
import draggable from 'vuedraggable';

const { topNavigation, navigation, isCurrent, getLabel } = useNavigation();
const layoutStore = useLayoutStore();
const authStore = useAuthStore();
const navConfigStore = useNavConfigStore();
const route = useRoute();
const { t } = useI18n();

const openDropdown = ref(null);
const dropdownTimeout = ref(null);
const isMobileMenuOpen = ref(false);

// --- Admin: rename ---
const editingNavItem = ref(null);
const editingLabel = ref('');
const renameInput = ref(null);

const startRename = (item) => {
  editingNavItem.value = item.name;
  editingLabel.value = getLabel(item.name);
  nextTick(() => {
    renameInput.value?.focus();
    renameInput.value?.select();
  });
};

const saveRename = async (item) => {
  if (editingNavItem.value !== item.name) return; // déjà fermé
  const label = editingLabel.value.trim();
  if (label && label !== getLabel(item.name)) {
    await navConfigStore.updateLabel(item.name, label);
  }
  editingNavItem.value = null;
};

const cancelRename = () => {
  editingNavItem.value = null;
};

// --- Admin: drag-drop reorder ---
const navItems = ref([]);

watch(topNavigation, (items) => {
  navItems.value = [...items];
}, { immediate: true });

const onDragEnd = async () => {
  const newOrder = navItems.value.map(item => item.name);
  await navConfigStore.updateOrder(newOrder);
};

// --- Standard nav logic ---
const handleMouseEnter = (itemName) => {
  clearTimeout(dropdownTimeout.value);
  openDropdown.value = itemName;
};

const handleMouseLeave = () => {
  dropdownTimeout.value = setTimeout(() => {
    openDropdown.value = null;
  }, 150);
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
  openDropdown.value = null;
};

const logout = async () => {
  await authStore.signOut();
  window.location.href = '/';
};

// Close mobile menu on route change + recalcul flèches
watch(() => route.path, () => {
  closeMobileMenu();
  nextTick(updateScrollArrows);
});

const handleClickOutside = (event) => {
  if (!event.target.closest('.topnav-dropdown')) {
    openDropdown.value = null;
  }
};

// --- Scroll avec flèches ---
const navScrollContainer = ref(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

const updateScrollArrows = () => {
  const el = navScrollContainer.value?.$el || navScrollContainer.value;
  if (!el) return;
  canScrollLeft.value = el.scrollLeft > 0;
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
};

const scrollNav = (direction) => {
  const el = navScrollContainer.value?.$el || navScrollContainer.value;
  if (!el) return;
  const amount = 200;
  el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  setTimeout(updateScrollArrows, 350);
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  nextTick(() => {
    updateScrollArrows();
    const el = navScrollContainer.value?.$el || navScrollContainer.value;
    if (el) el.addEventListener('scroll', updateScrollArrows);
  });
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  clearTimeout(dropdownTimeout.value);
  const el = navScrollContainer.value?.$el || navScrollContainer.value;
  if (el) el.removeEventListener('scroll', updateScrollArrows);
});
</script>

<template>
  <header class="bg-slate-900 text-white shadow-lg w-full z-40 flex-shrink-0">
    <!-- Top bar -->
    <div class="flex items-center h-14 px-4">
      <!-- Logo -->
      <div class="flex-shrink-0 mr-6">
        <h1 class="text-lg font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
          Certiwize
        </h1>
      </div>

      <!-- Flèche gauche -->
      <button
        v-show="canScrollLeft"
        @click="scrollNav('left')"
        class="hidden lg:flex items-center justify-center w-7 h-7 flex-shrink-0 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition mr-1"
      >
        <i class="pi pi-chevron-left text-xs"></i>
      </button>

      <!-- ========== Desktop Nav: Admin (draggable + rename) ========== -->
      <draggable
        v-if="authStore.isSuperAdmin"
        ref="navScrollContainer"
        v-model="navItems"
        item-key="name"
        tag="nav"
        class="hidden lg:flex items-center flex-1 space-x-1 overflow-x-auto scrollbar-hide"
        handle=".nav-drag-handle"
        ghost-class="opacity-30"
        @end="onDragEnd"
      >
        <template #item="{ element: item }">
          <div
            class="relative topnav-dropdown group/nav flex items-center"
            @mouseenter="item.submenu ? handleMouseEnter(item.name) : null"
            @mouseleave="item.submenu ? handleMouseLeave() : null"
          >
            <!-- Drag handle (admin only, visible on hover) -->
            <i class="nav-drag-handle pi pi-grip-vertical text-slate-500
                      cursor-grab opacity-0 group-hover/nav:opacity-60
                      transition-opacity text-xs mr-0.5"></i>

            <a
              :href="item.disabled ? undefined : item.href"
              :target="item.external ? '_blank' : undefined"
              :rel="item.external ? 'noopener noreferrer' : undefined"
              class="topnav-link flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                     transition-all duration-200 no-underline"
              :class="[
                item.disabled
                  ? 'text-slate-500 cursor-not-allowed'
                  : (!item.external && isCurrent(item.href))
                    ? 'bg-primary text-white shadow-md cursor-pointer'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer'
              ]"
              @click="item.disabled ? $event.preventDefault() : null"
            >
              <i class="pi text-sm" :class="item.icon"></i>

              <!-- Inline rename input -->
              <input
                v-if="editingNavItem === item.name"
                ref="renameInput"
                v-model="editingLabel"
                @blur="saveRename(item)"
                @keyup.enter="saveRename(item)"
                @keyup.escape="cancelRename"
                @click.stop
                class="bg-transparent border-b border-blue-400 text-white
                       text-sm font-medium outline-none min-w-[2rem] max-w-[12rem]"
                :size="Math.max(editingLabel.length, 4)"
              />

              <!-- Normal label display -->
              <span v-else class="font-medium whitespace-nowrap">{{ getLabel(item.name) }}</span>

              <!-- Rename pencil icon (admin, visible on hover) -->
              <i
                v-if="editingNavItem !== item.name"
                class="pi pi-pencil text-xs text-slate-500 hover:text-white
                       cursor-pointer opacity-0 group-hover/nav:opacity-60
                       transition-opacity ml-0.5"
                @click.stop.prevent="startRename(item)"
              ></i>

              <span v-if="item.disabled" class="text-xs bg-slate-700 px-1.5 py-0.5 rounded ml-1">{{ getLabel('coming_soon') }}</span>
              <i v-if="item.submenu" class="pi pi-chevron-down text-xs opacity-60 ml-0.5"></i>
            </a>

            <!-- Dropdown submenu -->
            <transition name="dropdown-fade">
              <div
                v-if="item.submenu && openDropdown === item.name"
                class="absolute top-full left-0 mt-1 w-52 bg-slate-800
                       rounded-xl shadow-2xl border border-slate-700 py-2 z-50"
                @mouseenter="handleMouseEnter(item.name)"
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
                  <span class="text-sm">{{ getLabel(sub.name) }}</span>
                  <span v-if="sub.disabled" class="ml-auto text-xs bg-slate-600 px-1.5 py-0.5 rounded">
                    {{ getLabel('coming_soon') }}
                  </span>
                </a>
              </div>
            </transition>
          </div>
        </template>
      </draggable>

      <!-- ========== Desktop Nav: Non-admin (static, identical to original) ========== -->
      <nav v-else ref="navScrollContainer" class="hidden lg:flex items-center flex-1 space-x-1 overflow-x-auto scrollbar-hide">
        <div
          v-for="item in topNavigation"
          :key="item.name"
          class="relative topnav-dropdown"
          @mouseenter="item.submenu ? handleMouseEnter(item.name) : null"
          @mouseleave="item.submenu ? handleMouseLeave() : null"
        >
          <a
            :href="item.disabled ? undefined : item.href"
            :target="item.external ? '_blank' : undefined"
            :rel="item.external ? 'noopener noreferrer' : undefined"
            class="topnav-link flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                   transition-all duration-200 no-underline"
            :class="[
              item.disabled
                ? 'text-slate-500 cursor-not-allowed'
                : (!item.external && isCurrent(item.href))
                  ? 'bg-primary text-white shadow-md cursor-pointer'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer'
            ]"
            @click="item.disabled ? $event.preventDefault() : null"
          >
            <i class="pi text-sm" :class="item.icon"></i>
            <span class="font-medium whitespace-nowrap">{{ getLabel(item.name) }}</span>
            <span v-if="item.disabled" class="text-xs bg-slate-700 px-1.5 py-0.5 rounded ml-1">{{ getLabel('coming_soon') }}</span>
            <i v-if="item.submenu" class="pi pi-chevron-down text-xs opacity-60 ml-0.5"></i>
          </a>

          <!-- Dropdown submenu -->
          <transition name="dropdown-fade">
            <div
              v-if="item.submenu && openDropdown === item.name"
              class="absolute top-full left-0 mt-1 w-52 bg-slate-800
                     rounded-xl shadow-2xl border border-slate-700 py-2 z-50"
              @mouseenter="handleMouseEnter(item.name)"
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
                <span class="text-sm">{{ getLabel(sub.name) }}</span>
                <span v-if="sub.disabled" class="ml-auto text-xs bg-slate-600 px-1.5 py-0.5 rounded">
                  {{ getLabel('coming_soon') }}
                </span>
              </a>
            </div>
          </transition>
        </div>
      </nav>

      <!-- Flèche droite -->
      <button
        v-show="canScrollRight"
        @click="scrollNav('right')"
        class="hidden lg:flex items-center justify-center w-7 h-7 flex-shrink-0 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition ml-1"
      >
        <i class="pi pi-chevron-right text-xs"></i>
      </button>

      <!-- Right side: layout toggle + logout -->
      <div class="hidden lg:flex items-center gap-2 ml-auto">
        <button
          @click="layoutStore.toggleLayout()"
          class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          :title="layoutStore.isSidebar ? t('layout.toggle_topnav') : t('layout.toggle_sidebar')"
        >
          <i class="pi pi-arrows-v text-sm"></i>
        </button>
        <button
          @click="logout"
          class="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
        >
          <i class="pi pi-sign-out text-sm"></i>
        </button>
      </div>

      <!-- Mobile: hamburger -->
      <button
        @click="toggleMobileMenu"
        class="lg:hidden ml-auto p-2 text-white"
      >
        <i :class="isMobileMenuOpen ? 'pi pi-times' : 'pi pi-bars'" class="text-lg"></i>
      </button>
    </div>

    <!-- Mobile dropdown panel -->
    <transition name="slide-down">
      <div v-if="isMobileMenuOpen" class="lg:hidden bg-slate-800 border-t border-slate-700">
        <nav class="p-3 space-y-1">
          <template v-for="item in navigation" :key="item.name">
            <a
              :href="item.submenu ? undefined : item.href"
              :target="item.external ? '_blank' : undefined"
              class="flex items-center gap-3 px-4 py-3 rounded-lg transition no-underline"
              :class="[
                isCurrent(item.href)
                  ? 'bg-primary text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              ]"
              @click="item.submenu ? (openDropdown = openDropdown === item.name ? null : item.name) : closeMobileMenu()"
            >
              <i class="pi" :class="item.icon"></i>
              <span class="font-medium flex-1">{{ getLabel(item.name) }}</span>
              <i v-if="item.submenu"
                 class="pi text-xs transition-transform duration-200"
                 :class="openDropdown === item.name ? 'pi-chevron-up' : 'pi-chevron-down'"
              ></i>
            </a>
            <!-- Mobile submenu accordion -->
            <div v-if="item.submenu && openDropdown === item.name" class="pl-6 space-y-1">
              <a
                v-for="sub in item.submenu"
                :key="sub.name"
                :href="sub.disabled ? undefined : sub.href"
                class="flex items-center gap-3 px-4 py-2.5 rounded-lg transition no-underline"
                :class="[
                  sub.disabled
                    ? 'text-slate-500 cursor-not-allowed'
                    : isCurrent(sub.href)
                      ? 'text-primary'
                      : 'text-slate-400 hover:text-white'
                ]"
                @click="!sub.disabled ? closeMobileMenu() : $event.preventDefault()"
              >
                <i class="pi" :class="sub.icon"></i>
                <span class="text-sm">{{ getLabel(sub.name) }}</span>
              </a>
            </div>
          </template>

          <!-- Mobile: layout toggle + logout -->
          <div class="border-t border-slate-700 mt-2 pt-2 space-y-1">
            <button
              @click="layoutStore.toggleLayout(); closeMobileMenu()"
              class="flex items-center gap-3 px-4 py-3 rounded-lg transition w-full
                     text-slate-300 hover:bg-slate-700"
            >
              <i class="pi pi-arrows-v"></i>
              <span class="font-medium">{{ t('layout.toggle_sidebar') }}</span>
            </button>
            <button
              @click="logout"
              class="flex items-center gap-3 px-4 py-3 rounded-lg transition w-full
                     text-red-400 hover:bg-slate-700"
            >
              <i class="pi pi-sign-out"></i>
              <span class="font-medium">{{ t('nav.logout') }}</span>
            </button>
          </div>
        </nav>
      </div>
    </transition>
  </header>
</template>

<style scoped>
/* Forcer la couleur des liens visités dans la topnav */
.topnav-link,
.topnav-link:visited,
.topnav-link:link {
  color: inherit !important;
}

/* Masquer la scrollbar tout en gardant le scroll horizontal */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: max-height 0.3s ease, opacity 0.2s ease;
  overflow: hidden;
}
.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}
.slide-down-enter-to,
.slide-down-leave-from {
  max-height: 600px;
  opacity: 1;
}
</style>
