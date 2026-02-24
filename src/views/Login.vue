<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';

const { t } = useI18n();
const auth = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');

const handleLogin = async () => {
  loading.value = true;
  errorMsg.value = '';
  
  try {
    await auth.signIn(email.value, password.value);
    window.location.href = '/dashboard';
  } catch (error) {
    errorMsg.value = t('login.error');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('login.title') }}</h1>
        <p class="text-gray-500 mt-2">{{ t('login.subtitle') }}</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('login.email') }}</label>
          <InputText v-model="email" type="email" class="w-full" required />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('login.password') }}</label>
          <Password v-model="password" :feedback="false" toggleMask class="w-full" inputClass="w-full" required />
        </div>

        <div class="text-right">
          <router-link to="/forgot-password" class="text-sm text-primary hover:underline">
            {{ t('login.forgot_password') }}
          </router-link>
        </div>

        <Message v-if="errorMsg" severity="error" :closable="false">{{ errorMsg }}</Message>

        <Button type="submit" :label="t('login.submit')" :loading="loading" class="w-full" />

        <div class="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ t('login.no_account_pricing') }}
            <router-link to="/pricing" class="text-primary hover:underline font-semibold ml-1">
              {{ t('login.see_pricing') }}
            </router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>