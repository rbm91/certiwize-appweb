<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  delay: { type: Number, default: 0 },
  threshold: { type: Number, default: 0.06 },
  tag: { type: String, default: 'div' },
});

const root = ref(null);
let observer = null;

onMounted(() => {
  if (!root.value) return;

  if (props.delay) {
    root.value.style.transitionDelay = `${props.delay}ms`;
  }

  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        root.value?.classList.add('is-visible');
        observer?.unobserve(root.value);
      }
    },
    { threshold: props.threshold },
  );
  observer.observe(root.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>

<template>
  <component :is="tag" ref="root" class="reveal-section">
    <slot />
  </component>
</template>
