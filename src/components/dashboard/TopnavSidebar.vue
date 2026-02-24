<script setup>
import { ref, nextTick } from 'vue';
import { useNavigation } from '../../composables/useNavigation';
import { useAuthStore } from '../../stores/auth';
import { useNavConfigStore } from '../../stores/navConfig';
import { useI18n } from 'vue-i18n';

const { sideNavigation, isCurrent, getLabel } = useNavigation();
const authStore = useAuthStore();
const navConfigStore = useNavConfigStore();
const { t } = useI18n();

const expandedMenus = ref({});

const toggleSubmenu = (itemName) => {
  expandedMenus.value[itemName] = !expandedMenus.value[itemName];
};

// --- Admin: rename sidebar items ---
const editingSidebarItem = ref(null);
const editingLabel = ref('');
const renameInput = ref(null);

const startRename = (item) => {
  editingSidebarItem.value = item.name;
  editingLabel.value = getLabel(item.name);
  nextTick(() => {
    renameInput.value?.focus();
    renameInput.value?.select();
  });
};

const saveRename = async (item) => {
  if (editingSidebarItem.value !== item.name) return;
  const label = editingLabel.value.trim();
  if (label && label !== getLabel(item.name)) {
    await navConfigStore.updateSidebarLabel(item.name, label);
  }
  editingSidebarItem.value = null;
};

const cancelRename = () => {
  editingSidebarItem.value = null;
};
</script>

<template>
  <div class="w-60 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col">

    <!-- ========== Section contextuelle (haut) ========== -->
    <nav v-if="sideNavigation.contextual.length > 0" class="p-3 space-y-0.5 flex-1 overflow-y-auto">

      <!-- Message "bientôt" pour les sections désactivées -->
      <div
        v-if="sideNavigation.contextual.length === 1 && sideNavigation.contextual[0].type === 'comingSoon'"
        class="px-4 py-12 text-center text-gray-400 dark:text-gray-500"
      >
        <i class="pi pi-clock text-3xl mb-3 block"></i>
        <p class="text-sm">{{ getLabel('sidebar_coming_soon') }}</p>
      </div>

      <!-- Items contextuels -->
      <template v-else v-for="item in sideNavigation.contextual" :key="item.name || item.label">

        <!-- Séparateur de section -->
        <div
          v-if="item.type === 'separator'"
          class="pt-4 pb-1 px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider"
        >
          {{ item.label }}
        </div>

        <!-- Item normal -->
        <a
          v-else
          :href="item.href"
          class="group/item flex items-center gap-2.5 px-4 py-2 rounded-lg transition-all duration-200 no-underline text-sm"
          :class="[
            isCurrent(item.href)
              ? 'bg-primary/10 text-primary font-medium border-l-3 border-primary'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          ]"
        >
          <i class="pi text-xs" :class="item.icon"></i>

          <!-- Inline rename input (admin) -->
          <input
            v-if="authStore.isOrgAdmin && editingSidebarItem === item.name"
            ref="renameInput"
            v-model="editingLabel"
            @blur="saveRename(item)"
            @keyup.enter="saveRename(item)"
            @keyup.escape="cancelRename"
            @click.stop.prevent
            class="flex-1 bg-transparent border-b border-primary text-gray-900 dark:text-white
                   text-sm font-medium outline-none min-w-0"
            :size="Math.max(editingLabel.length, 4)"
          />

          <!-- Label normal -->
          <span v-else class="flex-1 truncate">{{ getLabel(item.name) }}</span>

          <!-- Pencil icon (admin, visible on hover) -->
          <i
            v-if="authStore.isOrgAdmin && editingSidebarItem !== item.name"
            class="pi pi-pencil text-xs text-gray-400 hover:text-primary
                   cursor-pointer opacity-0 group-hover/item:opacity-60 transition-opacity flex-shrink-0"
            @click.stop.prevent="startRename(item)"
          ></i>
        </a>
      </template>
    </nav>

    <!-- ========== Séparateur visuel (seulement si les 2 sections ont du contenu) ========== -->
    <hr v-if="sideNavigation.contextual.length > 0 && sideNavigation.fixed.length > 0" class="border-gray-200 dark:border-gray-700 mx-3" />

    <!-- ========== Section fixe (bas si contextuel présent, haut sinon) ========== -->
    <nav class="p-3 space-y-1" :class="sideNavigation.contextual.length === 0 ? 'flex-1 overflow-y-auto' : ''">
      <template v-for="item in sideNavigation.fixed" :key="item.name">
        <!-- Item sans sous-menu -->
        <a
          v-if="!item.submenu"
          :href="item.href"
          class="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 no-underline text-sm font-medium"
          :class="[
            isCurrent(item.href)
              ? 'bg-primary/10 text-primary border-l-3 border-primary'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          ]"
        >
          <i class="pi" :class="item.icon"></i>
          <span>{{ getLabel(item.name) }}</span>
        </a>

        <!-- Item avec sous-menu (Paramètres) -->
        <div v-else>
          <button
            @click="toggleSubmenu(item.name)"
            class="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 w-full text-sm font-medium"
            :class="[
              isCurrent(item.href)
                ? 'bg-primary/10 text-primary'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            ]"
          >
            <i class="pi" :class="item.icon"></i>
            <span class="flex-1 text-left">{{ getLabel(item.name) }}</span>
            <i
              class="pi text-xs transition-transform duration-200"
              :class="expandedMenus[item.name] ? 'pi-chevron-down' : 'pi-chevron-right'"
            ></i>
          </button>

          <!-- Sous-menu dépliable -->
          <transition name="expand">
            <div v-if="expandedMenus[item.name]" class="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-200 dark:border-gray-600 pl-3">
              <a
                v-for="sub in item.submenu"
                :key="sub.name"
                :href="sub.disabled ? undefined : sub.href"
                class="flex items-center gap-2 px-3 py-2 rounded-md transition-all no-underline text-sm"
                :class="[
                  sub.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : isCurrent(sub.href)
                      ? 'text-primary font-medium bg-primary/5'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                ]"
                @click="sub.disabled ? $event.preventDefault() : null"
              >
                <i class="pi text-xs" :class="sub.icon"></i>
                <span>{{ getLabel(sub.name) }}</span>
                <span v-if="sub.disabled" class="ml-auto text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">
                  {{ getLabel('coming_soon') }}
                </span>
              </a>
            </div>
          </transition>
        </div>
      </template>
    </nav>
  </div>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 200px;
}
</style>
