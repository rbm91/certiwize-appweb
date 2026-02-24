<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFacturationStore } from '../../stores/facturation';
import { FACTURE_STATUTS, FACTURE_TYPES, MODES_PAIEMENT } from '../../config/constants';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dropdown from 'primevue/dropdown';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
  typeFilter: {
    type: String,
    default: null,
    validator: (v) => v === null || v === 'avoir',
  },
});

const router = useRouter();
const store = useFacturationStore();
const toast = useToast();

// Filtres
const selectedStatut = ref(null);

// Dialog paiement
const paiementDialog = ref(false);
const paiementFacture = ref(null);
const paiementMontant = ref(0);
const paiementMode = ref('virement');

// Computed : liste filtrée
const filteredFactures = computed(() => {
  let result = store.activeFactures;

  // Filtre type avoir
  if (props.typeFilter === 'avoir') {
    result = result.filter((f) => f.type_facture === 'avoir');
  }

  // Filtre statut
  if (selectedStatut.value) {
    result = result.filter((f) => f.statut === selectedStatut.value);
  }

  return result;
});

// Indicateurs
const totalEnAttente = computed(() => store.totalEnAttente);
const totalEnRetard = computed(() => store.totalEnRetard);
const nombreFactures = computed(() => filteredFactures.value.length);

// Helpers format
const formatEur = (value) => {
  const num = parseFloat(value) || 0;
  return num.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR');
};

const getStatutSeverity = (statut) => {
  const map = {
    brouillon: 'secondary',
    emise: 'info',
    envoyee: 'contrast',
    payee: 'success',
    en_retard: 'danger',
    annulee: 'warn',
  };
  return map[statut] || 'secondary';
};

const getStatutLabel = (statut) => {
  const found = FACTURE_STATUTS.find((s) => s.value === statut);
  return found ? found.label : statut;
};

const getTypeLabel = (type) => {
  const found = FACTURE_TYPES.find((t) => t.value === type);
  return found ? found.label : type;
};

const getTypeSeverity = (type) => {
  const map = {
    standard: 'info',
    acompte: 'warn',
    solde: 'success',
    avoir: 'danger',
  };
  return map[type] || 'secondary';
};

const getClientName = (facture) => {
  if (facture.client?.nom_affiche) return facture.client.nom_affiche;
  if (facture.client?.raison_sociale) return facture.client.raison_sociale;
  return '-';
};

const getPrestationRef = (facture) => {
  if (facture.prestation?.reference) return facture.prestation.reference;
  if (facture.prestation?.intitule) return facture.prestation.intitule;
  return '-';
};

// Actions
const goToCreate = () => {
  router.push('/dashboard/factures/create');
};

const goToView = (facture) => {
  router.push(`/dashboard/factures/${facture.id}`);
};

