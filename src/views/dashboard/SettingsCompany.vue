<script setup>
import { ref, onMounted } from 'vue';
import { useCompanyStore } from '../../stores/company';
import { useAuthStore } from '../../stores/auth';
import { supabase } from '../../supabase';
import { FORMES_JURIDIQUES, CONDITIONS_PAIEMENT } from '../../config/constants';

// PrimeVue Imports
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputMask from 'primevue/inputmask';
import Button from 'primevue/button';
import FileUpload from 'primevue/fileupload';
import Checkbox from 'primevue/checkbox';
import ToggleSwitch from 'primevue/toggleswitch';
import Message from 'primevue/message';
import Divider from 'primevue/divider';
import DatePicker from 'primevue/datepicker';

import { useI18n } from 'vue-i18n';
import { useFormValidation } from '../../composables/useFormValidation';
import AddressAutocomplete from '../../components/common/AddressAutocomplete.vue';

const store = useCompanyStore();
const authStore = useAuthStore();
const { t } = useI18n();
const saving = ref(false);
const message = ref(null);
const activeTab = ref(0);
const { errors, validate, clearError } = useFormValidation();

// Données locales du formulaire — structure CDC 6 onglets
const form = ref({
  // ── Onglet 1 : Identité & coordonnées ──
  name: '',
  forme_juridique: '',
  address: '',
  zip_code: '',
  city: '',
  country: 'France',
  phone: '',
  email: '',
  currency: 'EUR',
  logo_url: '',
  representant_legal: '',
  website: '',

  // ── Onglet 2 : Juridique & conformité ──
  nda_numero: '',
  nda_date_enregistrement: null,
  nda_region: '',
  nda_afficher_conventions: false,
  nda_afficher_factures: false,
  nda_afficher_commerciaux: false,
  qualiopi_certifie: false,
  qualiopi_certificateur: '',
  qualiopi_date_certification: null,
  qualiopi_date_fin: null,
  qualiopi_certificat_url: '',
  handicap_nom: '',
  handicap_fonction: '',
  handicap_email: '',
  handicap_telephone: '',
  handicap_afficher_programmes: false,

  // Champs juridiques existants conservés
  capital: 0,
  vat_number: '',
  siren: '',
  siret: '',
  naf_ape: '',
  rcs_rm: '',

  // ── Onglet 3 : Paramètres documents ──
  doc_afficher_logo: true,
  doc_signature_representant: false,
  doc_mention_rgpd: false,
  doc_mention_nda: false,

  // ── Onglet 4 : Email & envoi ──
  email_nom_expediteur: '',
  email_signature: '',
  email_envoi_auto: false,
  email_signature_electronique: false,

  // ── Onglet 5 : RGPD & DPO ──
  dpo_nom: '',
  dpo_email: '',
  politique_confidentialite: '',
  duree_conservation_donnees: 5,

  // ── Onglet 6 : Financier ──
  tva_assujetti: true,
  tva_taux_defaut: 20.00,
  iban: '',
  bic: '',

  // Seuils qualité
  seuil_satisfaction_chaud: 80,
  seuil_satisfaction_formateur: 80,
  seuil_satisfaction_financeur: 80,
  seuil_quiz_validation: 70,
  seuil_taux_reponse: 60,
  declenchement_question_critique: true,

  // Paramètres facturation
  acompte_pourcentage: 30,
  acomptes_multiples: false,
  penalite_annulation: false,
  penalite_pourcentage: 0,
  conditions_paiement_defaut: '30_jours',

  // Champs existants conservés pour rétro-compat
  taxes_config: { vat_subject: true, tax_2: false, tax_3: false, fiscal_stamp: false },
  socials: {},
  opening_hours: {},
  accountant_info: {},
});

