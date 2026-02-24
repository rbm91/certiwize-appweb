<script setup>
import { ref, computed, onMounted } from 'vue';
import { useCompanyStore } from '../../stores/company';
import { useInvoiceNumbering } from '../../composables/useInvoiceNumbering';
import { CONDITIONS_PAIEMENT } from '../../config/constants';
import { useToast } from 'primevue/usetoast';

import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';
import ToggleSwitch from 'primevue/toggleswitch';
import Divider from 'primevue/divider';
import Message from 'primevue/message';

const companyStore = useCompanyStore();
const { getNextNumber, getNextAvoirNumber } = useInvoiceNumbering();
const toast = useToast();

const saving = ref(false);
const message = ref(null);
const nextFactureNumber = ref('');
const nextAvoirNumber = ref('');

// Form data
const form = ref({
  tva_taux_defaut: 20.00,
  tva_assujetti: true,
  conditions_paiement_defaut: '30_jours',
  mentions_legales_facture: '',
  nda_numero: '',
  nda_afficher_factures: false,
  iban: '',
  bic: '',
  banque_nom: '',
});

const conditionsPaiementOptions = CONDITIONS_PAIEMENT.map(c => ({
  label: c.label, value: c.value,
}));

// Computed
const isExonereTva = computed({
  get: () => !form.value.tva_assujetti,
  set: (val) => { form.value.tva_assujetti = !val; },
});

// Load numbering preview
const loadNumberingPreview = async () => {
  try {
    nextFactureNumber.value = await getNextNumber();
    nextAvoirNumber.value = await getNextAvoirNumber();
  } catch (e) {
    nextFactureNumber.value = 'Erreur';
    nextAvoirNumber.value = 'Erreur';
  }
};

// Init
onMounted(async () => {
  await companyStore.fetchCompany();
  if (companyStore.company) {
    form.value = {
      tva_taux_defaut: companyStore.company.tva_taux_defaut ?? 20.00,
      tva_assujetti: companyStore.company.tva_assujetti ?? true,
      conditions_paiement_defaut: companyStore.company.conditions_paiement_defaut ?? '30_jours',
      mentions_legales_facture: companyStore.company.mentions_legales_facture ?? '',
      nda_numero: companyStore.company.nda_numero ?? '',
      nda_afficher_factures: companyStore.company.nda_afficher_factures ?? false,
      iban: companyStore.company.iban ?? '',
      bic: companyStore.company.bic ?? '',
      banque_nom: companyStore.company.banque_nom ?? '',
    };
  }
  await loadNumberingPreview();
});

