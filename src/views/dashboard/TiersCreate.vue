<script setup>
import { ref, onMounted, computed } from 'vue';
import { useDataStore } from '../../stores/data';
import { useRoute } from 'vue-router';
// Supabase import retiré car plus besoin de charger la liste des utilisateurs

// Imports PrimeVue
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import InputNumber from 'primevue/inputnumber';
import FileUpload from 'primevue/fileupload';
// MultiSelect retiré
import Message from 'primevue/message';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import Chips from 'primevue/chips';

const route = useRoute();
const dataStore = useDataStore();

// --- Données du formulaire ---
// ... (rest of form definition)

// ...

// --- Actions ---

const form = ref({
    // 1 & 2. Identité
    name: '',
    alt_name: '',
    tier_type: [],
    code_client: '',
    code_fournisseur: '',
    state: 'Ouvert',
    barcode: '',
    is_trainer: false, // Ajout champ Formateur
    is_opco: false,    // Ajout champ OPCO
    
    // 3. Coordonnées
    address: '',
    zip_code: '',
    city: '',
    country: 'FR',
    department: null,
    phone: '',
    mobile: '',
    fax: '',
    website: '',
    email: '',
    refuse_mass_mail: false,
    show_socials: false,

    // 4. Infos légales
    siren: '',
    siret: '',
    naf_ape: '',
    rcs_rm: '',
    eori_number: '',
    rna_number: '',
    tva_subject: false,
    tva_number: '',
    legal_entity_type: null,
    workforce: 0,
    capital: 0,

    // 5. Paramètres
    default_lang: 'Français',
    payment_conditions: null,
    payment_mode: null,
    tags_client: [], 
    tags_supplier: [],
    currency: 'EUR',

    // 6. Ressources
    assigned_to: ''
});

// --- Actions ---

const isEditing = ref(false);
const tierId = ref(null);

onMounted(async () => {
    if (route.params.id) {
        isEditing.value = true;
        tierId.value = route.params.id;

        const tier = await dataStore.getTierById(tierId.value);
        if (tier) {
            form.value = {
                ...form.value,
                ...tier,
                tier_type: tier.tier_type || [],
                tags_client: tier.tags_client || [],
                tags_supplier: tier.tags_supplier || []
            };
        } else {
            errorMsg.value = "Impossible de charger les données du tiers (ID non trouvé).";
        }
    }
});


// --- Options des listes ---
const typeOptions = ['Prospect', 'Client', 'Fournisseur'];
const stateOptions = ['Ouvert', 'Fermé', 'En sommeil'];
const countryOptions = [{label: 'France (FR)', value: 'FR'}, {label: 'Belgique (BE)', value: 'BE'}];
const deptOptions = ['75 - Paris', '91 - Essonne', '92 - Hauts-de-Seine', '33 - Gironde', '69 - Rhône']; 
const yesNoOptions = [{ label: 'Oui', value: true }, { label: 'Non', value: false }];
const legalEntities = ['SAS', 'SARL', 'EURL', 'Auto-entrepreneur', 'SA', 'SCI'];
const langOptions = ['Français', 'Anglais', 'Espagnol'];
const payConditions = ['30 jours fin de mois', 'Comptant', '45 jours', '60 jours'];
const payModes = ['Virement', 'Chèque', 'Prélèvement', 'Carte Bancaire'];
const currencyOptions = [{label: 'Euros (€)', value: 'EUR'}, {label: 'Dollars ($)', value: 'USD'}];

const submitting = ref(false);
const errorMsg = ref('');

// Validation du formulaire
const isFormValid = computed(() => {
    return form.value.name?.trim() !== '';
});

// --- Actions ---



const handleSubmit = async () => {
    submitting.value = true;
    errorMsg.value = '';

    let result;
    if (isEditing.value) {
        result = await dataStore.updateTier(tierId.value, form.value);
    } else {
        result = await dataStore.createTier(form.value);
    }

    if (result.success) {
        window.location.href = '/dashboard/tiers';
    } else {
        errorMsg.value = "Erreur lors de l'enregistrement : " + result.error;
    }
    submitting.value = false;
};

const verifyTva = () => {
    // TODO: Implémenter la vérification VIES API
};

const onLogoUpload = (_event) => {
    // Fichier logo sélectionné - traitement à implémenter
};

const goBack = () => {
    window.location.href = '/dashboard/tiers';
};
</script>

