<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Card from 'primevue/card';

const { t } = useI18n();
const router = useRouter();

// Calendly — remplacer par l'URL réelle quand disponible (ex: https://calendly.com/certiwize/demo)
const CALENDLY_URL = '';

const calendlyLoaded = ref(false);

const loadCalendlyScript = () => {
  if (document.getElementById('calendly-script')) {
    calendlyLoaded.value = true;
    return;
  }
  const script = document.createElement('script');
  script.id = 'calendly-script';
  script.src = 'https://assets.calendly.com/assets/external/widget.js';
  script.async = true;
  script.onload = () => { calendlyLoaded.value = true; };
  document.head.appendChild(script);
};

onMounted(() => {
  if (CALENDLY_URL) loadCalendlyScript();
});

onUnmounted(() => {
  // Remove Calendly stylesheet if injected
  const link = document.getElementById('calendly-css');
  if (link) link.remove();
});

// Form data
const formData = ref({
  fullName: '',
  email: '',
  phone: '',
  company: '',
  message: ''
});

const loading = ref(false);
const successMsg = ref(false);
const errorMsg = ref('');

const handleSubmit = async () => {
  errorMsg.value = '';

  // Basic validation
  if (!formData.value.fullName || !formData.value.email) {
    errorMsg.value = t('schedule.error');
    return;
  }

  loading.value = true;

  try {
    const response = await fetch('/api/create-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: formData.value.fullName,
        email: formData.value.email,
        phone: formData.value.phone,
        company: formData.value.company,
        message: formData.value.message,
        source: 'schedule_page'
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || t('schedule.error'));
    }

    successMsg.value = true;

    // Reset form
    formData.value = {
      fullName: '',
      email: '',
      phone: '',
      company: '',
      message: ''
    };

  } catch (error) {
    errorMsg.value = error.message || t('schedule.error');
    console.error('Schedule error:', error);
  } finally {
    loading.value = false;
  }
};

const goToHome = () => {
  router.push('/');
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {{ t('schedule.title') }}
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-300 mb-8">
          {{ t('schedule.subtitle') }}
        </p>
        <p class="text-gray-600 dark:text-gray-400">
          {{ t('schedule.intro') }}
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Contact Form -->
        <div>
          <Card>
            <template #title>
              <h2 class="text-xl font-bold">{{ t('schedule.form.title') }}</h2>
            </template>
            <template #content>
              <!-- Success Message -->
              <Message
                v-if="successMsg"
                severity="success"
                :closable="false"
                class="mb-4"
              >
                <div>
                  <p class="font-bold mb-2">{{ t('schedule.success.title') }}</p>
                  <p>{{ t('schedule.success.message') }}</p>
                  <Button
                    :label="t('schedule.success.back_home')"
                    text
                    @click="goToHome"
                    class="mt-2"
                  />
                </div>
              </Message>

              <form v-else @submit.prevent="handleSubmit" class="space-y-4">
                <!-- Full Name -->
                <div>
                  <label for="fullName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('schedule.form.full_name') }} *
                  </label>
                  <InputText
                    id="fullName"
                    v-model="formData.fullName"
                    type="text"
                    class="w-full"
                    :placeholder="t('schedule.form.full_name_placeholder')"
                    required
                  />
                </div>

                <!-- Email -->
                <div>
                  <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('schedule.form.email') }} *
                  </label>
                  <InputText
                    id="email"
                    v-model="formData.email"
                    type="email"
                    class="w-full"
                    :placeholder="t('schedule.form.email_placeholder')"
                    required
                  />
                </div>

                <!-- Phone -->
                <div>
                  <label for="phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('schedule.form.phone') }}
                  </label>
                  <InputText
                    id="phone"
                    v-model="formData.phone"
                    type="tel"
                    class="w-full"
                    :placeholder="t('schedule.form.phone_placeholder')"
                  />
                </div>

                <!-- Company -->
                <div>
                  <label for="company" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('schedule.form.company') }}
                  </label>
                  <InputText
                    id="company"
                    v-model="formData.company"
                    type="text"
                    class="w-full"
                    :placeholder="t('schedule.form.company_placeholder')"
                  />
                </div>

                <!-- Message -->
                <div>
                  <label for="message" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('schedule.form.message') }}
                  </label>
                  <Textarea
                    id="message"
                    v-model="formData.message"
                    rows="4"
                    class="w-full"
                    :placeholder="t('schedule.form.message_placeholder')"
                  />
                </div>

                <!-- Error Message -->
                <Message
                  v-if="errorMsg"
                  severity="error"
                  :closable="false"
                >
                  {{ errorMsg }}
                </Message>

                <!-- Submit Button -->
                <Button
                  type="submit"
                  :label="t('schedule.form.submit')"
                  :loading="loading"
                  class="w-full"
                  size="large"
                  severity="success"
                  icon="pi pi-send"
                />
              </form>
            </template>
          </Card>
        </div>

        <!-- Calendly Widget -->
        <div>
          <Card>
            <template #title>
              <h2 class="text-xl font-bold">{{ t('schedule.calendly.title') }}</h2>
            </template>
            <template #content>
              <!-- Calendly embed (affiché quand CALENDLY_URL est défini) -->
              <div v-if="CALENDLY_URL">
                <link
                  id="calendly-css"
                  href="https://assets.calendly.com/assets/external/widget.css"
                  rel="stylesheet"
                />
                <div
                  class="calendly-inline-widget rounded-lg overflow-hidden"
                  :data-url="CALENDLY_URL"
                  style="min-width:320px;height:630px;"
                ></div>
              </div>

              <!-- Placeholder affiché tant que CALENDLY_URL n'est pas configuré -->
              <div v-else class="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
                <i class="pi pi-calendar text-6xl text-gray-400 mb-4 block"></i>
                <p class="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('schedule.calendly.coming_soon') }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ t('schedule.calendly.placeholder') }}
                </p>
              </div>

              <div class="mt-6">
                <p class="text-center text-gray-600 dark:text-gray-400 mb-2">
                  {{ t('schedule.or') }}
                </p>
                <p class="text-center text-sm text-gray-500 dark:text-gray-500">
                  {{ t('schedule.contact_us') }}: contact@certiwize.com
                </p>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
