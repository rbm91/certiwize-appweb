<script setup>
import { ref, onMounted } from 'vue';
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

  statusMsg.value = t('checkout_success.creating_account');

  try {
    // Call edge function to complete GoCardless flow + create user + generate magic link
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

    if (data.auto_login && data.magic_link_url) {
      statusMsg.value = t('checkout_success.redirecting');
      // Short delay so the user sees the success screen before redirect
      setTimeout(() => {
        window.location.href = data.magic_link_url;
      }, 2000);
    } else {
      // No magic link available → show manual login
      loading.value = false;
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
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <div class="max-w-md w-full text-center">

      <!-- Success Icon -->
      <div class="mb-6">
        <div class="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <i class="pi pi-check text-4xl text-green-600 dark:text-green-400"></i>
        </div>
      </div>

      <!-- Title -->
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {{ t('checkout_success.title') }}
      </h1>
      <p class="text-xl text-gray-600 dark:text-gray-300 mb-8">
        {{ t('checkout_success.subtitle') }}
      </p>

      <!-- Error state -->
      <Message v-if="errorMsg" severity="error" :closable="false" class="mb-6 text-left">
        {{ errorMsg }}
      </Message>

      <!-- Loading State -->
      <div v-if="loading && !errorMsg" class="space-y-4 mb-6">
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

      <!-- Success info box -->
      <div v-if="!errorMsg" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
        <p class="text-gray-700 dark:text-gray-300">
          {{ t('checkout_success.message') }}
        </p>
      </div>

      <!-- Manual Login Option -->
      <div v-if="showManualLogin" class="space-y-4">
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
      <div v-else-if="!loading" class="mt-4">
        <p class="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
          {{ t('checkout_success.redirecting') }}
        </p>
      </div>

    </div>
  </div>
</template>
