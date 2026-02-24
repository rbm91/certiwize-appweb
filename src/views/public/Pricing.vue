<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import VideoPlayer from '../../components/public/VideoPlayer.vue';
import Button from 'primevue/button';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';

const { t } = useI18n();
const router = useRouter();

const features = [
  t('pricing.features.f1'),
  t('pricing.features.f2'),
  t('pricing.features.f3'),
  t('pricing.features.f4'),
  t('pricing.features.f5'),
  t('pricing.features.f6'),
  t('pricing.features.f7'),
  t('pricing.features.f8'),
  t('pricing.features.f9')
];

const faqs = [
  { question: t('pricing.faq.q1'), answer: t('pricing.faq.a1') },
  { question: t('pricing.faq.q2'), answer: t('pricing.faq.a2') },
  { question: t('pricing.faq.q3'), answer: t('pricing.faq.a3') },
  { question: t('pricing.faq.q4'), answer: t('pricing.faq.a4') },
  { question: t('pricing.faq.q5'), answer: t('pricing.faq.a5') },
  { question: t('pricing.faq.q6'), answer: t('pricing.faq.a6') }
];

const goToCheckout = (plan) => {
  router.push({ path: '/checkout', query: { plan } });
};

const handleScheduleDemo = () => {
  router.push('/schedule');
};
</script>

<template>
  <div class="pricing-page">

    <!-- HERO -->
    <section class="py-16 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 class="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
          {{ t('pricing.hero.title') }}
        </h1>
        <p class="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto">
          {{ t('pricing.hero.subtitle') }}
        </p>
        <div class="max-w-3xl mx-auto">
          <VideoPlayer
            src="https://youtu.be/jjl0n7lbBK0"
            :title="t('pricing.hero.watch_video')"
          />
        </div>
      </div>
    </section>

    <!-- FEATURES LIST -->
    <section class="py-14 bg-white dark:bg-gray-900">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center uppercase tracking-wide">
          {{ t('pricing.features.title') }}
        </h2>
        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <li
            v-for="(feature, i) in features"
            :key="i"
            class="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3"
          >
            <i class="pi pi-check-circle text-primary mt-0.5 flex-shrink-0 text-lg"></i>
            <span class="text-gray-800 dark:text-gray-200 font-medium">{{ feature }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- TRUST BADGES -->
    <section class="py-8 bg-gray-50 dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700">
      <div class="max-w-4xl mx-auto px-4 flex flex-wrap justify-center gap-8 text-sm font-semibold text-gray-700 dark:text-gray-200">
        <span class="flex items-center gap-2">
          <i class="pi pi-calendar text-primary text-xl"></i>
          {{ t('pricing.badges.monthly') }}
        </span>
        <span class="flex items-center gap-2">
          <i class="pi pi-lock text-primary text-xl"></i>
          {{ t('pricing.badges.secure') }}
        </span>
        <span class="flex items-center gap-2">
          <i class="pi pi-shield text-primary text-xl"></i>
          {{ t('pricing.badges.guarantee') }}
        </span>
      </div>
    </section>

    <!-- PRICING CARDS -->
    <section class="py-16 bg-white dark:bg-gray-900">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center text-gray-900 dark:text-white mb-3">
          {{ t('pricing.plans.title') }}
        </h2>
        <p class="text-center text-gray-500 dark:text-gray-400 mb-12">
          {{ t('pricing.plans.subtitle') }}
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">

          <!-- Monthly -->
          <div class="rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 flex flex-col">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">{{ t('pricing.plans.monthly') }}</h3>
            <div class="mb-1">
              <span class="text-4xl font-extrabold text-gray-900 dark:text-white">120 € HT</span>
              <span class="text-gray-500 dark:text-gray-400 ml-2 text-base">{{ t('pricing.plans.per_month') }}</span>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">{{ t('pricing.plans.billed_monthly') }}</p>
            <ul class="space-y-2 mb-8 flex-1">
              <li v-for="(feature, i) in features" :key="i" class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <i class="pi pi-check text-primary flex-shrink-0 mt-0.5"></i>
                {{ feature }}
              </li>
            </ul>
            <Button
              :label="t('pricing.cta.subscribe')"
              class="w-full"
              size="large"
              severity="secondary"
              outlined
              @click="goToCheckout('monthly')"
            />
          </div>

          <!-- Yearly (popular) -->
          <div class="relative rounded-2xl border-2 border-primary bg-white dark:bg-gray-800 p-8 flex flex-col shadow-xl">
            <div class="absolute -top-4 left-1/2 -translate-x-1/2">
              <span class="bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
                {{ t('pricing.plans.save_badge') }}
              </span>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4 mt-2">{{ t('pricing.plans.yearly') }}</h3>
            <div class="mb-1">
              <span class="text-4xl font-extrabold text-gray-900 dark:text-white">1 200 € HT</span>
              <span class="text-gray-500 dark:text-gray-400 ml-2 text-base">{{ t('pricing.plans.per_year') }}</span>
            </div>
            <p class="text-sm font-semibold text-primary mb-1">{{ t('pricing.plans.yearly_per_month') }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">{{ t('pricing.plans.billed_yearly') }}</p>
            <ul class="space-y-2 mb-8 flex-1">
              <li v-for="(feature, i) in features" :key="i" class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <i class="pi pi-check text-primary flex-shrink-0 mt-0.5"></i>
                {{ feature }}
              </li>
            </ul>
            <Button
              :label="t('pricing.cta.subscribe')"
              class="w-full"
              size="large"
              severity="success"
              @click="goToCheckout('yearly')"
            />
          </div>
        </div>

        <div class="text-center mt-10">
          <span class="text-gray-500 dark:text-gray-400 mr-3">{{ t('pricing.cta.or') }}</span>
          <Button
            :label="t('pricing.cta.schedule_demo')"
            severity="secondary"
            outlined
            icon="pi pi-calendar"
            @click="handleScheduleDemo"
          />
        </div>
      </div>
    </section>

    <!-- GUARANTEE -->
    <section class="py-12 bg-green-50 dark:bg-green-900/20">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <i class="pi pi-shield text-5xl text-green-600 dark:text-green-400 mb-4 block"></i>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wide">
          {{ t('pricing.guarantee.title') }}
        </h2>
        <p class="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
          {{ t('pricing.guarantee.text') }}
        </p>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-16 bg-gray-100 dark:bg-gray-800">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">
          {{ t('pricing.faq.title') }}
        </h2>
        <Accordion>
          <AccordionPanel v-for="(faq, index) in faqs" :key="index">
            <AccordionHeader>
              <span class="font-semibold text-gray-900 dark:text-white">{{ faq.question }}</span>
            </AccordionHeader>
            <AccordionContent>
              <p class="text-gray-700 dark:text-gray-300 leading-relaxed">{{ faq.answer }}</p>
            </AccordionContent>
          </AccordionPanel>
        </Accordion>
      </div>
    </section>

  </div>
</template>

<style scoped>
.pricing-page {
  min-height: 100vh;
}
</style>
