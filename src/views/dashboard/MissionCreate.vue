<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

// PrimeVue components
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { useFormValidation } from '../../composables/useFormValidation';

const router = useRouter();

// -----------------------------------------------------------
// Dropdown options
// -----------------------------------------------------------
const typeOptions = [
    { label: 'Conseil', value: 'conseil' },
    { label: 'Coaching', value: 'coaching' },
    { label: 'Audit', value: 'audit' }
];

const dureeUniteOptions = [
    { label: 'Jours', value: 'jours' },
    { label: 'Heures', value: 'heures' }
];

// -----------------------------------------------------------
// Form state
// -----------------------------------------------------------
const form = ref({
    titre: '',
    type: null,
    contexte: '',
    objectifs: '',
    perimetre: '',
    methodologie: '',
    planning: '',
    duree_estimee: null,
    duree_unite: 'jours',
    conditions_financieres: '',
    tarif_ht: null
});

const submitting = ref(false);
const saved = ref(false);
const { errors, validate, clearError } = useFormValidation();

// -----------------------------------------------------------
// Actions
// -----------------------------------------------------------
const handleSave = async () => {
    const isValid = validate({ titre: form.value.titre });
    if (!isValid) return;

    submitting.value = true;
    saved.value = false;

    // Placeholder : no mission table yet, simulate a short delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    submitting.value = false;
    saved.value = true;
};

const handleCancel = () => {
    router.push('/dashboard/catalogue/missions');
};
</script>

<template>
    <div class="max-w-5xl mx-auto pb-20">

        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Nouveau modèle de mission</h1>
            <Button label="Retour" text @click="handleCancel" />
        </div>

        <!-- Success message -->
        <Message v-if="saved" severity="success" :closable="true" class="mb-6">
            Le modèle de mission a été enregistré avec succès (placeholder).
        </Message>

        <div class="card bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm">
            <form @submit.prevent="handleSave" class="space-y-8">

                <!-- ================================================ -->
                <!-- Section 1 : Informations générales (bleu)        -->
                <!-- ================================================ -->
                <div class="border-l-4 border-blue-500 pl-6 py-4 space-y-6 bg-blue-50/40 dark:bg-blue-900/10 rounded-r-lg">
                    <h2 class="text-lg font-bold text-blue-700 dark:text-blue-300">Informations générales</h2>

                    <div>
                        <label class="font-semibold block mb-2">Titre de la mission</label>
                        <InputText v-model="form.titre" class="w-full text-lg" placeholder="Ex : Audit organisationnel" :invalid="!!errors.titre" @input="clearError('titre')" />
                    </div>

                    <div class="max-w-sm">
                        <label class="font-semibold block mb-2">Type de mission</label>
                        <Dropdown
                            v-model="form.type"
                            :options="typeOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Choisir un type"
                            class="w-full"
                        />
                    </div>

                    <div>
                        <label class="font-semibold block mb-2">Contexte</label>
                        <Textarea v-model="form.contexte" rows="4" class="w-full" placeholder="Décrivez le contexte de la mission" />
                    </div>
                </div>

                <!-- ================================================ -->
                <!-- Section 2 : Objectifs et périmètre (vert)        -->
                <!-- ================================================ -->
                <div class="border-l-4 border-green-500 pl-6 py-4 space-y-6 bg-green-50/40 dark:bg-green-900/10 rounded-r-lg">
                    <h2 class="text-lg font-bold text-green-700 dark:text-green-300">Objectifs et périmètre</h2>

                    <div>
                        <label class="font-semibold block mb-2">Objectifs</label>
                        <Textarea v-model="form.objectifs" rows="4" class="w-full" placeholder="Listez les objectifs de la mission" />
                    </div>

                    <div>
                        <label class="font-semibold block mb-2">Périmètre</label>
                        <Textarea v-model="form.perimetre" rows="4" class="w-full" placeholder="Délimitez le périmètre d'intervention" />
                    </div>
                </div>

                <!-- ================================================ -->
                <!-- Section 3 : Méthodologie et planning (orange)    -->
                <!-- ================================================ -->
                <div class="border-l-4 border-orange-500 pl-6 py-4 space-y-6 bg-orange-50/40 dark:bg-orange-900/10 rounded-r-lg">
                    <h2 class="text-lg font-bold text-orange-700 dark:text-orange-300">Méthodologie et planning</h2>

                    <div>
                        <label class="font-semibold block mb-2">Méthodologie</label>
                        <Textarea v-model="form.methodologie" rows="4" class="w-full" placeholder="Décrivez la méthodologie envisagée" />
                    </div>

                    <div>
                        <label class="font-semibold block mb-2">Planning</label>
                        <Textarea v-model="form.planning" rows="4" class="w-full" placeholder="Décrivez le planning prévisionnel" />
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="font-semibold block mb-2">Durée estimée</label>
                            <InputNumber v-model="form.duree_estimee" class="w-full" :min="0" :maxFractionDigits="1" placeholder="Ex : 5" />
                        </div>
                        <div>
                            <label class="font-semibold block mb-2">Unité</label>
                            <Dropdown
                                v-model="form.duree_unite"
                                :options="dureeUniteOptions"
                                optionLabel="label"
                                optionValue="value"
                                class="w-full"
                            />
                        </div>
                    </div>
                </div>

                <!-- ================================================ -->
                <!-- Section 4 : Conditions financières (violet)      -->
                <!-- ================================================ -->
                <div class="border-l-4 border-purple-500 pl-6 py-4 space-y-6 bg-purple-50/40 dark:bg-purple-900/10 rounded-r-lg">
                    <h2 class="text-lg font-bold text-purple-700 dark:text-purple-300">Conditions financières</h2>

                    <div>
                        <label class="font-semibold block mb-2">Conditions financières</label>
                        <Textarea v-model="form.conditions_financieres" rows="3" class="w-full" placeholder="Décrivez les conditions financières" />
                    </div>

                    <div class="max-w-sm">
                        <label class="font-semibold block mb-2">Tarif HT</label>
                        <InputNumber v-model="form.tarif_ht" mode="currency" currency="EUR" class="w-full" />
                    </div>
                </div>

                <!-- ================================================ -->
                <!-- Actions                                          -->
                <!-- ================================================ -->
                <div class="flex justify-end gap-3 pt-4">
                    <Button label="Annuler" severity="secondary" outlined @click="handleCancel" />
                    <Button
                        label="Enregistrer"
                        icon="pi pi-save"
                        severity="primary"
                        :loading="submitting"
                        :disabled="submitting || !form.titre"
                        @click="handleSave"
                    />
                </div>
            </form>
        </div>
    </div>
</template>
