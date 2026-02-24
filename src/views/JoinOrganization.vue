<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '../supabase';
import { useAuthStore } from '../stores/auth';
import Button from 'primevue/button';
import Message from 'primevue/message';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const loading = ref(true);
const joining = ref(false);
const invitation = ref(null);
const error = ref(null);
const success = ref(false);

onMounted(async () => {
  const token = route.params.token;
  if (!token) {
    error.value = 'Lien d\'invitation invalide.';
    loading.value = false;
    return;
  }

  try {
    // Charger les infos de l'invitation
    const { data, error: err } = await supabase
      .from('invitations')
      .select('*, organizations(name, slug)')
      .eq('token', token)
      .is('accepted_at', null)
      .single();

    if (err || !data) {
      error.value = 'Cette invitation est invalide ou a déjà été utilisée.';
      loading.value = false;
      return;
    }

    // Vérifier l'expiration
    if (new Date(data.expires_at) < new Date()) {
      error.value = 'Cette invitation a expiré.';
      loading.value = false;
      return;
    }

    invitation.value = data;
  } catch {
    error.value = 'Erreur lors du chargement de l\'invitation.';
  } finally {
    loading.value = false;
  }
});

const handleJoin = async () => {
  if (!invitation.value) return;

  // Si l'utilisateur n'est pas connecté, rediriger vers l'inscription
  if (!auth.user) {
    router.push(`/register?invite=${route.params.token}`);
    return;
  }

  joining.value = true;
  try {
    // Vérifier que l'utilisateur n'est pas déjà membre
    const { data: existing } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', invitation.value.organization_id)
      .eq('user_id', auth.user.id)
      .single();

    if (existing) {
      error.value = 'Vous êtes déjà membre de cette organisation.';
      joining.value = false;
      return;
    }

    // Créer le membership
    const { error: memberErr } = await supabase
      .from('organization_members')
      .insert({
        organization_id: invitation.value.organization_id,
        user_id: auth.user.id,
        role: invitation.value.role,
        invited_by: invitation.value.invited_by,
      });

    if (memberErr) throw memberErr;

    // Marquer l'invitation comme acceptée
    await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.value.id);

    // Recharger les organisations
    await auth.fetchUserOrganizations(auth.user.id);

    // Enregistrer le consentement RGPD
    await supabase
      .from('consent_logs')
      .insert({
        user_id: auth.user.id,
        consent_type: 'data_processing',
        granted: true,
        user_agent: navigator.userAgent,
      });

    success.value = true;
    setTimeout(() => router.push('/dashboard'), 2000);
  } catch (err) {
    error.value = err.message || 'Erreur lors de l\'adhésion.';
  } finally {
    joining.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">

      <!-- Chargement -->
      <div v-if="loading" class="py-8">
        <i class="pi pi-spin pi-spinner text-4xl text-primary mb-4 block"></i>
        <p class="text-gray-500">Vérification de l'invitation...</p>
      </div>

      <!-- Erreur -->
      <div v-else-if="error">
        <i class="pi pi-times-circle text-5xl text-red-500 mb-4 block"></i>
        <Message severity="error" :closable="false">{{ error }}</Message>
        <Button label="Retour à l'accueil" icon="pi pi-home" class="mt-4" @click="router.push('/')" />
      </div>

      <!-- Succès -->
      <div v-else-if="success">
        <i class="pi pi-check-circle text-5xl text-green-500 mb-4 block"></i>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Bienvenue !</h2>
        <p class="text-gray-600 dark:text-gray-400">
          Vous avez rejoint <strong>{{ invitation.organizations?.name }}</strong>. Redirection en cours...
        </p>
      </div>

      <!-- Invitation valide -->
      <div v-else-if="invitation">
        <i class="pi pi-building text-5xl text-primary mb-4 block"></i>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Invitation à rejoindre</h2>
        <p class="text-2xl font-semibold text-primary mb-4">{{ invitation.organizations?.name }}</p>
        <p class="text-gray-600 dark:text-gray-400 mb-2">
          Vous êtes invité en tant que <strong>{{ invitation.role === 'admin' ? 'Administrateur' : 'Membre' }}</strong>.
        </p>
        <p class="text-sm text-gray-500 mb-6">
          Invitation envoyée à {{ invitation.email }}
        </p>

        <Button
          v-if="auth.user"
          :label="joining ? 'Adhésion en cours...' : 'Rejoindre l\'organisation'"
          icon="pi pi-sign-in"
          :loading="joining"
          class="w-full"
          @click="handleJoin"
        />
        <div v-else class="space-y-3">
          <Button
            label="Créer un compte et rejoindre"
            icon="pi pi-user-plus"
            class="w-full"
            @click="router.push(`/register?invite=${route.params.token}`)"
          />
          <Button
            label="Se connecter et rejoindre"
            icon="pi pi-sign-in"
            class="w-full"
            severity="secondary"
            @click="router.push(`/login?redirect=/join/${route.params.token}`)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