// Options
const currencies = ['EUR', 'USD', 'GBP', 'CHF'];
const countries = ['France', 'Belgique', 'Suisse', 'Canada', 'Luxembourg'];
const regions = [
  'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Bretagne',
  'Centre-Val de Loire', 'Corse', 'Grand Est', 'Hauts-de-France',
  'Île-de-France', 'Normandie', 'Nouvelle-Aquitaine', 'Occitanie',
  'Pays de la Loire', "Provence-Alpes-Côte d'Azur",
  'Guadeloupe', 'Martinique', 'Guyane', 'La Réunion', 'Mayotte'
];
const conditionsPaiementOptions = CONDITIONS_PAIEMENT.map(c => ({
  label: c.label, value: c.value
}));

onMounted(async () => {
  await store.fetchCompany();
  if (store.company) {
    form.value = { ...form.value, ...store.company };
    // Garantir les objets imbriqués
    form.value.taxes_config = store.company.taxes_config || form.value.taxes_config;
    form.value.socials = store.company.socials || {};
    form.value.opening_hours = store.company.opening_hours || {};
    form.value.accountant_info = store.company.accountant_info || {};
  }
});

const handleSave = async () => {
  const isValid = validate({ name: form.value.name });
  if (!isValid) {
    message.value = { severity: 'error', text: 'La raison sociale est obligatoire.' };
    return;
  }

  saving.value = true;
  message.value = null;
  const res = await store.saveCompany(form.value);
  if (res.success) {
    message.value = { severity: 'success', text: 'Paramètres sauvegardés avec succès' };
  } else {
    message.value = { severity: 'error', text: `Erreur : ${res.error}` };
  }
  saving.value = false;
};

// Handler autocomplétion adresse
const handleAddressSelected = (addressData) => {
  if (addressData.street) form.value.address = addressData.street;
  if (addressData.postcode) form.value.zip_code = addressData.postcode;
  if (addressData.city) form.value.city = addressData.city;
};

// Upload Logo
const uploadLogo = async (event) => {
  await authStore.refreshSession();
  const file = event.files[0];
  if (!file) return;
  const fileName = `${Date.now()}-logo-${file.name}`;
  const { error } = await supabase.storage.from('company-logos').upload(fileName, file);
  if (!error) {
    const { data: urlData } = supabase.storage.from('company-logos').getPublicUrl(fileName);
    form.value.logo_url = urlData.publicUrl;
  }
};

// Upload certificat Qualiopi
const uploadQualiopi = async (event) => {
  await authStore.refreshSession();
  const file = event.files[0];
  if (!file) return;
  const fileName = `${Date.now()}-qualiopi-${file.name}`;
  const { error } = await supabase.storage.from('company-logos').upload(fileName, file);
  if (!error) {
    const { data: urlData } = supabase.storage.from('company-logos').getPublicUrl(fileName);
    form.value.qualiopi_certificat_url = urlData.publicUrl;
  }
};
</script>

