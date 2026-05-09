<script setup>
import { computed } from 'vue';

const props = defineProps({
  icon: { type: String, default: 'pi-chart-bar' },
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  change: { type: Number, default: undefined },
  color: { type: String, default: '#045089' },
});

const iconStyle = computed(() => ({
  backgroundColor: `${props.color}15`,
  color: props.color,
}));

const isPositive = computed(() => (props.change ?? 0) >= 0);
const trendIcon = computed(() => (isPositive.value ? 'pi-arrow-up-right' : 'pi-arrow-down'));
const formattedChange = computed(() => {
  if (props.change === undefined || props.change === null) return '';
  const sign = props.change >= 0 ? '+' : '';
  return `${sign}${props.change.toFixed(1)}%`;
});
</script>

<template>
  <div class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
    <div class="flex items-start justify-between">
      <div
        class="flex h-10 w-10 items-center justify-center rounded-lg"
        :style="iconStyle"
      >
        <i :class="['pi', icon]" style="font-size: 1.25rem"></i>
      </div>
      <span
        v-if="change !== undefined && change !== null"
        :class="[
          'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
          isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
        ]"
      >
        <i :class="['pi', trendIcon]" style="font-size: 0.75rem"></i>
        {{ formattedChange }}
      </span>
    </div>
    <p class="mt-3 text-2xl font-bold text-gray-900">{{ value }}</p>
    <p class="mt-0.5 text-sm text-gray-500">{{ label }}</p>
  </div>
</template>
