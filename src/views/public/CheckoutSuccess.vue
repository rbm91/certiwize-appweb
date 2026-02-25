<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import ProgressSpinner from 'primevue/progressspinner';
import Button from 'primevue/button';
import Message from 'primevue/message';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const loading = ref(true);
const statusMsg = ref('');
const errorMsg = ref('');
const showManualLogin = ref(false);
const orderData = ref(null);

const planLabel = computed(() => {
  if (!orderData.value) return '';
  return orderData.value.plan === 'yearly'
    ? t('checkout_success.plan_yearly')
    : t('checkout_success.plan_monthly');
});

const planPrice = computed(() => {
  if (!orderData.value) return '';
  return orderData.value.plan === 'yearly' ? '1 200 € HT/an' : '120 € HT/mois';
});

const goToLogin = () => {
  router.push('/login');
};

onMounted(async () => {
  // GoCardless redirects back with ?redirect_flow_id=RF...
  const redirectFlowId = route.query.redirect_flow_id;

  if (!redirectFlowId) {
    // No redirect flow ID → user navigated directly, go to pricing
    router.push('/pricing');
    return;
  }

  // Retrieve data stored in sessionStorage before the GoCardless redirect
  const sessionToken = sessionStorage.getItem('checkout_session_token');
  const plan = sessionStorage.getItem('checkout_plan');
  const formDataRaw = sessionStorage.getItem('checkout_form');

  if (!sessionToken || !plan || !formDataRaw) {
    // Session data lost (e.g., different browser tab)
    errorMsg.value = t('checkout_success.session_lost');
    loading.value = false;
    showManualLogin.value = true;
    return;
  }

  let formData;
  try {
    formData = JSON.parse(formDataRaw);
  } catch {
    errorMsg.value = t('checkout_success.session_lost');
    loading.value = false;
    showManualLogin.value = true;
    return;
  }

  // Store order info for display
  orderData.value = {
    plan,
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    company: formData.company || '',
    phone: formData.phone || '',
  };

  statusMsg.value = t('checkout_success.creating_account');

  try {
    // Call API to complete GoCardless flow + create user + generate magic link
    const response = await fetch('/api/complete-gocardless-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        redirect_flow_id: redirectFlowId,
        session_token: sessionToken,
        plan,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        company: formData.company,
        taxId: formData.taxId,
        phone: formData.phone
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la finalisation du paiement');
    }

    // Clean up sessionStorage
    sessionStorage.removeItem('checkout_session_token');
    sessionStorage.removeItem('checkout_plan');
    sessionStorage.removeItem('checkout_form');

    loading.value = false;

    if (data.auto_login && data.magic_link_url) {
      statusMsg.value = t('checkout_success.redirecting');
      // Short delay so the user sees the success screen before redirect
      setTimeout(() => {
        window.location.href = data.magic_link_url;
      }, 4000);
    } else {
      // No magic link available → show manual login
      showManualLogin.value = true;
    }

  } catch (error) {
    console.error('CheckoutSuccess error:', error);
    errorMsg.value = error.message || t('checkout_success.error');
    loading.value = false;
    showManualLogin.value = true;
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
    <div class="max-w-lg w-full">

      <!-- Success Icon -->
      <div class="text-center mb-6">
        <div class="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <i class="pi pi-check text-4xl text-green-600 dark:text-green-400"></i>
        </div>
      </div>

      <!-- Title -->
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
        {{ t('checkout_success.title') }}
      </h1>
      <p class="text-xl text-gray-600 dark:text-gray-300 mb-8 text-center">
        {{ t('checkout_success.subtitle') }}
      </p>

      <!-- Error state -->
      <Message v-if="errorMsg" severity="error" :closable="false" class="mb-6 text-left">
        {{ errorMsg }}
      </Message>

      <!-- Loading State -->
      <div v-if="loading && !errorMsg" class="text-center space-y-4 mb-6">
        <ProgressSpinner
          style="width: 50px; height: 50px"
          strokeWidth="4"
          animationDuration="1s"
        />
        <p class="text-gray-600 dark:text-gray-300">
          {{ statusMsg || t('checkout_success.creating_account') }}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ t('checkout_success.almost_ready') }}
        </p>
      </div>

      <!-- Order Summary -->
      <div v-if="orderData && !errorMsg" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
        <div class="bg-primary/5 dark:bg-primary/10 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <i class="pi pi-file-check text-primary"></i>
            {{ t('checkout_success.summary_title') }}
          </h2>
        </div>
        <div class="px-6 py-4 space-y-3">
          <!-- Plan -->
          <div class="flex justify-between items-center">
            <span class="text-gray-500 dark:text-gray-400 text-sm">{{ t('checkout_success.summary_plan') }}</span>
            <span class="font-semibold text-gray-900 dark:text-white">{{ planLabel }}</span>
          </div>
          <!-- Price -->
          <div class="flex justify-between items-center">
            <span class="text-gray-500 dark:text-gray-400 text-sm">{{ t('checkout_success.summary_price') }}</span>
            <span class="font-bold text-primary text-lg">{{ planPrice }}</span>
          </div>
          <hr class="border-gray-200 dark:border-gray-700" />
          <!-- Client -->
          <div class="flex justify-between items-center">
            <span class="text-gray-500 dark:text-gray-400 text-sm">{{ t('checkout_success.summary_client') }}</span>
            <span class="text-gray-900 dark:text-white">{{ orderData.firstName }} {{ orderData.lastName }}</span>
          </div>
          <!-- Company -->
          <div v-if="orderData.company" class="flex justify-between items-center">
            <span class="text-gray-500 dark:text-gray-400 text-sm">{{ t('checkout_success.summary_company') }}</span>
            <span class="text-gray-900 dark:text-white">{{ orderData.company }}</span>
          </div>
          <!-- Email -->
          <div class="flex justify-between items-center">
            <span class="text-gray-500 dark:text-gray-400 text-sm">{{ t('checkout_success.summary_email') }}</span>
            <span class="text-gray-900 dark:text-white text-sm">{{ orderData.email }}</span>
          </div>
          <!-- Payment method -->
          <div class="flex justify-between items-center">
            <span class="text-gray-500 dark:text-gray-400 text-sm">{{ t('checkout_success.summary_payment') }}</span>
            <span class="text-gray-900 dark:text-white flex items-center gap-1.5">
              <i class="pi pi-building text-xs"></i>
              {{ t('checkout_success.summary_sepa') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Guarantee notice -->
      <div v-if="!errorMsg" class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
        <div class="flex items-start gap-3">
          <i class="pi pi-shield text-amber-600 dark:text-amber-400 mt-0.5"></i>
          <div>
            <p class="text-sm font-medium text-amber-800 dark:text-amber-300">{{ t('checkout_success.guarantee_title') }}</p>
            <p class="text-sm text-amber-700 dark:text-amber-400 mt-1">{{ t('checkout_success.guarantee_text') }}</p>
          </div>
        </div>
      </div>

      <!-- Email notice -->
      <div v-if="!errorMsg && !loading" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div class="flex items-start gap-3">
          <i class="pi pi-envelope text-blue-600 dark:text-blue-400 mt-0.5"></i>
          <p class="text-sm text-blue-700 dark:text-blue-300">
            {{ t('checkout_success.email_notice') }}
          </p>
        </div>
      </div>

      <!-- Manual Login Option -->
      <div v-if="showManualLogin" class="space-y-4 text-center">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ t('checkout_success.manual_login') }}
        </p>
        <Button
          :label="t('checkout_success.go_to_login')"
          @click="goToLogin"
          severity="secondary"
          size="large"
          class="w-full"
        />
      </div>

      <!-- Redirecting message -->
      <div v-if="!loading && !showManualLogin && !errorMsg" class="text-center mt-4">
        <div class="flex items-center justify-center gap-2">
          <ProgressSpinner
            style="width: 20px; height: 20px"
            strokeWidth="4"
            animationDuration="1s"
          />
          <p class="text-sm text-primary font-medium animate-pulse">
            {{ t('checkout_success.redirecting') }}
          </p>
        </div>
      </div>

    </div>
  </div>
</template>
