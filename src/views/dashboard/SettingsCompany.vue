<script setup>
import { ref, onMounted } from 'vue';
import { useCompanyStore } from '../../stores/company';
import { useAuthStore } from '../../stores/auth';
import { supabase } from '../../supabase';

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
import RadioButton from 'primevue/radiobutton';
import Message from 'primevue/message';

import { useI18n } from 'vue-i18n';

const store = useCompanyStore();
const authStore = useAuthStore();
const { t } = useI18n();
const saving = ref(false);
const message = ref(null);

// Options d'heures pour les horaires d'ouverture
const timeOptions = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
];

// Jours de la semaine pour l'affichage
const weekDays = [
    { key: 'lundi', label: 'Lundi' },
    { key: 'mardi', label: 'Mardi' },
    { key: 'mercredi', label: 'Mercredi' },
    { key: 'jeudi', label: 'Jeudi' },
    { key: 'vendredi', label: 'Vendredi' },
    { key: 'samedi', label: 'Samedi' },
    { key: 'dimanche', label: 'Dimanche' }
];

// Données locales du formulaire
const form = ref({
    // A. Général
    name: '', currency: 'EUR', country: 'FR', address: '', zip_code: '', city: '', 
    department: '', phone: '', mobile: '', fax: '', email: '', website: '', 
    barcode: '', logo_url: '', logo_square_url: '', note: '',
    handicap_referent: '', // Ajout Référent Handicap
    
    // B. Identifiants
    manager_name: '', dpo_name: '', capital: 0, legal_entity_type: '', 
    activity_object: '', vat_number: '', siren: '', siret: '', naf_ape: '', 
    rcs_rm: '', eori_number: '', rna_number: '', 
    id_prof_7: '', id_prof_8: '', id_prof_9: '', id_prof_10: '',
    fiscal_year_start_month: 'Janvier',

    // C. Taxes
    taxes_config: { vat_subject: true, tax_2: false, tax_3: false, fiscal_stamp: false },

    // D. Sociaux
    socials: { x: '', instagram: '', facebook: '', bluesky: '', autres: '' },

    // E. Horaires (structure améliorée avec ouverture/fermeture)
    opening_hours: { 
        lundi: { open: '09:00', close: '18:00', closed: false },
        mardi: { open: '09:00', close: '18:00', closed: false },
        mercredi: { open: '09:00', close: '18:00', closed: false },
        jeudi: { open: '09:00', close: '18:00', closed: false },
        vendredi: { open: '09:00', close: '18:00', closed: false },
        samedi: { open: '', close: '', closed: true },
        dimanche: { open: '', close: '', closed: true }
    },

    // F. Comptable
    accountant_info: { name: '', address: '', zip: '', city: '', country: 'FR', phone: '', email: '', web: '', code: '', note: '' }
});