<template>
    <div class="max-w-5xl mx-auto bg-gray-50 dark:bg-gray-900 pb-20">
        
        <div class="bg-white dark:bg-gray-800 p-6 shadow-sm sticky top-0 z-10 mb-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-4">
                <Button icon="pi pi-arrow-left" text rounded @click="goBack" :aria-label="$t('tiers.cancel')" />
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ isEditing ? $t('tiers.edit_title') : $t('tiers.new_title') }}</h1>
            </div>
            <div class="flex gap-2">
                <Button :label="$t('tiers.cancel')" severity="secondary" @click="goBack" />
                <Button :label="isEditing ? $t('tiers.save_modifications') : $t('tiers.create')" icon="pi pi-check" :loading="submitting" :disabled="!isFormValid" @click="handleSubmit" />
            </div>
        </div>

        <form @submit.prevent="handleSubmit" class="px-4 sm:px-6 space-y-6">
            
            <Message v-if="errorMsg" severity="error" :closable="false" class="mb-4">{{ errorMsg }}</Message>

            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 class="text-xl font-semibold mb-4 text-primary border-b pb-2">{{ $t('tiers.general.title') }}</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">{{ $t('tiers.general.name') }} *</label>
                        <InputText v-model="form.name" required :placeholder="$t('tiers.general.name_placeholder')" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">{{ $t('tiers.general.alt_name') }}</label>
                        <InputText v-model="form.alt_name" :placeholder="$t('tiers.general.alt_name_placeholder')" />
                    </div>
                    
                    <div class="col-span-1 md:col-span-2">
                        <label class="block mb-2 text-sm font-medium">{{ $t('tiers.general.type') }}</label>
                        <div class="flex flex-wrap gap-4">
                            <div v-for="type in typeOptions" :key="type" class="flex items-center">
                                <Checkbox v-model="form.tier_type" :inputId="type" :value="type" />
                                <label :for="type" class="ml-2 cursor-pointer select-none">{{ type }}</label>
                            </div>
                            <!-- Case Formateur intégrée -->
                            <div class="flex items-center">
                                <Checkbox v-model="form.is_trainer" :binary="true" inputId="is_trainer" />
                                <label for="is_trainer" class="ml-2 cursor-pointer select-none text-gray-700 dark:text-gray-300">{{ $t('tiers.general.trainer') }}</label>
                            </div>
                            <!-- Case OPCO -->
                            <div class="flex items-center">
                                <Checkbox v-model="form.is_opco" :binary="true" inputId="is_opco" />
                                <label for="is_opco" class="ml-2 cursor-pointer select-none text-gray-700 dark:text-gray-300">{{ $t('tiers.general.opco') }}</label>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">{{ $t('tiers.general.client_code') }} (Auto)</label>
                        <InputText v-model="form.code_client" placeholder="Généré automatiquement si vide" disabled class="bg-gray-100 opacity-70" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">{{ $t('tiers.general.supplier_code') }} (Auto)</label>
                        <InputText v-model="form.code_fournisseur" placeholder="Généré automatiquement si vide" disabled class="bg-gray-100 opacity-70" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">{{ $t('tiers.general.status') }}</label>
                        <Dropdown v-model="form.state" :options="stateOptions" :placeholder="$t('tiers.financial.select')" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">{{ $t('tiers.general.barcode') }}</label>
                        <InputText v-model="form.barcode" />
                    </div>
                </div>
            </div>

            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 class="text-xl font-semibold mb-4 text-primary border-b pb-2">{{ $t('tiers.contact.title') }}</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="col-span-1 md:col-span-2 flex flex-col gap-2">
                        <label class="text-sm font-medium">{{ $t('tiers.contact.address') }}</label>
                        <Textarea v-model="form.address" rows="3" autoResize placeholder="Rue, numéro, bâtiment..." />
                    </div>
                    
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">{{ $t('tiers.contact.zip') }}</label>
                        <InputText v-model="form.zip_code" maxlength="5" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">{{ $t('tiers.contact.city') }}</label>
                        <InputText v-model="form.city" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">{{ $t('tiers.contact.country') }}</label>
                        <Dropdown v-model="form.country" :options="countryOptions" optionLabel="label" optionValue="value" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">{{ $t('tiers.contact.department') }}</label>
                        <Dropdown v-model="form.department" :options="deptOptions" :placeholder="$t('tiers.financial.select')" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">{{ $t('tiers.contact.phone') }}</label>
                        <InputText v-model="form.phone" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">{{ $t('tiers.contact.mobile') }}</label>
                        <InputText v-model="form.mobile" />
                    </div>
                    
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">{{ $t('tiers.contact.website') }}</label>
                        <InputText v-model="form.website" placeholder="https://" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">{{ $t('tiers.contact.email') }}</label>
                        <InputText v-model="form.email" type="email" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label>{{ $t('tiers.contact.refuse_mass_email') }}</label>
                        <Dropdown v-model="form.refuse_mass_mail" :options="yesNoOptions" optionLabel="label" optionValue="value" />
                    </div>
                    <div class="flex items-center mt-6">
                        <Checkbox v-model="form.show_socials" :binary="true" inputId="socials" />
                        <label for="socials" class="ml-2 font-medium cursor-pointer">{{ $t('tiers.contact.show_socials') }}</label>
                    </div>
                </div>
            </div>

            <Accordion :multiple="true" :activeIndex="[0]">
                
                <AccordionPanel value="0">
                    <AccordionHeader>{{ $t('tiers.legal.title') }}</AccordionHeader>
                    <AccordionContent>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                            <div class="flex flex-col gap-2"><label class="text-sm font-medium">{{ $t('tiers.legal.siren') }} (9 max)</label><InputText v-model="form.siren" maxlength="9" /></div>
                            <div class="flex flex-col gap-2"><label class="text-sm font-medium">{{ $t('tiers.legal.siret') }} (14 max)</label><InputText v-model="form.siret" maxlength="14" /></div>
                            <div class="flex flex-col gap-2"><label class="text-sm font-medium">{{ $t('tiers.legal.naf') }}</label><InputText v-model="form.naf_ape" maxlength="5" /></div>
                            <div class="flex flex-col gap-2"><label class="text-sm font-medium">{{ $t('tiers.legal.rcs') }}</label><InputText v-model="form.rcs_rm" /></div>
                            <div class="flex flex-col gap-2"><label class="text-sm font-medium">{{ $t('tiers.legal.eori') }}</label><InputText v-model="form.eori_number" /></div>
                            <div class="flex flex-col gap-2"><label class="text-sm font-medium">{{ $t('tiers.legal.rna') }}</label><InputText v-model="form.rna_number" /></div>
                        </div>

                        <div class="mt-6 border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="flex flex-col gap-2">
                                <div class="flex items-center mb-2">
                                    <Checkbox v-model="form.tva_subject" :binary="true" inputId="tva" />
                                    <label for="tva" class="ml-2 cursor-pointer font-medium">{{ $t('tiers.legal.vat_subject') }}</label>
                                </div>
                                <div class="flex gap-2" v-if="form.tva_subject">
                                    <InputText v-model="form.tva_number" :placeholder="$t('tiers.legal.vat_number')" class="flex-1" />
                                    <Button :label="$t('tiers.legal.check_vat')" icon="pi pi-search" severity="info" outlined @click="verifyTva" />
                                </div>
                            </div>
                            
                            <div class="flex flex-col gap-2">
                                <label class="text-sm font-medium">Type d'entité légale</label>
                                <Dropdown v-model="form.legal_entity_type" :options="legalEntities" :placeholder="$t('tiers.financial.select')" />
                            </div>
                            <div class="flex flex-col gap-2">
                                <label class="text-sm font-medium">Effectifs</label>
                                <InputNumber v-model="form.workforce" />
                            </div>
                            <div class="flex flex-col gap-2">
                                <label class="text-sm font-medium">{{ $t('tiers.legal.capital') }} (€)</label>
                                <InputNumber v-model="form.capital" mode="currency" currency="EUR" locale="fr-FR" />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionPanel>

                <AccordionPanel value="1">
                    <AccordionHeader>{{ $t('tiers.financial.title') }}</AccordionHeader>
                    <AccordionContent>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div class="flex flex-col gap-2"><label class="text-sm font-medium">{{ $t('tiers.financial.default_lang') }}</label><Dropdown v-model="form.default_lang" :options="langOptions" /></div>
                            <div class="flex flex-col gap-2"><label class="text-sm font-medium">{{ $t('tiers.financial.currency') }}</label><Dropdown v-model="form.currency" :options="currencyOptions" optionLabel="label" optionValue="value" /></div>
                            
                            <div class="flex flex-col gap-2"><label class="text-sm font-medium">{{ $t('tiers.financial.payment_terms') }}</label><Dropdown v-model="form.payment_conditions" :options="payConditions" :placeholder="$t('tiers.financial.select')" /></div>
                            <div class="flex flex-col gap-2"><label class="text-sm font-medium">{{ $t('tiers.financial.payment_mode') }}</label><Dropdown v-model="form.payment_mode" :options="payModes" :placeholder="$t('tiers.financial.select')" /></div>
                            <div class="flex flex-col gap-2">
                                <label>{{ $t('tiers.financial.tags_client') }}</label>
                                <Chips v-model="form.tags_client" separator="," placeholder="Entrez un tag et validez" />
                            </div>
                            <div class="flex flex-col gap-2">
                                <label>{{ $t('tiers.financial.tags_supplier') }}</label>
                                <Chips v-model="form.tags_supplier" separator="," placeholder="Entrez un tag et validez" />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionPanel>

                <AccordionPanel value="2">
                    <AccordionHeader>{{ $t('tiers.attachments.title') }}</AccordionHeader>
                    <AccordionContent>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div class="flex flex-col gap-2">
                                <label class="text-sm font-medium">{{ $t('tiers.attachments.assign_reps') }}</label>
                                <InputText 
                                    v-model="form.assigned_to" 
                                    :placeholder="$t('tiers.attachments.add_rep_placeholder')" 
                                    class="w-full"
                                />
                            </div>
                            
                            <div class="flex flex-col gap-2">
                                <label class="block mb-2 text-sm font-medium">{{ $t('tiers.attachments.logo') }}</label>
                                <FileUpload mode="basic" name="logo" accept="image/*" :maxFileSize="1000000" @select="onLogoUpload" :chooseLabel="$t('tiers.attachments.logo_choose')" />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionPanel>
            </Accordion>
        </form>
    </div>
</template>