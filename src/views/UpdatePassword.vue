<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useI18n } from 'vue-i18n';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';

const { t } = useI18n();
const auth = useAuthStore();
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const msg = ref('');

const handleUpdate = async () => {
  if (password.value !== confirmPassword.value) {
    msg.value = t('update_password.error_mismatch');
    return;
  }

  loading.value = true;
  msg.value = '';
  
  try {
    await auth.updateUserPassword(password.value);
    alert(t('update_password.success'));
    window.location.href = '/dashboard';
  } catch (error) {
    msg.value = "Erreur: " + error.message;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <h1 class="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">{{ t('update_password.title') }}</h1>
      <form @submit.prevent="handleUpdate" class="space-y-4">
        <div class="flex flex-col gap-2">
          <label class="text-gray-700 dark:text-gray-300">{{ t('update_password.new_password') }}</label>
          <Password v-model="password" toggleMask class="w-full" inputClass="w-full" required />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-gray-700 dark:text-gray-300">{{ t('update_password.confirm_password') }}</label>
          <Password v-model="confirmPassword" toggleMask :feedback="false" class="w-full" inputClass="w-full" required />
        </div>
        <Message v-if="msg" severity="error" :closable="false">{{ msg }}</Message>
        <Button type="submit" :label="t('update_password.submit')" :loading="loading" class="w-full" />
      </form>
    </div>
  </div>
</template>