// Options Listes
const currencies = ['EUR', 'USD', 'GBP', 'CHF'];
const countries = [
    {label: 'France', value: 'FR'}, {label: 'Belgique', value: 'BE'}, 
    {label: 'Suisse', value: 'CH'}, {label: 'Canada', value: 'CA'}
];
const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const legalEntities = ['SAS', 'SASU', 'SARL', 'EURL', 'Auto-Entrepreneur', 'SA', 'SCI', 'Association'];
const departments = [
    '01 - Ain', '02 - Aisne', '03 - Allier', '04 - Alpes-de-Haute-Provence', '05 - Hautes-Alpes',
    '06 - Alpes-Maritimes', '07 - Ardèche', '08 - Ardennes', '09 - Ariège', '10 - Aube',
    '11 - Aude', '12 - Aveyron', '13 - Bouches-du-Rhône', '14 - Calvados', '15 - Cantal',
    '16 - Charente', '17 - Charente-Maritime', '18 - Cher', '19 - Corrèze', '2A - Corse-du-Sud',
    '2B - Haute-Corse', '21 - Côte-d\'Or', '22 - Côtes-d\'Armor', '23 - Creuse', '24 - Dordogne',
    '25 - Doubs', '26 - Drôme', '27 - Eure', '28 - Eure-et-Loir', '29 - Finistère',
    '30 - Gard', '31 - Haute-Garonne', '32 - Gers', '33 - Gironde', '34 - Hérault',
    '35 - Ille-et-Vilaine', '36 - Indre', '37 - Indre-et-Loire', '38 - Isère', '39 - Jura',
    '40 - Landes', '41 - Loir-et-Cher', '42 - Loire', '43 - Haute-Loire', '44 - Loire-Atlantique',
    '45 - Loiret', '46 - Lot', '47 - Lot-et-Garonne', '48 - Lozère', '49 - Maine-et-Loire',
    '50 - Manche', '51 - Marne', '52 - Haute-Marne', '53 - Mayenne', '54 - Meurthe-et-Moselle',
    '55 - Meuse', '56 - Morbihan', '57 - Moselle', '58 - Nièvre', '59 - Nord',
    '60 - Oise', '61 - Orne', '62 - Pas-de-Calais', '63 - Puy-de-Dôme', '64 - Pyrénées-Atlantiques',
    '65 - Hautes-Pyrénées', '66 - Pyrénées-Orientales', '67 - Bas-Rhin', '68 - Haut-Rhin', '69 - Rhône',
    '70 - Haute-Saône', '71 - Saône-et-Loire', '72 - Sarthe', '73 - Savoie', '74 - Haute-Savoie',
    '75 - Paris', '76 - Seine-Maritime', '77 - Seine-et-Marne', '78 - Yvelines', '79 - Deux-Sèvres',
    '80 - Somme', '81 - Tarn', '82 - Tarn-et-Garonne', '83 - Var', '84 - Vaucluse',
    '85 - Vendée', '86 - Vienne', '87 - Haute-Vienne', '88 - Vosges', '89 - Yonne',
    '90 - Territoire de Belfort', '91 - Essonne', '92 - Hauts-de-Seine', '93 - Seine-Saint-Denis', '94 - Val-de-Marne',
    '95 - Val-d\'Oise', '971 - Guadeloupe', '972 - Martinique', '973 - Guyane', '974 - La Réunion',
    '976 - Mayotte'
];

onMounted(async () => {
    await store.fetchCompany();
    if (store.company) {
        // Fusionner les données existantes avec le formulaire par défaut
        form.value = { ...form.value, ...store.company };
        // S'assurer que les objets imbriqués existent (au cas où la DB renvoie null)
        form.value.taxes_config = store.company.taxes_config || { vat_subject: true };
        form.value.socials = store.company.socials || {};
        
        // Migration des anciens horaires texte vers le nouveau format
        if (store.company.opening_hours) {
            const oldHours = store.company.opening_hours;
            // Vérifier si c'est l'ancien format (string) ou le nouveau format (object)
            if (typeof oldHours.lundi === 'string' || oldHours.lundi === undefined) {
                // Migrer vers le nouveau format
                form.value.opening_hours = {
                    lundi: { open: '09:00', close: '18:00', closed: false },
                    mardi: { open: '09:00', close: '18:00', closed: false },
                    mercredi: { open: '09:00', close: '18:00', closed: false },
                    jeudi: { open: '09:00', close: '18:00', closed: false },
                    vendredi: { open: '09:00', close: '18:00', closed: false },
                    samedi: { open: '', close: '', closed: true },
                    dimanche: { open: '', close: '', closed: true }
                };
            } else {
                form.value.opening_hours = oldHours;
            }
        }
        
        form.value.accountant_info = store.company.accountant_info || {};
    }
});

const handleSave = async () => {
    saving.value = true;
    message.value = null;
    const res = await store.saveCompany(form.value);
    if (res.success) {
        message.value = { severity: 'success', text: t('company.saved_success') };
    } else {
        message.value = { severity: 'error', text: t('dashboard.error', { error: res.error }) };
    }
    saving.value = false;
};