<template>
  <div class="max-w-6xl mx-auto pb-20">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Paramètres de l'entreprise</h1>
      <Button label="Enregistrer" icon="pi pi-save" :loading="saving" @click="handleSave" />
    </div>

    <Message v-if="message" :severity="message.severity" class="mb-4">{{ message.text }}</Message>

    <div class="card bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <TabView v-model:activeIndex="activeTab">

        <!-- ═══════════════════════════════════ -->
        <!-- ONGLET 1 : Identité & Coordonnées -->
        <!-- ═══════════════════════════════════ -->
        <TabPanel header="Identité & coordonnées">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
            <div class="flex flex-col gap-2">
              <label class="font-semibold">Raison sociale <span class="text-red-500">*</span></label>
              <InputText v-model="form.name" placeholder="Nom de l'entreprise" :invalid="!!errors.name" @input="clearError('name')" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="font-semibold">Forme juridique</label>
              <Dropdown v-model="form.forme_juridique" :options="FORMES_JURIDIQUES" optionLabel="label" optionValue="value" placeholder="Sélectionner" />
            </div>

            <div class="flex flex-col gap-2">
              <label class="font-semibold">Représentant légal</label>
              <InputText v-model="form.representant_legal" placeholder="Prénom Nom" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="font-semibold">Devise</label>
              <Dropdown v-model="form.currency" :options="currencies" />
            </div>

            <div class="md:col-span-2 flex flex-col gap-2">
              <label class="font-semibold">Adresse</label>
              <AddressAutocomplete
                v-model="form.address"
                @address-selected="handleAddressSelected"
                placeholder="Saisissez une adresse..."
              />
              <span class="text-xs text-gray-400"><i class="pi pi-info-circle mr-1"></i>Auto-complétion via adresse.data.gouv.fr</span>
            </div>

            <div class="flex flex-col gap-2">
              <label class="font-semibold">Code postal</label>
              <InputMask v-model="form.zip_code" mask="99999" placeholder="75001" slotChar="" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="font-semibold">Ville</label>
              <InputText v-model="form.city" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="font-semibold">Pays</label>
              <Dropdown v-model="form.country" :options="countries" />
            </div>

            <div class="flex flex-col gap-2">
              <label class="font-semibold">Téléphone</label>
              <InputMask v-model="form.phone" mask="99 99 99 99 99" placeholder="01 23 45 67 89" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="font-semibold">Email général</label>
              <InputText v-model="form.email" type="email" placeholder="contact@entreprise.fr" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="font-semibold">Site web</label>
              <InputText v-model="form.website" type="url" placeholder="https://www.entreprise.fr" />
            </div>

            <div class="flex flex-col gap-2">
              <label class="font-semibold">Logo</label>
              <img v-if="form.logo_url" :src="form.logo_url" class="h-16 mb-2 object-contain" />
              <FileUpload mode="basic" name="logo" accept="image/*" :auto="true" @select="uploadLogo" chooseLabel="Choisir un logo" />
            </div>
          </div>
        </TabPanel>

        <!-- ═══════════════════════════════════ -->
        <!-- ONGLET 2 : Juridique & Conformité -->
        <!-- ═══════════════════════════════════ -->
        <TabPanel header="Juridique & conformité">
          <div class="p-4 space-y-8">

            <!-- Identifiants légaux -->
            <div>
              <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                <i class="pi pi-id-card text-blue-500"></i> Identifiants légaux
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="flex flex-col gap-2">
                  <label>SIREN</label>
                  <InputMask v-model="form.siren" mask="999 999 999" placeholder="123 456 789" slotChar="" />
                </div>
                <div class="flex flex-col gap-2">
                  <label>SIRET</label>
                  <InputMask v-model="form.siret" mask="999 999 999 99999" placeholder="123 456 789 00012" slotChar="" />
                </div>
                <div class="flex flex-col gap-2">
                  <label>Code NAF/APE</label>
                  <InputMask v-model="form.naf_ape" mask="9999a" placeholder="8559A" slotChar="" />
                </div>
                <div class="flex flex-col gap-2">
                  <label>N° TVA intracommunautaire</label>
                  <InputText v-model="form.vat_number" placeholder="FR12345678901" />
                </div>
                <div class="flex flex-col gap-2">
                  <label>Capital social</label>
                  <InputNumber v-model="form.capital" mode="currency" currency="EUR" :min="0" />
                </div>
                <div class="flex flex-col gap-2">
                  <label>RCS / RM</label>
                  <InputText v-model="form.rcs_rm" placeholder="Paris B 123 456 789" />
                </div>
              </div>
            </div>

            <Divider />

            <!-- NDA -->
            <div>
              <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                <i class="pi pi-file text-green-500"></i> Numéro de Déclaration d'Activité (NDA)
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="flex flex-col gap-2">
                  <label>Numéro NDA</label>
                  <InputText v-model="form.nda_numero" placeholder="11 75 12345 67" />
                </div>
                <div class="flex flex-col gap-2">
                  <label>Date d'enregistrement</label>
                  <DatePicker v-model="form.nda_date_enregistrement" dateFormat="dd/mm/yy" showIcon />
                </div>
                <div class="flex flex-col gap-2">
                  <label>Région d'enregistrement</label>
                  <Dropdown v-model="form.nda_region" :options="regions" placeholder="Sélectionner" editable />
                </div>
              </div>
              <div class="flex flex-col gap-3 mt-4">
                <div class="flex items-center gap-3">
                  <ToggleSwitch v-model="form.nda_afficher_conventions" />
                  <label>Afficher le NDA sur les conventions</label>
                </div>
                <div class="flex items-center gap-3">
                  <ToggleSwitch v-model="form.nda_afficher_factures" />
                  <label>Afficher le NDA sur les factures</label>
                </div>
                <div class="flex items-center gap-3">
                  <ToggleSwitch v-model="form.nda_afficher_commerciaux" />
                  <label>Afficher le NDA sur les documents commerciaux</label>
                </div>
              </div>
            </div>

            <Divider />

            <!-- Qualiopi -->
            <div>
              <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                <i class="pi pi-verified text-purple-500"></i> Certification Qualiopi
              </h3>
              <div class="flex items-center gap-3 mb-4">
                <ToggleSwitch v-model="form.qualiopi_certifie" />
                <label class="font-semibold">Organisme certifié Qualiopi</label>
              </div>
              <div v-if="form.qualiopi_certifie" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                  <label>Certificateur</label>
                  <InputText v-model="form.qualiopi_certificateur" placeholder="AFNOR, Bureau Veritas..." />
                </div>
                <div class="flex flex-col gap-2">
                  <label>Date de certification</label>
                  <DatePicker v-model="form.qualiopi_date_certification" dateFormat="dd/mm/yy" showIcon />
                </div>
                <div class="flex flex-col gap-2">
                  <label>Date de fin de validité</label>
                  <DatePicker v-model="form.qualiopi_date_fin" dateFormat="dd/mm/yy" showIcon />
                </div>
                <div class="flex flex-col gap-2">
                  <label>Certificat (PDF)</label>
                  <div v-if="form.qualiopi_certificat_url" class="flex items-center gap-2 mb-2">
                    <a :href="form.qualiopi_certificat_url" target="_blank" class="text-blue-500 underline text-sm">Voir le certificat</a>
                  </div>
                  <FileUpload mode="basic" name="qualiopi" accept=".pdf,image/*" :auto="true" @select="uploadQualiopi" chooseLabel="Charger certificat" />
                </div>
              </div>
            </div>

            <Divider />

            <!-- Référent Handicap -->
            <div>
              <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                <i class="pi pi-heart text-orange-500"></i> Référent Handicap
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                  <label>Nom</label>
                  <InputText v-model="form.handicap_nom" />
                </div>
                <div class="flex flex-col gap-2">
                  <label>Fonction</label>
                  <InputText v-model="form.handicap_fonction" />
                </div>
                <div class="flex flex-col gap-2">
                  <label>Email</label>
                  <InputText v-model="form.handicap_email" type="email" />
                </div>
                <div class="flex flex-col gap-2">
                  <label>Téléphone</label>
                  <InputMask v-model="form.handicap_telephone" mask="99 99 99 99 99" />
                </div>
              </div>
              <div class="flex items-center gap-3 mt-4">
                <ToggleSwitch v-model="form.handicap_afficher_programmes" />
                <label>Afficher les coordonnées du référent sur les programmes</label>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- ═══════════════════════════════════ -->
        <!-- ONGLET 3 : Paramètres Documents   -->
        <!-- ═══════════════════════════════════ -->
        <TabPanel header="Documents">
          <div class="p-4 space-y-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
              <i class="pi pi-file-edit text-blue-500"></i> Options globales des documents générés
            </h3>

            <div class="flex flex-col gap-4">
              <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <ToggleSwitch v-model="form.doc_afficher_logo" />
                <div>
                  <label class="font-semibold">Afficher le logo</label>
                  <p class="text-sm text-gray-500">Le logo de l'entreprise sera affiché sur tous les documents générés</p>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <ToggleSwitch v-model="form.doc_signature_representant" />
                <div>
                  <label class="font-semibold">Signature du représentant</label>
                  <p class="text-sm text-gray-500">Ajouter automatiquement le bloc signature du représentant légal</p>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <ToggleSwitch v-model="form.doc_mention_rgpd" />
                <div>
                  <label class="font-semibold">Mention RGPD</label>
                  <p class="text-sm text-gray-500">Ajouter la mention RGPD en pied de page des documents</p>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <ToggleSwitch v-model="form.doc_mention_nda" />
                <div>
                  <label class="font-semibold">Mention NDA</label>
                  <p class="text-sm text-gray-500">Ajouter le numéro de déclaration d'activité sur les documents</p>
                </div>
              </div>
            </div>

            <Divider />

            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div class="flex items-center gap-2 mb-2">
                <i class="pi pi-info-circle text-blue-500"></i>
                <span class="font-semibold text-blue-700 dark:text-blue-300">Modèles de documents</span>
              </div>
              <p class="text-sm text-blue-600 dark:text-blue-400">
                Les modèles de documents (convention, programme, devis, facture) sont gérés dans la section
                <strong>Paramètres &gt; Types de documents</strong>.
              </p>
            </div>
          </div>
        </TabPanel>

        <!-- ═══════════════════════════════════ -->
        <!-- ONGLET 4 : Email & Envoi           -->
        <!-- ═══════════════════════════════════ -->
        <TabPanel header="Email & envoi">
          <div class="p-4 space-y-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
              <i class="pi pi-envelope text-blue-500"></i> Configuration des emails
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex flex-col gap-2">
                <label class="font-semibold">Nom de l'expéditeur</label>
                <InputText v-model="form.email_nom_expediteur" placeholder="Mon Organisme de Formation" />
                <small class="text-gray-500">Nom affiché dans les emails envoyés</small>
              </div>
              <div class="flex flex-col gap-2">
                <label class="font-semibold">Email d'envoi</label>
                <InputText v-model="form.email" type="email" placeholder="envoi@organisme.fr" />
                <small class="text-gray-500">Adresse utilisée pour l'envoi des documents</small>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <label class="font-semibold">Signature email</label>
              <Textarea v-model="form.email_signature" rows="4" placeholder="Cordialement,\nL'équipe Mon Organisme..." />
              <small class="text-gray-500">Signature ajoutée automatiquement à chaque email envoyé</small>
            </div>

            <Divider />

            <div class="flex flex-col gap-4">
              <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <ToggleSwitch v-model="form.email_envoi_auto" />
                <div>
                  <label class="font-semibold">Envoi automatique</label>
                  <p class="text-sm text-gray-500">Envoyer automatiquement les documents à leur génération (convention, convocation, attestation)</p>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <ToggleSwitch v-model="form.email_signature_electronique" />
                <div>
                  <label class="font-semibold">Signature électronique</label>
                  <p class="text-sm text-gray-500">Activer la signature électronique pour les conventions et contrats</p>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- ═══════════════════════════════════ -->
        <!-- ONGLET 5 : RGPD & DPO              -->
        <!-- ═══════════════════════════════════ -->
        <TabPanel header="RGPD & DPO">
          <div class="p-4 space-y-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
              <i class="pi pi-shield text-green-500"></i> Délégué à la Protection des Données (DPO)
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex flex-col gap-2">
                <label class="font-semibold">Nom du DPO</label>
                <InputText v-model="form.dpo_nom" placeholder="Prénom Nom" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="font-semibold">Email du DPO</label>
                <InputText v-model="form.dpo_email" type="email" placeholder="dpo@organisme.fr" />
              </div>
            </div>

            <Divider />

            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
              <i class="pi pi-lock text-green-500"></i> Politique de confidentialité
            </h3>

            <div class="flex flex-col gap-2">
              <label class="font-semibold">Politique de confidentialité</label>
              <Textarea v-model="form.politique_confidentialite" rows="6"
                placeholder="Décrivez votre politique de traitement des données personnelles..." />
              <small class="text-gray-500">Ce texte pourra être intégré dans les documents à destination des apprenants</small>
            </div>

            <div class="flex flex-col gap-2 max-w-xs">
              <label class="font-semibold">Durée de conservation des données (années)</label>
              <InputNumber v-model="form.duree_conservation_donnees" :min="1" :max="20" showButtons />
              <small class="text-gray-500">Durée légale minimale : 5 ans pour les OF</small>
            </div>
          </div>
        </TabPanel>

        <!-- ═══════════════════════════════════ -->
        <!-- ONGLET 6 : Financier                -->
        <!-- ═══════════════════════════════════ -->
        <TabPanel header="Financier">
          <div class="p-4 space-y-8">

            <!-- TVA & Coordonnées bancaires -->
            <div>
              <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                <i class="pi pi-wallet text-blue-500"></i> TVA & Coordonnées bancaires
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="flex items-center gap-3">
                  <ToggleSwitch v-model="form.tva_assujetti" />
                  <label class="font-semibold">Assujetti à la TVA</label>
                </div>
                <div class="flex flex-col gap-2">
                  <label>Taux TVA par défaut (%)</label>
                  <InputNumber v-model="form.tva_taux_defaut" :min="0" :max="30" :minFractionDigits="2" suffix=" %" />
                </div>
                <div class="flex flex-col gap-2">
                  <label>IBAN</label>
                  <InputText v-model="form.iban" placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX" />
                </div>
                <div class="flex flex-col gap-2">
                  <label>BIC</label>
                  <InputText v-model="form.bic" placeholder="BNPAFRPP" />
                </div>
              </div>
            </div>

            <Divider />

            <!-- Paramètres facturation -->
            <div>
              <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                <i class="pi pi-receipt text-orange-500"></i> Paramètres de facturation
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="flex flex-col gap-2">
                  <label>% acompte par défaut</label>
                  <InputNumber v-model="form.acompte_pourcentage" :min="0" :max="100" suffix=" %" />
                </div>
                <div class="flex flex-col gap-2">
                  <label>Conditions de paiement par défaut</label>
                  <Dropdown v-model="form.conditions_paiement_defaut" :options="conditionsPaiementOptions"
                    optionLabel="label" optionValue="value" />
                </div>
                <div class="flex items-center gap-3">
                  <ToggleSwitch v-model="form.acomptes_multiples" />
                  <label>Autoriser les acomptes multiples</label>
                </div>
                <div class="flex items-center gap-3">
                  <ToggleSwitch v-model="form.penalite_annulation" />
                  <label>Pénalité d'annulation</label>
                </div>
                <div v-if="form.penalite_annulation" class="flex flex-col gap-2">
                  <label>% pénalité d'annulation</label>
                  <InputNumber v-model="form.penalite_pourcentage" :min="0" :max="100" suffix=" %" />
                </div>
              </div>
            </div>

            <Divider />

            <!-- Seuils qualité -->
            <div>
              <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                <i class="pi pi-chart-bar text-purple-500"></i> Seuils qualité
              </h3>
              <p class="text-sm text-gray-500 mb-4">
                Ces seuils déclenchent automatiquement des signaux qualité lorsqu'ils ne sont pas atteints.
              </p>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="flex flex-col gap-2">
                  <label>Satisfaction stagiaires (à chaud)</label>
                  <InputNumber v-model="form.seuil_satisfaction_chaud" :min="0" :max="100" suffix=" %" />
                </div>
                <div class="flex flex-col gap-2">
                  <label>Satisfaction formateurs</label>
                  <InputNumber v-model="form.seuil_satisfaction_formateur" :min="0" :max="100" suffix=" %" />
                </div>
                <div class="flex flex-col gap-2">
                  <label>Satisfaction financeurs</label>
                  <InputNumber v-model="form.seuil_satisfaction_financeur" :min="0" :max="100" suffix=" %" />
                </div>
                <div class="flex flex-col gap-2">
                  <label>Quiz de validation (seuil réussite)</label>
                  <InputNumber v-model="form.seuil_quiz_validation" :min="0" :max="100" suffix=" %" />
                </div>
                <div class="flex flex-col gap-2">
                  <label>Taux de réponse minimum</label>
                  <InputNumber v-model="form.seuil_taux_reponse" :min="0" :max="100" suffix=" %" />
                </div>
                <div class="flex items-center gap-3">
                  <ToggleSwitch v-model="form.declenchement_question_critique" />
                  <label>Déclencher un signal sur question critique</label>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

      </TabView>
    </div>
  </div>
</template>