const handleEmettre = async (facture) => {
  const res = await store.emettreFacture(facture.id);
  if (res.success) {
    toast.add({ severity: 'success', summary: 'Facture émise', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Erreur', detail: res.error, life: 5000 });
  }
};

const handleEnvoyer = async (facture) => {
  const res = await store.envoyerFacture(facture.id);
  if (res.success) {
    toast.add({ severity: 'success', summary: 'Facture envoyée', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Erreur', detail: res.error, life: 5000 });
  }
};

const openPaiementDialog = (facture) => {
  paiementFacture.value = facture;
  const restant = parseFloat(facture.montant_ttc) - parseFloat(facture.montant_paye || 0);
  paiementMontant.value = Math.round(restant * 100) / 100;
  paiementMode.value = 'virement';
  paiementDialog.value = true;
};

const handleEnregistrerPaiement = async () => {
  if (!paiementFacture.value || paiementMontant.value <= 0) return;
  const res = await store.enregistrerPaiement(
    paiementFacture.value.id,
    paiementMontant.value,
    paiementMode.value,
  );
  if (res.success) {
    toast.add({ severity: 'success', summary: 'Paiement enregistré', life: 3000 });
    paiementDialog.value = false;
  } else {
    toast.add({ severity: 'error', summary: 'Erreur', detail: res.error, life: 5000 });
  }
};

const handleCreerAvoir = async (facture) => {
  const res = await store.creerAvoir(facture.id);
  if (res.success) {
    toast.add({ severity: 'success', summary: 'Avoir créé', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Erreur', detail: res.error, life: 5000 });
  }
};

// Chargement initial
onMounted(() => {
  store.fetchFactures();
});
</script>

<template>
  <div class="p-6">
    <!-- En-tete -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
        {{ typeFilter === 'avoir' ? 'Avoirs' : 'Factures' }}
      </h1>
      <Button
        label="Nouvelle facture"
        icon="pi pi-plus"
        @click="goToCreate"
      />
    </div>

    <!-- Cartes de synthèse -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <i class="pi pi-clock text-blue-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Total en attente</p>
            <p class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ formatEur(totalEnAttente) }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <i class="pi pi-exclamation-triangle text-red-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Total en retard</p>
            <p class="text-xl font-bold text-red-600">{{ formatEur(totalEnRetard) }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <i class="pi pi-file text-green-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Nombre de factures</p>
            <p class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ nombreFactures }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtre statut -->
    <div class="flex gap-3 mb-5">
      <Dropdown
        v-model="selectedStatut"
        :options="FACTURE_STATUTS"
        optionLabel="label"
        optionValue="value"
        placeholder="Filtrer par statut"
        class="w-full lg:w-64"
        showClear
      />
    </div>

    <!-- Tableau -->
    <DataTable
      :value="filteredFactures"
      :loading="store.loading"
      stripedRows
      paginator
      :rows="10"
      :rowsPerPageOptions="[10, 25, 50]"
      rowHover
      dataKey="id"
      sortField="created_at"
      :sortOrder="-1"
    >
      <template #empty>
        <div class="flex flex-col items-center justify-center py-10 text-surface-500">
          <i class="pi pi-file text-4xl mb-3" />
          <p class="text-lg font-medium">Aucune facture trouvée</p>
          <p class="text-sm mt-1">Ajustez vos filtres ou créez une nouvelle facture.</p>
        </div>
      </template>

      <template #loading>
        <div class="flex items-center justify-center py-10 text-surface-500">
          <i class="pi pi-spin pi-spinner text-2xl mr-3" />
          Chargement des factures...
        </div>
      </template>

      <!-- Numéro -->
      <Column field="numero" header="Numéro" sortable style="min-width: 10rem">
        <template #body="{ data }">
          <span class="font-semibold text-surface-900 dark:text-surface-0">
            {{ data.numero || '-' }}
          </span>
        </template>
      </Column>

      <!-- Client -->
      <Column header="Client" sortable sortField="client.nom_affiche" style="min-width: 12rem">
        <template #body="{ data }">
          <span class="text-sm text-surface-700 dark:text-surface-300">
            {{ getClientName(data) }}
          </span>
        </template>
      </Column>

      <!-- Prestation -->
      <Column header="Prestation" style="min-width: 10rem">
        <template #body="{ data }">
          <span class="text-sm text-surface-500">
            {{ getPrestationRef(data) }}
          </span>
        </template>
      </Column>

      <!-- Type -->
      <Column field="type_facture" header="Type" sortable style="min-width: 8rem">
        <template #body="{ data }">
          <Tag :value="getTypeLabel(data.type_facture)" :severity="getTypeSeverity(data.type_facture)" />
        </template>
      </Column>

      <!-- Montant TTC -->
      <Column field="montant_ttc" header="Montant TTC" sortable style="min-width: 10rem">
        <template #body="{ data }">
          <span class="font-semibold">{{ formatEur(data.montant_ttc) }}</span>
        </template>
      </Column>

      <!-- Statut -->
      <Column field="statut" header="Statut" sortable style="min-width: 9rem">
        <template #body="{ data }">
          <Tag
            :value="getStatutLabel(data.statut)"
            :severity="getStatutSeverity(data.statut)"
            :class="{ 'line-through opacity-60': data.statut === 'annulee' }"
          />
        </template>
      </Column>

      <!-- Échéance -->
      <Column field="date_echeance" header="Échéance" sortable style="min-width: 9rem">
        <template #body="{ data }">
          <span class="text-sm" :class="{ 'text-red-500 font-semibold': data.statut === 'en_retard' }">
            {{ formatDate(data.date_echeance) }}
          </span>
        </template>
      </Column>

      <!-- Actions -->
      <Column header="Actions" style="min-width: 14rem" :exportable="false">
        <template #body="{ data }">
          <div class="flex gap-1" @click.stop>
            <Button
              icon="pi pi-eye"
              text
              rounded
              severity="info"
              v-tooltip.top="'Voir'"
              @click="goToView(data)"
            />
            <Button
              v-if="data.statut === 'brouillon'"
              icon="pi pi-check"
              text
              rounded
              severity="success"
              v-tooltip.top="'Émettre'"
              @click="handleEmettre(data)"
            />
            <Button
              v-if="data.statut === 'emise'"
              icon="pi pi-send"
              text
              rounded
              severity="info"
              v-tooltip.top="'Envoyer'"
              @click="handleEnvoyer(data)"
            />
            <Button
              v-if="['emise', 'envoyee', 'en_retard'].includes(data.statut)"
              icon="pi pi-wallet"
              text
              rounded
              severity="success"
              v-tooltip.top="'Enregistrer paiement'"
              @click="openPaiementDialog(data)"
            />
            <Button
              v-if="data.statut !== 'annulee' && data.type_facture !== 'avoir'"
              icon="pi pi-replay"
              text
              rounded
              severity="danger"
              v-tooltip.top="'Créer avoir'"
              @click="handleCreerAvoir(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Dialog paiement -->
    <Dialog
      v-model:visible="paiementDialog"
      header="Enregistrer un paiement"
      :modal="true"
      :style="{ width: '28rem' }"
    >
      <div class="flex flex-col gap-4 pt-2">
        <p class="text-sm text-surface-500">
          Facture <strong>{{ paiementFacture?.numero }}</strong> —
          Restant dû : <strong>{{ formatEur((paiementFacture?.montant_ttc || 0) - (paiementFacture?.montant_paye || 0)) }}</strong>
        </p>
        <div class="flex flex-col gap-2">
          <label class="font-semibold">Montant</label>
          <InputNumber
            v-model="paiementMontant"
            mode="currency"
            currency="EUR"
            locale="fr-FR"
            :min="0.01"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold">Mode de paiement</label>
          <Dropdown
            v-model="paiementMode"
            :options="MODES_PAIEMENT"
            optionLabel="label"
            optionValue="value"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Annuler" severity="secondary" text @click="paiementDialog = false" />
          <Button label="Enregistrer" icon="pi pi-check" @click="handleEnregistrerPaiement" />
        </div>
      </template>
    </Dialog>
  </div>
</template>
