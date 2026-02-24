<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Message from 'primevue/message';
import { useFormValidation } from '../composables/useFormValidation';

const { t } = useI18n();
const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const fullName = ref('');
const email = ref('');
const password = ref('');
const organizationName = ref('');
const acceptTerms = ref(false);
const loading = ref(false);
const msg = ref({ type: '', content: '' });

// Gestion des invitations
const inviteToken = ref(null);
const invitationInfo = ref(null);

const { errors, validate, clearError } = useFormValidation();

onMounted(async () => {
  // Vérifier s'il y a un token d'invitation dans l'URL
  const token = route.query.invite;
  if (token) {
    inviteToken.value = token;
    await loadInvitationInfo(token);
  }
});

const loadInvitationInfo = async (token) => {
  try {
    const { supabase } = await import('../supabase');
    const { data, error } = await supabase
      .from('invitations')
      .select('email, role, organizations(name)')
      .eq('token', token)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!error && data) {
      invitationInfo.value = data;
      email.value = data.email;
    } else {
      msg.value = { type: 'warn', content: 'Cette invitation est invalide ou a expiré.' };
    }
  } catch {
    // Silencieux — l'utilisateur peut toujours s'inscrire normalement
  }
};

const handleRegister = async () => {
  // Validation de base
  const fieldsToValidate = { fullName: fullName.value, email: email.value, password: password.value };
  const isValid = validate(fieldsToValidate);
  if (!isValid) return;

  // Validation nom d'organisme (obligatoire sauf si invitation)
  if (!inviteToken.value && !organizationName.value.trim()) {
    msg.value = { type: 'error', content: 'Le nom de l\'organisme est obligatoire.' };
    return;
  }

  // Validation consentement RGPD
  if (!acceptTerms.value) {
    msg.value = { type: 'error', content: 'Vous devez accepter les conditions d\'utilisation et la politique de confidentialité.' };
    return;
  }

  loading.value = true;
  msg.value = { type: '', content: '' };

  try {
    await auth.signUp(
      email.value,
      password.value,
      fullName.value,
      inviteToken.value ? null : organizationName.value.trim(),
      inviteToken.value
    );
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
      <h1 class="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">{{ t('register.title') }}</h1>

      <!-- Bandeau invitation -->
      <div v-if="invitationInfo" class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
        <p class="text-sm text-blue-700 dark:text-blue-300">
          <i class="pi pi-building mr-1"></i>
          Vous êtes invité à rejoindre <strong>{{ invitationInfo.organizations?.name }}</strong>
        </p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <!-- Nom de l'organisme (masqué si invitation) -->
        <div v-if="!inviteToken" class="flex flex-col gap-2">
          <label class="text-gray-700 dark:text-gray-300">Nom de l'organisme <span class="text-red-500">*</span></label>
          <InputText v-model="organizationName" class="w-full" placeholder="Mon organisme de formation" />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-gray-700 dark:text-gray-300">{{ t('register.full_name') }}</label>
          <InputText v-model="fullName" class="w-full" :invalid="!!errors.fullName" @input="clearError('fullName')" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-gray-700 dark:text-gray-300">{{ t('register.email') }}</label>
          <InputText v-model="email" type="email" class="w-full" :invalid="!!errors.email" :disabled="!!invitationInfo" @input="clearError('email')" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-gray-700 dark:text-gray-300">{{ t('register.password') }}</label>
          <Password v-model="password" toggleMask class="w-full" inputClass="w-full" :invalid="!!errors.password" @input="clearError('password')" />
        </div>

        <!-- Consentement RGPD -->
        <div class="flex items-start gap-3 mt-2">
          <Checkbox v-model="acceptTerms" :binary="true" inputId="accept-terms" />
          <label for="accept-terms" class="text-sm text-gray-600 dark:text-gray-400 leading-tight cursor-pointer">
            J'accepte les <a href="#" class="text-primary hover:underline">conditions d'utilisation</a>
            et la <a href="#" class="text-primary hover:underline">politique de confidentialité</a>.
            Mes données seront traitées conformément au RGPD.
          </label>
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
