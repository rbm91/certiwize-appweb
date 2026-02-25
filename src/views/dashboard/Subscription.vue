<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import { useConfirm } from 'primevue/useconfirm';
import ConfirmDialog from 'primevue/confirmdialog';
import { supabase } from '../../supabase';

const { t } = useI18n();
const confirm = useConfirm();

const loading = ref(true);
const subscription = ref(null);
const errorMsg = ref('');
const cancelLoading = ref(false);
const cancelSuccess = ref(false);

const statusSeverity = computed(() => {
  if (!subscription.value) return 'secondary';
  switch (subscription.value.status) {
    case 'active': return 'success';
    case 'cancelled': return 'danger';
    case 'expired': return 'warn';
    case 'pending': return 'info';
    default: return 'secondary';
  }
});

const statusLabel = computed(() => {
  if (!subscription.value) return '';
  switch (subscription.value.status) {
    case 'active': return 'Actif';
    case 'cancelled': return 'Annulé';
    case 'expired': return 'Expiré';
    case 'pending': return 'En attente';
    default: return subscription.value.status;
  }
});

const planLabel = computed(() => {
  if (!subscription.value) return '';
  return subscription.value.plan === 'yearly' ? 'Annuel' : 'Mensuel';
});

const amountFormatted = computed(() => {
  if (!subscription.value) return '';
  const euros = (subscription.value.amount / 100).toFixed(2).replace('.', ',');
  return `${euros} €`;
});

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const fetchSubscription = async () => {
  loading.value = true;
  errorMsg.value = '';

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      errorMsg.value = 'Utilisateur non connecté';
      loading.value = false;
      return;
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('[Subscription] Fetch error:', error.message);
      // Table might not exist yet
    }

    subscription.value = data;
  } catch (err) {
    console.error('[Subscription] Error:', err);
    errorMsg.value = 'Impossible de charger les informations d\'abonnement.';
  } finally {
    loading.value = false;
  }
};

const confirmCancel = () => {
  confirm.require({
    message: 'Êtes-vous sûr de vouloir annuler votre abonnement ? Votre accès restera actif jusqu\'à la fin de la période en cours.',
    header: 'Annulation de l\'abonnement',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Non, garder mon abonnement',
    acceptLabel: 'Oui, annuler',
    acceptClass: 'p-button-danger',
    accept: () => cancelSubscription(),
  });
};

const cancelSubscription = async () => {
  cancelLoading.value = true;
  errorMsg.value = '';

  try {
    const response = await fetch('/api/cancel-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription_id: subscription.value.external_subscription_id,
        user_id: subscription.value.user_id,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de l\'annulation');
    }

    cancelSuccess.value = true;
    subscription.value.status = 'cancelled';
    subscription.value.cancelled_at = new Date().toISOString();
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    cancelLoading.value = false;
  }
};

onMounted(fetchSubscription);
</script>

<template>
  <div class="space-y-6">
    <ConfirmDialog />

    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Mon abonnement</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Gérez votre abonnement Certigestion</p>
      </div>
    </div>

    <!-- Error -->
    <Message v-if="errorMsg" severity="error" :closable="true" @close="errorMsg = ''">
      {{ errorMsg }}
    </Message>

    <!-- Cancel success -->
    <Message v-if="cancelSuccess" severity="warn" :closable="false">
      Votre abonnement a été annulé. Votre accès reste actif jusqu'au {{ formatDate(subscription?.ends_at) }}.
    </Message>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <i class="pi pi-spin pi-spinner text-4xl text-gray-400"></i>
    </div>

    <!-- No subscription -->
    <Card v-else-if="!subscription">
      <template #content>
        <div class="text-center py-8">
          <i class="pi pi-credit-card text-5xl text-gray-300 dark:text-gray-600 mb-4"></i>
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Aucun abonnement actif</h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">Vous n'avez pas encore souscrit à un abonnement Certigestion.</p>
          <Button label="Voir les tarifs" icon="pi pi-arrow-right" @click="$router.push('/pricing')" />
        </div>
      </template>
    </Card>

    <!-- Subscription details -->
    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Plan info -->
        <Card class="lg:col-span-2">
          <template #title>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-bold">Détails de l'abonnement</h2>
              <Tag :value="statusLabel" :severity="statusSeverity" />
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Plan</p>
                <p class="font-semibold text-gray-900 dark:text-white">Certigestion — {{ planLabel }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Montant</p>
                <p class="font-semibold text-gray-900 dark:text-white">{{ amountFormatted }} / {{ subscription.plan === 'yearly' ? 'an' : 'mois' }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Début de l'abonnement</p>
                <p class="font-semibold text-gray-900 dark:text-white">{{ formatDate(subscription.starts_at) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Prochaine échéance</p>
                <p class="font-semibold text-gray-900 dark:text-white">{{ formatDate(subscription.ends_at) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Moyen de paiement</p>
                <p class="font-semibold text-gray-900 dark:text-white">
                  <span class="px-2 py-0.5 bg-gray-800 text-white text-xs font-bold rounded mr-2">SEPA</span>
                  Prélèvement via GoCardless
                </p>
              </div>
              <div v-if="subscription.cancelled_at">
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Annulé le</p>
                <p class="font-semibold text-red-600">{{ formatDate(subscription.cancelled_at) }}</p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Billing info -->
        <Card>
          <template #title>
            <h2 class="text-lg font-bold">Informations de facturation</h2>
          </template>
          <template #content>
            <div class="space-y-3 text-sm">
              <div v-if="subscription.billing_company">
                <p class="text-gray-500 dark:text-gray-400">Entreprise</p>
                <p class="font-medium text-gray-900 dark:text-white">{{ subscription.billing_company }}</p>
              </div>
              <div>
                <p class="text-gray-500 dark:text-gray-400">Nom</p>
                <p class="font-medium text-gray-900 dark:text-white">{{ subscription.billing_first_name }} {{ subscription.billing_last_name }}</p>
              </div>
              <div>
                <p class="text-gray-500 dark:text-gray-400">Email</p>
                <p class="font-medium text-gray-900 dark:text-white">{{ subscription.billing_email }}</p>
              </div>
              <div v-if="subscription.billing_tax_id">
                <p class="text-gray-500 dark:text-gray-400">N° TVA</p>
                <p class="font-medium text-gray-900 dark:text-white">{{ subscription.billing_tax_id }}</p>
              </div>
              <div v-if="subscription.billing_phone">
                <p class="text-gray-500 dark:text-gray-400">Téléphone</p>
                <p class="font-medium text-gray-900 dark:text-white">{{ subscription.billing_phone }}</p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Actions -->
      <Card v-if="subscription.status === 'active'">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">Annuler mon abonnement</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Votre accès restera actif jusqu'à la fin de la période en cours ({{ formatDate(subscription.ends_at) }}).
              </p>
            </div>
            <Button
              label="Annuler l'abonnement"
              severity="danger"
              outlined
              :loading="cancelLoading"
              @click="confirmCancel"
            />
          </div>
        </template>
      </Card>

      <!-- Guarantee -->
      <div class="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <i class="pi pi-shield text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"></i>
        <div class="text-sm text-blue-800 dark:text-blue-300">
          <strong>Satisfait ou remboursé</strong> — Vous bénéficiez d'une garantie de 30 jours.
          Pour toute question, contactez-nous à <a href="mailto:contact@certiwize.com" class="underline">contact@certiwize.com</a>.
        </div>
      </div>
    </template>
  </div>
</template>
