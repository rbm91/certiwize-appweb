<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Message from 'primevue/message';

const { t } = useI18n();
const auth = useAuthStore();
const email = ref('');
const loading = ref(false);
const msg = ref({ type: '', content: '' });

const handleReset = async () => {
  loading.value = true;
  msg.value = { type: '', content: '' };
  try {
    await auth.resetPasswordEmail(email.value);
    msg.value = { type: 'success', content: t('forgot_password.success') };
  } catch (error) {
    msg.value = { type: 'error', content: error.message };
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <h1 class="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">{{ t('forgot_password.title') }}</h1>
      <form @submit.prevent="handleReset" class="space-y-4">
        <div class="flex flex-col gap-2">
          <label class="text-gray-700 dark:text-gray-300">{{ t('forgot_password.email') }}</label>
          <InputText v-model="email" type="email" required class="w-full" />
        </div>
        <Message v-if="msg.content" :severity="msg.type" :closable="false">{{ msg.content }}</Message>
        <Button type="submit" :label="t('forgot_password.submit')" :loading="loading" class="w-full" />
        <div class="text-center mt-4">
          <router-link to="/login" class="text-sm text-primary hover:underline">{{ t('forgot_password.back_to_login') }}</router-link>
        </div>
      </form>
    </div>
  </div>
</template>