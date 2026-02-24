<template>
  <div class="border border-red-200 rounded-lg p-4 bg-red-50">
    <div class="flex items-center gap-2 mb-2">
      <i class="pi pi-exclamation-triangle text-red-500"></i>
      <span class="font-semibold text-red-700">Signal Qualité</span>
      <span class="text-sm text-surface-500">{{ signal?.type_signal }}</span>
    </div>
    <p class="text-sm text-surface-600">{{ signal?.description_probleme || 'Aucune description' }}</p>
  </div>
</template>

<script setup>
defineProps({
  signal: { type: Object, default: () => ({}) }
});
</script>
