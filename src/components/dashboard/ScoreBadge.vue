<template>
  <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
        :style="{ backgroundColor: bgColor, color: '#fff' }">
    <i class="pi pi-chart-pie text-xs"></i>
    {{ score }}%
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { SCORE_THRESHOLDS } from '../../config/constants';

const props = defineProps({
  score: { type: Number, default: 0 }
});

const bgColor = computed(() => {
  if (props.score >= SCORE_THRESHOLDS.GREEN) return '#10B981';
  if (props.score >= SCORE_THRESHOLDS.ORANGE) return '#F59E0B';
  return '#EF4444';
});
</script>
