<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useI18n } from 'vue-i18n';
import { supabase } from '../supabase';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';
import InputText from 'primevue/inputtext';
import { useFormValidation } from '../composables/useFormValidation';

const { t } = useI18n();
const auth = useAuthStore();
const password = ref('');
const confirmPassword = ref('');
const organizationName = ref('');
const loading = ref(false);
const msg = ref('');

// Détecter si l'utilisateur arrive via une invitation (pas d'organisation)
const isInvite = window.location.hash.includes('type=invite');

const { errors, validate, clearError } = useFormValidation();

/**
 * Crée une organisation et le membership owner pour un utilisateur invité
 */
const createOrganizationForUser = async (userId) => {
  // Vérifier si l'utilisateur a déjà une organisation
  const { data: existingMember } = await supabase
    .from('organization_members')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingMember) return; // Déjà membre d'une organisation

  const orgName = organizationName.value.trim();
  if (!orgName) return;

  // Créer le slug
  const slug = orgName
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now().toString(36);

  // Créer l'organisation
  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .insert({ name: orgName, slug })
    .select()
    .single();

  if (orgErr) throw orgErr;

  // Créer le membership owner
  const { error: memberErr } = await supabase
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: userId,
      role: 'owner',
    });

  if (memberErr) throw memberErr;

  // Créer l'entrée companies liée
  await supabase
    .from('companies')
    .insert({
      organization_id: org.id,
      user_id: userId,
      name: orgName,
    });
};

const handleUpdate = async () => {
  // Validation du mot de passe
  const isValid = validate({ password: password.value, confirmPassword: confirmPassword.value });
  if (!isValid) return;

  if (password.value !== confirmPassword.value) {
    msg.value = t('update_password.error_mismatch');
    return;
  }

  // Validation du nom d'organisation pour les invitations
  if (isInvite && !organizationName.value.trim()) {
    msg.value = 'Veuillez saisir le nom de votre organisme de formation.';
    return;
  }

  loading.value = true;
  msg.value = '';

  try {
    await auth.updateUserPassword(password.value);

    // Créer l'organisation si c'est une invitation
    if (isInvite && auth.user?.id) {
      await createOrganizationForUser(auth.user.id);
    }

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
      <h1 class="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
        {{ isInvite ? 'Créez votre compte Certiwize' : t('update_password.title') }}
      </h1>
      <p v-if="isInvite" class="text-center text-gray-600 dark:text-gray-400 mb-6">
        Définissez votre mot de passe et renseignez le nom de votre organisme pour commencer.
      </p>
      <form @submit.prevent="handleUpdate" class="space-y-4">
        <!-- Nom de l'organisme (uniquement pour les invitations) -->
        <div v-if="isInvite" class="flex flex-col gap-2">
          <label class="text-gray-700 dark:text-gray-300">Nom de votre organisme de formation</label>
          <InputText v-model="organizationName" placeholder="Ex : Mon Organisme Formation" class="w-full" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-gray-700 dark:text-gray-300">{{ t('update_password.new_password') }}</label>
          <Password v-model="password" toggleMask class="w-full" inputClass="w-full" :invalid="!!errors.password" @input="clearError('password')" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-gray-700 dark:text-gray-300">{{ t('update_password.confirm_password') }}</label>
          <Password v-model="confirmPassword" toggleMask :feedback="false" class="w-full" inputClass="w-full" :invalid="!!errors.confirmPassword" @input="clearError('confirmPassword')" />
        </div>
        <Message v-if="msg" severity="error" :closable="false">{{ msg }}</Message>
        <Button type="submit" :label="t('update_password.submit')" :loading="loading" class="w-full" />
      </form>
    </div>
  </div>
</template>