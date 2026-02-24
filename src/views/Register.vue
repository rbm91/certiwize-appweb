<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';

const { t } = useI18n();
const auth = useAuthStore();
const router = useRouter();

const fullName = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);
const msg = ref({ type: '', content: '' });

const handleRegister = async () => {
  loading.value = true;
  msg.value = { type: '', content: '' };
  
  try {
    await auth.signUp(email.value, password.value, fullName.value);
    msg.value = { type: 'success', content: t('register.success') };
    setTimeout(() => router.push('/login'), 3000);
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
      <h1 class="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">{{ t('register.title') }}</h1>
      
      <form @submit.prevent="handleRegister" class="space-y-4">
        <div class="flex flex-col gap-2">
          <label class="text-gray-700 dark:text-gray-300">{{ t('register.full_name') }}</label>
          <InputText v-model="fullName" required class="w-full" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-gray-700 dark:text-gray-300">{{ t('register.email') }}</label>
          <InputText v-model="email" type="email" required class="w-full" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-gray-700 dark:text-gray-300">{{ t('register.password') }}</label>
          <Password v-model="password" toggleMask class="w-full" inputClass="w-full" required />
        </div>

        <Message v-if="msg.content" :severity="msg.type" :closable="false">{{ msg.content }}</Message>

        <Button type="submit" :label="t('register.submit')" :loading="loading" class="w-full" />
        
        <div class="text-center mt-4">
          <router-link to="/login" class="text-sm text-primary hover:underline">
            {{ t('register.have_account') }} {{ t('register.login') }}
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>