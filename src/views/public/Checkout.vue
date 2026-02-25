<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Card from 'primevue/card';
import { useFormValidation } from '../../composables/useFormValidation';
import { supabase } from '../../supabase';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

// Form data
const form = ref({
  firstName: '',
  lastName: '',
  company: '',
  taxId: '',
  email: '',
  phone: '',
  referralCode: ''
});

const loading = ref(false);
const errorMsg = ref('');
const { errors, validate, clearError } = useFormValidation();

// Referral code verification
const referralLoading = ref(false);
const referralValid = ref(null); // null = not checked, true = valid, false = invalid
const referralMessage = ref('');

// Selected plan
const selectedPlan = ref(route.query.plan || 'monthly');

const plans = {
  monthly: {
    name: 'Certigestion — Abonnement mensuel',
    price: 144,
    priceFormatted: '144,00 €',
    period: t('pricing.plans.per_month'),
    billing: t('pricing.plans.billed_monthly')
  },
  yearly: {
    name: 'Certigestion — Abonnement annuel',
    price: 1440,
    priceFormatted: '1 440,00 €',
    period: t('pricing.plans.per_year'),
    billing: t('pricing.plans.billed_yearly')
  }
};

const currentPlan = computed(() => plans[selectedPlan.value] || plans.monthly);

// ── Helpers ──────────────────────────────────────────────────
const capitalizeFirst = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const onCompanyInput = () => {
  form.value.company = capitalizeFirst(form.value.company);
};

