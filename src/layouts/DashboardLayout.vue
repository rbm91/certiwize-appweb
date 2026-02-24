<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Sidebar from '../components/dashboard/Sidebar.vue';

const authStore = useAuthStore();
const route = useRoute();

// Mobile sidebar state
const isMobileSidebarOpen = ref(false);

const toggleMobileSidebar = () => {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value;
};

const closeMobileSidebar = () => {
  isMobileSidebarOpen.value = false;
};

// Close mobile sidebar on route change
watch(() => route.path, () => {
  closeMobileSidebar();
});
</script>

<template>
  <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Mobile Menu Button -->
    <button 
      @click="toggleMobileSidebar"
      class="md:hidden fixed top-4 left-4 z-50 p-3 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-slate-800 transition-colors"
    >
      <i :class="isMobileSidebarOpen ? 'pi pi-times' : 'pi pi-bars'" class="text-lg"></i>
    </button>

    <!-- Mobile Sidebar Overlay -->
    <div 
      v-if="isMobileSidebarOpen"
      @click="closeMobileSidebar"
      class="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
    ></div>

    <!-- Mobile Sidebar -->
    <aside 
      class="md:hidden fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out"
      :class="isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <Sidebar />
    </aside>

    <!-- Desktop Sidebar Fixed -->
    <aside class="hidden md:block h-screen sticky top-0">
      <Sidebar />
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto">
      <!-- Spacer for mobile menu button -->
      <div class="md:hidden h-16"></div>
      
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="$route.fullPath" />
        </transition>
      </router-view>
    </main>
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
