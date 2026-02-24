<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Card from 'primevue/card';
import Button from 'primevue/button';

const { t } = useI18n();

const props = defineProps({
  plan: {
    type: Object,
    required: true
  },
  popular: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['subscribe']);

const handleSubscribe = () => {
  emit('subscribe', props.plan);
};

// Format price with currency
const formattedPrice = computed(() => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(props.plan.price);
});
</script>

<template>
  <Card
    class="pricing-card relative"
    :class="{ 'popular': popular, 'border-2 border-primary': popular }"
  >
    <!-- Popular Badge -->
    <template #header v-if="popular">
      <div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
        <span class="bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">
          {{ t('pricing.plans.save_badge') }}
        </span>
      </div>
    </template>

    <template #title>
      <div class="text-center pt-4">
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ plan.name }}
        </h3>
      </div>
    </template>

    <template #content>
      <div class="text-center mb-6">
        <!-- Price -->
        <div class="mb-2">
          <span class="text-4xl font-bold text-gray-900 dark:text-white">
            {{ formattedPrice }}
          </span>
          <span class="text-gray-500 dark:text-gray-400 ml-1">
            {{ plan.period === 'month' ? t('pricing.plans.per_month') : t('pricing.plans.per_year') }}
          </span>
        </div>

        <!-- Billing info -->
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ plan.period === 'month' ? t('pricing.plans.billed_monthly') : t('pricing.plans.billed_yearly') }}
        </p>
      </div>

      <!-- Features List -->
      <ul class="space-y-3 mb-6">
        <li
          v-for="(feature, index) in plan.features"
          :key="index"
          class="flex items-start"
        >
          <i class="pi pi-check text-green-500 mr-2 mt-1 flex-shrink-0"></i>
          <span class="text-gray-700 dark:text-gray-300">{{ feature }}</span>
        </li>
      </ul>

      <!-- CTA Button -->
      <Button
        :label="t('pricing.cta.subscribe')"
        @click="handleSubscribe"
        class="w-full"
        :severity="popular ? 'success' : 'secondary'"
        size="large"
      />
    </template>
  </Card>
</template>

<style scoped>
.pricing-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.pricing-card.popular {
  transform: scale(1.05);
}

.pricing-card.popular:hover {
  transform: scale(1.05) translateY(-4px);
}
</style>