// Phone formatting: 06-45-45-45-45
const formatPhone = () => {
  let raw = form.value.phone.replace(/[^\d]/g, '');
  if (raw.length > 10) raw = raw.slice(0, 10);
  const parts = [];
  for (let i = 0; i < raw.length; i += 2) {
    parts.push(raw.slice(i, i + 2));
  }
  form.value.phone = parts.join('-');
  clearError('phone');
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^\d{2}(-\d{2}){4}$/.test(phone);

// Referral code verification against Supabase
const verifyReferralCode = async () => {
  const code = form.value.referralCode.trim();
  if (!code) {
    referralValid.value = null;
    referralMessage.value = '';
    return;
  }

  referralLoading.value = true;
  referralMessage.value = '';
  try {
    const { data, error } = await supabase
      .from('referral_codes')
      .select('id, code, active')
      .eq('code', code.toUpperCase())
      .eq('active', true)
      .maybeSingle();

    if (error) {
      console.warn('[Checkout] Referral check error:', error.message);
      // Table might not exist yet — accept any code
      referralValid.value = true;
      referralMessage.value = t('checkout.referral.accepted');
      return;
    }

    if (data) {
      referralValid.value = true;
      referralMessage.value = t('checkout.referral.valid');
    } else {
      referralValid.value = false;
      referralMessage.value = t('checkout.referral.invalid');
    }
  } catch (err) {
    console.error('[Checkout] Referral verification error:', err);
    referralValid.value = true;
    referralMessage.value = t('checkout.referral.accepted');
  } finally {
    referralLoading.value = false;
  }
};

const handleCheckout = async () => {
  errorMsg.value = '';

  // Validate email format
  const emailOk = form.value.email && isValidEmail(form.value.email);
  // Validate phone format (optional but if filled must be valid)
  const phoneOk = !form.value.phone || isValidPhone(form.value.phone);

  const isValid = validate({
    firstName: form.value.firstName,
    lastName: form.value.lastName,
    email: () => emailOk,
    phone: () => phoneOk,
  });

  if (!isValid) {
    if (!emailOk && form.value.email) {
      errorMsg.value = t('checkout.validation.invalid_email');
    } else if (!phoneOk) {
      errorMsg.value = t('checkout.validation.invalid_phone');
    } else {
      errorMsg.value = t('checkout.validation.required_fields');
    }
    return;
  }

  // Check referral code if entered
  if (form.value.referralCode.trim() && referralValid.value === false) {
    errorMsg.value = t('checkout.validation.invalid_referral');
    return;
  }

  loading.value = true;

  try {
    // Generate a unique session token
    const sessionToken = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Store form data in sessionStorage so we can retrieve it on /checkout/success
    sessionStorage.setItem('checkout_session_token', sessionToken);
    sessionStorage.setItem('checkout_plan', selectedPlan.value);
    sessionStorage.setItem('checkout_form', JSON.stringify(form.value));

    // Call edge function to create GoCardless redirect flow
    const response = await fetch('/api/create-gocardless-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: selectedPlan.value,
        firstName: form.value.firstName,
        lastName: form.value.lastName,
        email: form.value.email,
        company: form.value.company,
        taxId: form.value.taxId,
        phone: form.value.phone,
        referralCode: form.value.referralCode.trim() || null,
        sessionToken
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la création du flux de paiement');
    }

    // Redirect to GoCardless hosted payment page
    window.location.href = data.redirect_url;

  } catch (error) {
    errorMsg.value = error.message || t('checkout.error');
    console.error('Checkout error:', error);
    loading.value = false;
  }
};

const goBack = () => {
  router.push('/pricing');
};

onMounted(() => {
  if (!route.query.plan) {
    router.push('/pricing');
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
    <div class="max-w-5xl mx-auto">

      <!-- Header -->
      <div class="text-center mb-10">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {{ t('checkout.title') }}
        </h1>
        <p class="text-gray-600 dark:text-gray-300">{{ t('checkout.subtitle') }}</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">

        <!-- ── FORM COLUMN (3/5) ─────────────────────────────── -->
        <div class="lg:col-span-3 space-y-6">

          <!-- Contact Information -->
          <Card>
            <template #title>
              <h2 class="text-lg font-bold">{{ t('checkout.form.title') }}</h2>
            </template>
            <template #content>
              <div class="space-y-4">

                <!-- First / Last name on same row -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {{ t('checkout.form.first_name') }} *
                    </label>
                    <InputText
                      v-model="form.firstName"
                      type="text"
                      class="w-full"
                      :placeholder="t('checkout.form.first_name_placeholder')"
                      :invalid="!!errors.firstName"
                      @input="clearError('firstName')"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {{ t('checkout.form.last_name') }} *
                    </label>
                    <InputText
                      v-model="form.lastName"
                      type="text"
                      class="w-full"
                      :placeholder="t('checkout.form.last_name_placeholder')"
                      :invalid="!!errors.lastName"
                      @input="clearError('lastName')"
                    />
                  </div>
                </div>

                <!-- Company -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ t('checkout.form.company') }}
                  </label>
                  <InputText
                    v-model="form.company"
                    type="text"
                    class="w-full"
                    :placeholder="t('checkout.form.company_placeholder')"
                    @input="onCompanyInput"
                  />
                </div>

                <!-- Tax ID -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ t('checkout.form.tax_id') }}
                  </label>
                  <InputText
                    v-model="form.taxId"
                    type="text"
                    class="w-full"
                    :placeholder="t('checkout.form.tax_id_placeholder')"
                  />
                </div>

                <!-- Email -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ t('checkout.form.email') }} *
                  </label>
                  <InputText
                    v-model="form.email"
                    type="email"
                    class="w-full"
                    :placeholder="t('checkout.form.email_placeholder')"
                    :invalid="!!errors.email"
                    @input="clearError('email')"
                    @blur="() => { if (form.email && !isValidEmail(form.email)) errors.email = true; }"
                  />
                  <small v-if="errors.email && form.email" class="text-red-500 mt-1 block">
                    {{ t('checkout.validation.invalid_email') }}
                  </small>
                  <small v-else class="text-gray-500 dark:text-gray-400 mt-1 block">
                    {{ t('checkout.form.email_helper') }}
                  </small>
                </div>

                <!-- Phone -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ t('checkout.form.phone') }}
                  </label>
                  <InputText
                    v-model="form.phone"
                    type="tel"
                    class="w-full"
                    :placeholder="t('checkout.form.phone_placeholder')"
                    :invalid="!!errors.phone"
                    @input="formatPhone"
                    @blur="() => { if (form.phone && !isValidPhone(form.phone)) errors.phone = true; }"
                  />
                  <small v-if="errors.phone && form.phone" class="text-red-500 mt-1 block">
                    {{ t('checkout.validation.invalid_phone') }}
                  </small>
                </div>

                <!-- Referral Code -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ t('checkout.form.referral_code') }}
                  </label>
                  <div class="flex gap-2">
                    <InputText
                      v-model="form.referralCode"
                      type="text"
                      class="w-full uppercase"
                      :placeholder="t('checkout.form.referral_code_placeholder')"
                      :invalid="referralValid === false"
                      @input="() => { referralValid = null; referralMessage = ''; }"
                    />
                    <Button
                      :label="t('checkout.form.referral_verify')"
                      :loading="referralLoading"
                      severity="secondary"
                      size="small"
                      outlined
                      :disabled="!form.referralCode.trim()"
                      @click="verifyReferralCode"
                    />
                  </div>
                  <small
                    v-if="referralMessage"
                    :class="referralValid ? 'text-green-600' : 'text-red-500'"
                    class="mt-1 block"
                  >
                    <i :class="referralValid ? 'pi pi-check-circle' : 'pi pi-times-circle'" class="mr-1"></i>
                    {{ referralMessage }}
                  </small>
                </div>

              </div>
            </template>
          </Card>

          <!-- Payment Information -->
          <Card>
            <template #title>
              <h2 class="text-lg font-bold">{{ t('checkout.form.payment_title') }}</h2>
            </template>
            <template #content>
              <!-- GoCardless SEPA info -->
              <div class="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
                <i class="pi pi-info-circle text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"></i>
                <p class="text-sm text-blue-800 dark:text-blue-300">
                  {{ t('checkout.payment_methods.sepa_info') }}
                </p>
              </div>

              <!-- GoCardless logo + SEPA badge -->
              <div class="flex items-center gap-3 mb-4">
                <span class="px-3 py-1 bg-gray-800 text-white text-xs font-bold rounded">SEPA</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ t('checkout.payment_methods.powered_by') }}</span>
                <span class="font-bold text-sm text-gray-700 dark:text-gray-300">GoCardless</span>
              </div>

              <!-- What happens next -->
              <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div class="flex items-start gap-2">
                  <i class="pi pi-arrow-right text-primary flex-shrink-0 mt-0.5 text-xs"></i>
                  <span>{{ t('checkout.payment_methods.step1') }}</span>
                </div>
                <div class="flex items-start gap-2">
                  <i class="pi pi-arrow-right text-primary flex-shrink-0 mt-0.5 text-xs"></i>
                  <span>{{ t('checkout.payment_methods.step2') }}</span>
                </div>
                <div class="flex items-start gap-2">
                  <i class="pi pi-arrow-right text-primary flex-shrink-0 mt-0.5 text-xs"></i>
                  <span>{{ t('checkout.payment_methods.step3') }}</span>
                </div>
              </div>
            </template>
          </Card>

          <!-- Error -->
          <Message v-if="errorMsg" severity="error" :closable="false">
            {{ errorMsg }}
          </Message>

          <!-- Submit -->
          <div class="space-y-3">
            <Button
              :label="loading ? t('checkout.loading') : t('checkout.cta.proceed')"
              :loading="loading"
              class="w-full"
              size="large"
              severity="success"
              @click="handleCheckout"
            />
            <div class="text-center text-sm text-gray-500 dark:text-gray-400">
              <i class="pi pi-lock mr-1"></i>
              {{ t('checkout.cta.secure') }}
            </div>
            <Button :label="t('checkout.cta.back')" text class="w-full" @click="goBack" />
          </div>

        </div>

        <!-- ── SUMMARY COLUMN (2/5) ──────────────────────────── -->
        <div class="lg:col-span-2">
          <div class="sticky top-24">
            <Card>
              <template #title>
                <h2 class="text-lg font-bold">{{ t('checkout.plan_summary.title') }}</h2>
              </template>
              <template #content>
                <div class="space-y-4">
                  <div class="pb-4 border-b border-gray-200 dark:border-gray-700">
                    <p class="font-bold text-gray-900 dark:text-white">{{ currentPlan.name }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ currentPlan.billing }}</p>
                  </div>

                  <div class="flex justify-between items-center">
                    <span class="text-gray-600 dark:text-gray-400 text-sm">{{ t('checkout.plan_summary.total') }}</span>
                    <div class="text-right">
                      <p class="text-2xl font-extrabold text-gray-900 dark:text-white">
                        {{ currentPlan.priceFormatted }}
                      </p>
                      <p class="text-xs text-gray-500">{{ currentPlan.period }}</p>
                    </div>
                  </div>

                  <!-- Guarantee reminder -->
                  <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <i class="pi pi-shield text-green-600 flex-shrink-0 mt-0.5"></i>
                      <span>Satisfait ou remboursé — 30 jours sans conditions</span>
                    </div>
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
