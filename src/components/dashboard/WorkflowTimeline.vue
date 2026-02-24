<template>
  <div class="flex items-center gap-2 p-4">
    <div v-for="(step, i) in steps" :key="i" class="flex items-center gap-1">
      <span class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            :class="i < currentStep ? 'bg-green-500 text-white' : i === currentStep ? 'bg-blue-500 text-white' : 'bg-surface-200 text-surface-500'">
        {{ i + 1 }}
      </span>
      <span class="text-sm hidden md:inline">{{ step.label }}</span>
      <i v-if="i < steps.length - 1" class="pi pi-chevron-right text-surface-300 mx-1"></i>
    </div>
  </div>
</template>

<script setup>
defineProps({
  steps: { type: Array, default: () => [] },
  currentStep: { type: Number, default: 0 }
});
</script>