// Upload Logo
const uploadLogo = async (event, type) => {
    await authStore.refreshSession();
    const file = event.files[0];
    const fileName = `${Date.now()}-${type}-${file.name}`;
    const { data, error } = await supabase.storage.from('company-logos').upload(fileName, file);
    
    if (!error) {
        const { data: urlData } = supabase.storage.from('company-logos').getPublicUrl(fileName);
        if (type === 'main') form.value.logo_url = urlData.publicUrl;
        else form.value.logo_square_url = urlData.publicUrl;
    }
};

// Validation du SIREN (9 chiffres)
const validateSiren = (event) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, 9);
    form.value.siren = value;
};

// Validation du SIRET (14 chiffres)
const validateSiret = (event) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, 14);
    form.value.siret = value;
};

// Validation du code postal (5 chiffres)
const validateZipCode = (event) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, 5);
    form.value.zip_code = value;
};

// Validation du code postal comptable (5 chiffres)
const validateAccountantZip = (event) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, 5);
    form.value.accountant_info.zip = value;
};
</script>

<template>
    <div class="max-w-6xl mx-auto pb-20">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('company.title') }}</h1>
            <Button :label="t('company.save')" icon="pi pi-save" :loading="saving" @click="handleSave" />
        </div>

        <Message v-if="message" :severity="message.severity" class="mb-4">{{ message.text }}</Message>

        <div class="card bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <TabView>
                
                <TabPanel :header="t('company.tabs.identity')">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.fields.name') }} <span class="text-red-500">*</span></label>
                            <InputText v-model="form.name" required />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.fields.currency') }}</label>
                            <Dropdown v-model="form.currency" :options="currencies" />
                        </div>
                        
                        <div class="md:col-span-2 flex flex-col gap-2">
                            <label>{{ t('company.fields.address') }}</label>
                            <Textarea v-model="form.address" rows="2" />
                        </div>
                        
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.fields.zip') }}</label>
                            <InputMask 
                                v-model="form.zip_code" 
                                mask="99999"
                                placeholder="75001"
                                slotChar=""
                            />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.fields.city') }}</label>
                            <InputText v-model="form.city" />
                        </div>
                        
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.fields.country') }}</label>
                            <Dropdown v-model="form.country" :options="countries" optionLabel="label" optionValue="value" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.fields.department') }}</label>
                            <Dropdown v-model="form.department" :options="departments" editable placeholder="Sélectionner ou taper" />
                        </div>

                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.fields.phone') }}</label>
                            <InputMask v-model="form.phone" mask="99 99 99 99 99" placeholder="01 23 45 67 89" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.fields.mobile') }}</label>
                            <InputMask v-model="form.mobile" mask="99 99 99 99 99" placeholder="06 12 34 56 78" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.fields.email') }}</label>
                            <InputText v-model="form.email" type="email" placeholder="contact@entreprise.fr" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.fields.website') }}</label>
                            <InputText v-model="form.website" type="url" placeholder="https://www.entreprise.fr" />
                        </div>

                        <div class="border p-4 rounded border-dashed opacity-75">
                            <label class="block mb-2 font-bold flex items-center gap-2">
                                {{ t('company.fields.logo') }} 
                                <span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full dark:bg-yellow-900 dark:text-yellow-200">{{ t('company.fields.dev_mode') }}</span>
                            </label>
                            <img v-if="form.logo_url" :src="form.logo_url" class="h-16 mb-2 object-contain" />
                            <FileUpload mode="basic" name="logo" accept="image/*" disabled :chooseLabel="t('company.fields.soon')" />
                        </div>
                        
                        <div class="md:col-span-2 flex flex-col gap-2">
                            <label>{{ t('company.fields.internal_note') }}</label>
                            <Textarea v-model="form.note" rows="3" />
                        </div>
                    </div>
                </TabPanel>

                <TabPanel :header="t('company.tabs.legal')">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.legal.manager') }}</label>
                            <InputText v-model="form.manager_name" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.legal.dpo') }}</label>
                            <InputText v-model="form.dpo_name" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.legal.handicap_ref') }}</label>
                            <InputText v-model="form.handicap_referent" placeholder="Nom du référent" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.legal.capital') }}</label>
                            <InputNumber v-model="form.capital" mode="currency" currency="EUR" :min="0" />
                        </div>
                        
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.legal.entity_type') }}</label>
                            <Dropdown v-model="form.legal_entity_type" :options="legalEntities" editable />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.legal.fiscal_start') }}</label>
                            <Dropdown v-model="form.fiscal_year_start_month" :options="months" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.legal.vat_number') }}</label>
                            <InputText v-model="form.vat_number" placeholder="FR12345678901" maxlength="13" />
                        </div>

                        <div class="md:col-span-3 flex flex-col gap-2">
                            <label>{{ t('company.legal.object') }}</label>
                            <Textarea v-model="form.activity_object" rows="2" />
                        </div>

                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.legal.siren') }}</label>
                            <InputMask 
                                v-model="form.siren" 
                                mask="999 999 999"
                                placeholder="123 456 789"
                                slotChar=""
                            />
                            <small class="text-gray-500">9 chiffres uniquement</small>
                        </div>
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.legal.siret') }}</label>
                            <InputMask 
                                v-model="form.siret" 
                                mask="999 999 999 99999"
                                placeholder="123 456 789 00012"
                                slotChar=""
                            />
                            <small class="text-gray-500">14 chiffres uniquement</small>
                        </div>
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.legal.naf') }}</label>
                            <InputMask 
                                v-model="form.naf_ape" 
                                mask="9999a"
                                placeholder="8559A"
                                slotChar=""
                            />
                            <small class="text-gray-500">4 chiffres + 1 lettre</small>
                        </div>
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.legal.rcs') }}</label>
                            <InputText v-model="form.rcs_rm" placeholder="Paris B 123 456 789" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.legal.eori') }}</label>
                            <InputText v-model="form.eori_number" placeholder="FR12345678901234" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.legal.rna') }}</label>
                            <InputText v-model="form.rna_number" placeholder="W123456789" maxlength="10" />
                        </div>
                    </div>
                </TabPanel>

                <TabPanel :header="t('company.tabs.taxes')">
                    <div class="flex flex-col gap-6 p-4">
                        <div class="flex items-center gap-4">
                            <span class="font-bold w-40">{{ t('company.taxes.vat_subject') }} :</span>
                            <div class="flex gap-4">
                                <div class="flex items-center"><RadioButton v-model="form.taxes_config.vat_subject" :value="true" /><label class="ml-2">{{ t('company.taxes.yes') }}</label></div>
                                <div class="flex items-center"><RadioButton v-model="form.taxes_config.vat_subject" :value="false" /><label class="ml-2">{{ t('company.taxes.no') }}</label></div>
                            </div>
                        </div>

                        <div class="flex items-center gap-4">
                            <Checkbox v-model="form.taxes_config.tax_2" :binary="true" />
                            <label>{{ t('company.taxes.tax_2') }}</label>
                        </div>
                        
                        <div class="flex items-center gap-4">
                            <Checkbox v-model="form.taxes_config.tax_3" :binary="true" />
                            <label>{{ t('company.taxes.tax_3') }}</label>
                        </div>

                        <div class="flex items-center gap-4">
                            <Checkbox v-model="form.taxes_config.fiscal_stamp" :binary="true" />
                            <label>{{ t('company.taxes.fiscal_stamp') }}</label>
                        </div>
                    </div>
                </TabPanel>

                <TabPanel :header="t('company.tabs.socials')">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                        <div class="flex flex-col gap-2">
                            <label><i class="pi pi-twitter mr-2"></i>X (Twitter)</label>
                            <InputText v-model="form.socials.x" type="url" placeholder="https://x.com/..." />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label><i class="pi pi-instagram mr-2"></i>Instagram</label>
                            <InputText v-model="form.socials.instagram" type="url" placeholder="https://instagram.com/..." />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label><i class="pi pi-facebook mr-2"></i>Facebook</label>
                            <InputText v-model="form.socials.facebook" type="url" placeholder="https://facebook.com/..." />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label><i class="pi pi-cloud mr-2"></i>Bluesky</label>
                            <InputText v-model="form.socials.bluesky" type="url" placeholder="https://bsky.app/..." />
                        </div>
                        <div class="flex flex-col gap-2 md:col-span-2">
                            <label><i class="pi pi-globe mr-2"></i>{{ t('company.socials.other') }}</label>
                            <InputText v-model="form.socials.autres" placeholder="Autres liens..." />
                        </div>
                    </div>
                </TabPanel>

                <TabPanel :header="t('company.tabs.hours')">
                    <div class="p-4">
                        <p class="text-gray-500 mb-4">Définissez les horaires d'ouverture de votre établissement.</p>
                        <div class="grid grid-cols-1 gap-4 max-w-2xl">
                            <div v-for="day in weekDays" :key="day.key" 
                                 class="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div class="flex items-center gap-3 w-32">
                                    <Checkbox 
                                        v-model="form.opening_hours[day.key].closed" 
                                        :binary="true" 
                                        :inputId="'closed-' + day.key"
                                    />
                                    <label :for="'closed-' + day.key" class="font-semibold cursor-pointer"
                                           :class="{ 'line-through text-gray-400': form.opening_hours[day.key].closed }">
                                        {{ day.label }}
                                    </label>
                                </div>
                                
                                <div v-if="!form.opening_hours[day.key].closed" class="flex items-center gap-2 flex-1">
                                    <Dropdown 
                                        v-model="form.opening_hours[day.key].open" 
                                        :options="timeOptions" 
                                        placeholder="Ouverture"
                                        class="w-28"
                                    />
                                    <span class="text-gray-500">à</span>
                                    <Dropdown 
                                        v-model="form.opening_hours[day.key].close" 
                                        :options="timeOptions" 
                                        placeholder="Fermeture"
                                        class="w-28"
                                    />
                                </div>
                                <div v-else class="flex-1 text-gray-400 italic">
                                    Fermé
                                </div>
                            </div>
                        </div>
                    </div>
                </TabPanel>

                <TabPanel :header="t('company.tabs.accountant')">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.accountant.name') }}</label>
                            <InputText v-model="form.accountant_info.name" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.accountant.code') }}</label>
                            <InputText v-model="form.accountant_info.code" />
                        </div>
                        
                        <div class="md:col-span-2 flex flex-col gap-2">
                            <label>{{ t('company.accountant.address') }}</label>
                            <Textarea v-model="form.accountant_info.address" rows="2" />
                        </div>
                        
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.accountant.zip') }}</label>
                            <InputMask 
                                v-model="form.accountant_info.zip" 
                                mask="99999"
                                placeholder="75001"
                                slotChar=""
                            />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.accountant.city') }}</label>
                            <InputText v-model="form.accountant_info.city" />
                        </div>
                        
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.accountant.email') }}</label>
                            <InputText v-model="form.accountant_info.email" type="email" placeholder="comptable@cabinet.fr" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label>{{ t('company.accountant.phone') }}</label>
                            <InputMask v-model="form.accountant_info.phone" mask="99 99 99 99 99" placeholder="01 23 45 67 89" />
                        </div>
                        
                        <div class="md:col-span-2 flex flex-col gap-2">
                            <label>{{ t('company.accountant.note') }}</label>
                            <Textarea v-model="form.accountant_info.note" rows="2" />
                        </div>
                    </div>
                </TabPanel>

            </TabView>
        </div>
    </div>
</template>