// Save
const handleSave = async () => {
  saving.value = true;
  message.value = null;

  const res = await companyStore.savePartial(form.value);

  if (res.success) {
    message.value = { severity: 'success', text: 'Paramètres de facturation sauvegardés avec succès' };
    toast.add({ severity: 'success', summary: 'Sauvegarde', detail: 'Paramètres mis à jour', life: 3000 });
  } else {
    message.value = { severity: 'error', text: `Erreur : ${res.error}` };
    toast.add({ severity: 'error', summary: 'Erreur', detail: res.error, life: 5000 });
  }

  saving.value = false;
};
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto pb-20">
    <!-- En-tete -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
        Paramètres Facturation
      </h1>
      <Button
        label="Enregistrer"
        icon="pi pi-save"
        :loading="saving"
        @click="handleSave"
      />
    </div>

    <Message v-if="message" :severity="message.severity" class="mb-4">{{ message.text }}</Message>

    <!-- Section 1 : Numérotation -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
      <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
        <i class="pi pi-hashtag mr-2"></i>Numérotation
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-surface-700 dark:text-surface-300">Format factures</label>
          <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p class="text-sm text-surface-500 mb-1">Préfixe : <strong>FA</strong></p>
            <p class="text-sm text-surface-500 mb-1">Format : <strong>FA-AAAA-NNNNN</strong></p>
            <p class="text-sm text-surface-500">Prochain numéro :</p>
            <p class="text-lg font-bold text-primary mt-1">{{ nextFactureNumber || '...' }}</p>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-semibold text-surface-700 dark:text-surface-300">Format avoirs</label>
          <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p class="text-sm text-surface-500 mb-1">Préfixe : <strong>AV</strong></p>
            <p class="text-sm text-surface-500 mb-1">Format : <strong>AV-AAAA-NNNNN</strong></p>
            <p class="text-sm text-surface-500">Prochain numéro :</p>
            <p class="text-lg font-bold text-primary mt-1">{{ nextAvoirNumber || '...' }}</p>
          </div>
        </div>
      </div>

      <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div class="flex items-center gap-2">
          <i class="pi pi-info-circle text-blue-500"></i>
          <span class="text-sm text-blue-700 dark:text-blue-300">
            La numérotation est séquentielle et continue, conformément à la réglementation. Elle ne peut pas être modifiée manuellement.
          </span>
        </div>
      </div>
    </div>

    <!-- Section 2 : TVA -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
      <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
        <i class="pi pi-percentage mr-2"></i>TVA
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="flex flex-col gap-2">
          <label class="font-semibold">Taux TVA par défaut (%)</label>
          <InputNumber
            v-model="form.tva_taux_defaut"
            :min="0"
            :max="30"
            :minFractionDigits="2"
            suffix=" %"
            :disabled="isExonereTva"
          />
        </div>

        <div class="flex items-center gap-3 self-end pb-2">
          <ToggleSwitch v-model="isExonereTva" />
          <div>
            <label class="font-semibold">Exonéré de TVA</label>
            <p class="text-sm text-surface-500">Désactive la TVA sur toutes les factures</p>
          </div>
        </div>
      </div>

      <div v-if="isExonereTva" class="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
        <div class="flex items-center gap-2">
          <i class="pi pi-exclamation-triangle text-orange-500"></i>
          <span class="text-sm text-orange-700 dark:text-orange-300">
            TVA exonérée active. La mention "TVA non applicable, article 293 B du CGI" sera ajoutée automatiquement sur les factures.
          </span>
        </div>
      </div>
    </div>

    <!-- Section 3 : Conditions de paiement -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
      <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
        <i class="pi pi-calendar mr-2"></i>Conditions de paiement
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="flex flex-col gap-2">
          <label class="font-semibold">Conditions par défaut</label>
          <Dropdown
            v-model="form.conditions_paiement_defaut"
            :options="conditionsPaiementOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Sélectionner"
          />
          <small class="text-surface-500">Appliquées automatiquement lors de la création d'une facture</small>
        </div>
      </div>
    </div>

    <!-- Section 4 : Mentions légales -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
      <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
        <i class="pi pi-file-edit mr-2"></i>Mentions légales
      </h2>

      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <label class="font-semibold">Mentions légales par défaut sur les factures</label>
          <Textarea
            v-model="form.mentions_legales_facture"
            rows="5"
            placeholder="Saisir les mentions légales qui apparaîtront en bas de chaque facture..."
          />
          <small class="text-surface-500">Ces mentions seront ajoutées automatiquement sur toutes les nouvelles factures</small>
        </div>

        <Divider />

        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <ToggleSwitch v-model="form.nda_afficher_factures" />
            <div>
              <label class="font-semibold">Afficher le NDA sur les factures</label>
              <p class="text-sm text-surface-500">
                Numéro de déclaration d'activité actuel :
                <strong>{{ form.nda_numero || 'Non renseigné' }}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 5 : Coordonnées bancaires -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
      <h2 class="text-lg font-semibold text-primary border-b pb-2 mb-6">
        <i class="pi pi-wallet mr-2"></i>Coordonnées bancaires
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="flex flex-col gap-2 md:col-span-2">
          <label class="font-semibold">Nom de la banque</label>
          <InputText v-model="form.banque_nom" placeholder="Ex : BNP Paribas" />
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-semibold">IBAN</label>
          <InputText v-model="form.iban" placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX" />
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-semibold">BIC</label>
          <InputText v-model="form.bic" placeholder="BNPAFRPP" />
        </div>
      </div>

      <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div class="flex items-center gap-2">
          <i class="pi pi-info-circle text-blue-500"></i>
          <span class="text-sm text-blue-700 dark:text-blue-300">
            Ces coordonnées bancaires apparaîtront sur les factures pour permettre le règlement par virement.
          </span>
        </div>
      </div>
    </div>

    <!-- Bouton save flottant en bas -->
    <div class="flex justify-end mt-6">
      <Button
        label="Enregistrer les paramètres"
        icon="pi pi-save"
        :loading="saving"
        @click="handleSave"
        class="w-full md:w-auto"
      />
    </div>
  </div>
</template>
