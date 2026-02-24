<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTiersStore } from '../../stores/tiers';
import { useAuditTrail } from '../../composables/useAuditTrail';
import { useConformityScore } from '../../composables/useConformityScore';
import ScoreBadge from '../../components/dashboard/ScoreBadge.vue';

import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import FileUpload from 'primevue/fileupload';
import Dropdown from 'primevue/dropdown';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Message from 'primevue/message';

import {
  TIER_ROLE_OPTIONS,
  TIER_ROLE_COLORS,
  RELATION_TYPES,
  TIER_DOC_TYPES,
} from '../../config/constants';

const route = useRoute();
const router = useRouter();
const store = useTiersStore();
const auditTrail = useAuditTrail();
const { computeScore } = useConformityScore();

// -- State --
const loading = ref(true);
const tier = ref(null);
const documents = ref([]);
const relations = ref([]);
const auditLog = ref([]);
const score = ref({ score: 0, missing: [], severity: 'danger' });

// -- Document upload state --
const selectedDocType = ref(null);
const uploadingDoc = ref(false);

// -- Relation dialog state --
const showRelationDialog = ref(false);
const newRelation = ref({
  personne_id: null,
  organisation_id: null,
  type_relation: null,
});
const personneSearch = ref('');
const organisationSearch = ref('');

// -- Computed --
const tierId = computed(() => route.params.id);

const tierRoles = computed(() => {
  if (!tier.value?.tiers_roles) return [];
  return tier.value.tiers_roles.map(r => r.role);
});

const displayName = computed(() => {
  if (!tier.value) return '';
  return tier.value.nom_affiche || tier.value.raison_sociale || '(Sans nom)';
});

const natureLabel = computed(() => {
  if (!tier.value?.nature) return '';
  return tier.value.nature === 'personne_physique' ? 'Personne physique' : 'Organisation';
});

const natureSeverity = computed(() => {
  if (!tier.value?.nature) return 'secondary';
  return tier.value.nature === 'personne_physique' ? 'info' : 'warn';
});

const isOrganisation = computed(() => tier.value?.nature === 'organisation');

const hasRole = (role) => tierRoles.value.includes(role);

const getRoleLabel = (roleValue) => {
  const opt = TIER_ROLE_OPTIONS.find(o => o.value === roleValue);
  return opt ? opt.label : roleValue;
};

const getRoleSeverity = (roleValue) => {
  return TIER_ROLE_COLORS[roleValue] || 'secondary';
};

const getDocTypeLabel = (value) => {
  const opt = TIER_DOC_TYPES.find(o => o.value === value);
  return opt ? opt.label : value;
};

const getRelationTypeLabel = (value) => {
  const opt = RELATION_TYPES.find(o => o.value === value);
  return opt ? opt.label : value;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const displayValue = (val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'boolean') return val ? 'Oui' : 'Non';
  return val;
};

// -- Audit event type badge severity --
const getAuditSeverity = (type) => {
  const map = {
    creation: 'success',
    modification: 'info',
    ajout_role: 'success',
    suppression_role: 'danger',
    ajout_document: 'info',
    suppression_document: 'danger',
    ajout_relation: 'info',
    suppression_relation: 'danger',
    archivage: 'warn',
  };
  return map[type] || 'secondary';
};

const getAuditLabel = (type) => {
  const map = {
    creation: 'Création',
    modification: 'Modification',
    ajout_role: 'Ajout rôle',
    suppression_role: 'Suppression rôle',
    ajout_document: 'Ajout document',
    suppression_document: 'Suppression document',
    ajout_relation: 'Ajout contact',
    suppression_relation: 'Suppression contact',
    archivage: 'Archivage',
  };
  return map[type] || type;
};

const formatAuditChanges = (entry) => {
  const parts = [];
  if (entry.champ) {
    parts.push(`Champ : ${entry.champ}`);
  }
  if (entry.ancienne_valeur) {
    try {
      const val = JSON.parse(entry.ancienne_valeur);
      parts.push(`Avant : ${typeof val === 'object' ? JSON.stringify(val) : val}`);
    } catch {
      parts.push(`Avant : ${entry.ancienne_valeur}`);
    }
  }
  if (entry.nouvelle_valeur) {
    try {
      const val = JSON.parse(entry.nouvelle_valeur);
      parts.push(`Après : ${typeof val === 'object' ? JSON.stringify(val) : val}`);
    } catch {
      parts.push(`Après : ${entry.nouvelle_valeur}`);
    }
  }
  return parts.join(' | ') || '-';
};

// -- Actions --
const goBack = () => {
  router.push('/dashboard/tiers');
};

const goEdit = () => {
  router.push(`/dashboard/tiers/edit/${tierId.value}`);
};

const onDocUpload = async (event) => {
  if (!selectedDocType.value) return;
  uploadingDoc.value = true;
  try {
    const file = event.files[0];
    const result = await store.uploadDocument(tierId.value, selectedDocType.value, file);
    if (result.success && result.data) {
      documents.value.unshift(result.data);
    }
  } finally {
    uploadingDoc.value = false;
    selectedDocType.value = null;
  }
};

const deleteDoc = async (doc) => {
  if (!confirm('Supprimer ce document ?')) return;
  const result = await store.deleteDocument(doc.id, tierId.value);
  if (result.success) {
    documents.value = documents.value.filter(d => d.id !== doc.id);
  }
};

const openRelationDialog = () => {
  newRelation.value = { personne_id: null, organisation_id: null, type_relation: null };
  personneSearch.value = '';
  organisationSearch.value = '';
  showRelationDialog.value = true;
};

const addRelation = async () => {
  const { personne_id, organisation_id, type_relation } = newRelation.value;
  if (!personne_id || !organisation_id || !type_relation) return;

  const result = await store.addRelation(personne_id, organisation_id, type_relation);
  if (result.success) {
    // Reload relations
    relations.value = await store.fetchRelations(tierId.value);
    showRelationDialog.value = false;
  }
};

const deleteRelation = async (relation) => {
  if (!confirm('Supprimer ce contact ?')) return;
  const personneId = relation.personne_id || tierId.value;
  const result = await store.removeRelation(relation.id, personneId);
  if (result.success) {
    relations.value = relations.value.filter(r => r.id !== relation.id);
  }
};

const getRelationDisplayName = (relation) => {
  // Show the "other" party in the relation
  if (relation.personne_id === tierId.value) {
    return relation.organisation?.raison_sociale || relation.organisation?.nom_affiche || '-';
  }
  return relation.personne?.nom_affiche || relation.personne?.email || '-';
};

const getRelationDisplayType = (relation) => {
  if (relation.personne_id === tierId.value) {
    return 'Organisation';
  }
  return 'Personne';
};

// -- Dropdown options for relation dialog (simplified: uses store personnes/organisations) --
const personneOptions = computed(() => {
  return store.personnesPhysiques.map(p => ({
    label: p.nom_affiche || p.email || p.id,
    value: p.id,
  }));
});

const organisationOptions = computed(() => {
  return store.organisations.map(o => ({
    label: o.raison_sociale || o.nom_affiche || o.id,
    value: o.id,
  }));
});

// -- Init --
onMounted(async () => {
  loading.value = true;
  try {
    // Fetch tier data
    tier.value = await store.getTierById(route.params.id);

    if (!tier.value) {
      loading.value = false;
      return;
    }

    // Fetch related data in parallel
    const [docs, rels, audit] = await Promise.all([
      store.fetchDocuments(route.params.id),
      store.fetchRelations(route.params.id),
      auditTrail.fetchAuditLog('tiers', route.params.id),
    ]);

    documents.value = docs;
    relations.value = rels;
    auditLog.value = audit;

    // Compute conformity score
    score.value = computeScore(tier.value, tierRoles.value, documents.value);

    // Load tiers list for relation dialog dropdowns
    if (store.tiers.length === 0) {
      await store.fetchTiers();
    }
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="p-6">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>

    <!-- Not found -->
    <div v-else-if="!tier" class="text-center py-20">
      <Message severity="error" :closable="false">
        Tiers introuvable. L'identifiant est peut-être invalide ou le tiers a été supprimé.
      </Message>
      <Button label="Retour à la liste" icon="pi pi-arrow-left" class="mt-4" @click="goBack" />
    </div>

    <!-- Main content -->
    <template v-else>
      <!-- ====== HEADER ====== -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <!-- Left: name, nature, roles, score -->
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-3 flex-wrap">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ displayName }}
              </h1>
              <Tag :value="natureLabel" :severity="natureSeverity" />
              <ScoreBadge :score="score.score" />
            </div>

            <!-- Roles -->
            <div class="flex gap-2 flex-wrap" v-if="tierRoles.length > 0">
              <Tag
                v-for="role in tierRoles"
                :key="role"
                :value="getRoleLabel(role)"
                :severity="getRoleSeverity(role)"
                class="text-xs"
              />
            </div>

            <!-- Score missing items -->
            <div v-if="score.missing.length > 0" class="text-xs text-gray-400 mt-1">
              <span class="font-medium">Informations manquantes :</span>
              {{ score.missing.join(', ') }}
            </div>
          </div>

          <!-- Right: action buttons -->
          <div class="flex gap-2 shrink-0">
            <Button
              label="Modifier"
              icon="pi pi-pencil"
              severity="info"
              @click="goEdit"
            />
            <Button
              label="Retour"
              icon="pi pi-arrow-left"
              severity="secondary"
              outlined
              @click="goBack"
            />
          </div>
        </div>
      </div>

      <!-- ====== TABS ====== -->
      <TabView>
        <!-- ===== TAB 1 : Informations ===== -->
        <TabPanel header="Informations">
          <div class="space-y-6 p-2">
            <!-- Section : General -->
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
              <h3 class="text-lg font-semibold text-primary border-b pb-2 mb-4">Informations générales</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                <div>
                  <span class="text-sm text-gray-500 block">Nature</span>
                  <span class="font-medium">{{ natureLabel || '-' }}</span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">Nom affiché</span>
                  <span class="font-medium">{{ tier.nom_affiche || '-' }}</span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">Raison sociale</span>
                  <span class="font-medium">{{ tier.raison_sociale || '-' }}</span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">Prénom</span>
                  <span :class="tier.prenom ? 'font-medium' : 'text-gray-300 italic'">
                    {{ tier.prenom || 'Non renseigné' }}
                  </span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">Nom de famille</span>
                  <span :class="tier.nom_famille ? 'font-medium' : 'text-gray-300 italic'">
                    {{ tier.nom_famille || 'Non renseigné' }}
                  </span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">Email</span>
                  <span :class="tier.email ? 'font-medium' : 'text-gray-300 italic'">
                    {{ tier.email || 'Non renseigné' }}
                  </span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">Téléphone</span>
                  <span :class="tier.telephone ? 'font-medium' : 'text-gray-300 italic'">
                    {{ tier.telephone || 'Non renseigné' }}
                  </span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">Adresse</span>
                  <span :class="tier.address ? 'font-medium' : 'text-gray-300 italic'">
                    {{ tier.address || 'Non renseigné' }}
                  </span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">Ville</span>
                  <span :class="tier.city ? 'font-medium' : 'text-gray-300 italic'">
                    {{ tier.city || 'Non renseigné' }}
                  </span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">Code postal</span>
                  <span :class="tier.cp ? 'font-medium' : 'text-gray-300 italic'">
                    {{ tier.cp || 'Non renseigné' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Section : Organisation (conditional) -->
            <div
              v-if="isOrganisation"
              class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6"
            >
              <h3 class="text-lg font-semibold text-primary border-b pb-2 mb-4">Informations organisation</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                <div>
                  <span class="text-sm text-gray-500 block">SIREN</span>
                  <span :class="tier.siren ? 'font-medium' : 'text-gray-300 italic'">
                    {{ tier.siren || 'Non renseigné' }}
                  </span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">SIRET</span>
                  <span :class="tier.siret ? 'font-medium' : 'text-gray-300 italic'">
                    {{ tier.siret || 'Non renseigné' }}
                  </span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">Code NAF/APE</span>
                  <span :class="tier.naf_ape ? 'font-medium' : 'text-gray-300 italic'">
                    {{ tier.naf_ape || 'Non renseigné' }}
                  </span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">TVA intracommunautaire</span>
                  <span :class="tier.tva_intracom ? 'font-medium' : 'text-gray-300 italic'">
                    {{ tier.tva_intracom || 'Non renseigné' }}
                  </span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">Site web</span>
                  <span v-if="tier.site_web" class="font-medium">
                    <a :href="tier.site_web" target="_blank" class="text-primary underline">{{ tier.site_web }}</a>
                  </span>
                  <span v-else class="text-gray-300 italic">Non renseigné</span>
                </div>
              </div>
            </div>

            <!-- Section : Apprenant (conditional) -->
            <div
              v-if="hasRole('apprenant')"
              class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6"
            >
              <h3 class="text-lg font-semibold text-primary border-b pb-2 mb-4">Informations apprenant</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                <div>
                  <span class="text-sm text-gray-500 block">Date de naissance</span>
                  <span :class="tier.date_naissance ? 'font-medium' : 'text-gray-300 italic'">
                    {{ tier.date_naissance ? formatDateShort(tier.date_naissance) : 'Non renseigné' }}
                  </span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">Niveau d'entrée</span>
                  <span :class="tier.niveau_entree ? 'font-medium' : 'text-gray-300 italic'">
                    {{ tier.niveau_entree || 'Non renseigné' }}
                  </span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">Objectif professionnel</span>
                  <span :class="tier.objectif_professionnel ? 'font-medium' : 'text-gray-300 italic'">
                    {{ tier.objectif_professionnel || 'Non renseigné' }}
                  </span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">Situation handicap</span>
                  <span :class="tier.situation_handicap ? 'font-medium' : 'text-gray-300 italic'">
                    {{ displayValue(tier.situation_handicap) || 'Non renseigné' }}
                  </span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">Besoin aménagement</span>
                  <span :class="tier.besoin_amenagement ? 'font-medium' : 'text-gray-300 italic'">
                    {{ tier.besoin_amenagement || 'Non renseigné' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Section : Formateur (conditional) -->
            <div
              v-if="hasRole('formateur')"
              class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6"
            >
              <h3 class="text-lg font-semibold text-primary border-b pb-2 mb-4">Informations formateur</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                <div>
                  <span class="text-sm text-gray-500 block">NDA signé</span>
                  <span :class="tier.nda_signe !== null && tier.nda_signe !== undefined ? 'font-medium' : 'text-gray-300 italic'">
                    {{ displayValue(tier.nda_signe) ?? 'Non renseigné' }}
                  </span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">Date signature NDA</span>
                  <span :class="tier.nda_date_signature ? 'font-medium' : 'text-gray-300 italic'">
                    {{ tier.nda_date_signature ? formatDateShort(tier.nda_date_signature) : 'Non renseigné' }}
                  </span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">Déclaration d'activité</span>
                  <span :class="tier.declaration_activite ? 'font-medium' : 'text-gray-300 italic'">
                    {{ tier.declaration_activite || 'Non renseigné' }}
                  </span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">Certifié Qualiopi</span>
                  <span :class="tier.qualiopi_certifie !== null && tier.qualiopi_certifie !== undefined ? 'font-medium' : 'text-gray-300 italic'">
                    {{ displayValue(tier.qualiopi_certifie) ?? 'Non renseigné' }}
                  </span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">Certificateur Qualiopi</span>
                  <span :class="tier.qualiopi_certificateur ? 'font-medium' : 'text-gray-300 italic'">
                    {{ tier.qualiopi_certificateur || 'Non renseigné' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Section : Fournisseur (conditional) -->
            <div
              v-if="hasRole('fournisseur')"
              class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6"
            >
              <h3 class="text-lg font-semibold text-primary border-b pb-2 mb-4">Informations fournisseur</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                <div>
                  <span class="text-sm text-gray-500 block">Type de fournisseur</span>
                  <span :class="tier.fournisseur_type ? 'font-medium' : 'text-gray-300 italic'">
                    {{ tier.fournisseur_type || 'Non renseigné' }}
                  </span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">Accord cadre signé</span>
                  <span :class="tier.accord_cadre_signe !== null && tier.accord_cadre_signe !== undefined ? 'font-medium' : 'text-gray-300 italic'">
                    {{ displayValue(tier.accord_cadre_signe) ?? 'Non renseigné' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Section : Notes & tags -->
            <div
              v-if="tier.notes || (tier.tags && tier.tags.length > 0)"
              class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6"
            >
              <h3 class="text-lg font-semibold text-primary border-b pb-2 mb-4">Notes et tags</h3>
              <div class="space-y-4">
                <div v-if="tier.notes">
                  <span class="text-sm text-gray-500 block mb-1">Notes</span>
                  <p class="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{{ tier.notes }}</p>
                </div>
                <div v-if="tier.tags && tier.tags.length > 0">
                  <span class="text-sm text-gray-500 block mb-1">Tags</span>
                  <div class="flex gap-2 flex-wrap">
                    <Tag v-for="tag in tier.tags" :key="tag" :value="tag" severity="secondary" class="text-xs" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- ===== TAB 2 : Documents ===== -->
        <TabPanel header="Documents">
          <div class="space-y-6 p-2">
            <!-- Upload form -->
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
              <h3 class="text-lg font-semibold text-primary border-b pb-2 mb-4">Ajouter un document</h3>
              <div class="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div class="flex flex-col gap-2 w-full sm:w-64">
                  <label class="text-sm font-medium">Type de document</label>
                  <Dropdown
                    v-model="selectedDocType"
                    :options="TIER_DOC_TYPES"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Choisir un type..."
                    class="w-full"
                  />
                </div>
                <FileUpload
                  mode="basic"
                  :disabled="!selectedDocType || uploadingDoc"
                  @select="onDocUpload"
                  :chooseLabel="uploadingDoc ? 'Envoi en cours...' : 'Choisir un fichier'"
                  :auto="true"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  :maxFileSize="10000000"
                />
              </div>
            </div>

            <!-- Documents table -->
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
              <DataTable
                :value="documents"
                :paginator="documents.length > 10"
                :rows="10"
                dataKey="id"
                :emptyMessage="'Aucun document rattaché à ce tiers.'"
              >
                <Column field="nom_fichier" header="Nom du fichier" sortable style="min-width: 14rem">
                  <template #body="{ data }">
                    <span class="font-medium">{{ data.nom_fichier }}</span>
                  </template>
                </Column>
                <Column field="type_document" header="Type" sortable style="min-width: 10rem">
                  <template #body="{ data }">
                    <Tag :value="getDocTypeLabel(data.type_document)" severity="info" class="text-xs" />
                  </template>
                </Column>
                <Column field="date_ajout" header="Date d'ajout" sortable style="min-width: 10rem">
                  <template #body="{ data }">
                    {{ formatDateShort(data.date_ajout) }}
                  </template>
                </Column>
                <Column header="Actions" style="width: 10rem">
                  <template #body="{ data }">
                    <div class="flex gap-2">
                      <a
                        v-if="data.url_stockage"
                        :href="data.url_stockage"
                        target="_blank"
                        class="p-button p-button-text p-button-rounded p-button-sm"
                        title="Télécharger"
                      >
                        <i class="pi pi-download"></i>
                      </a>
                      <Button
                        icon="pi pi-trash"
                        text
                        rounded
                        severity="danger"
                        size="small"
                        @click="deleteDoc(data)"
                        title="Supprimer"
                      />
                    </div>
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
        </TabPanel>

        <!-- ===== TAB 3 : Contacts ===== -->
        <TabPanel header="Contacts">
          <div class="space-y-6 p-2">
            <div class="flex justify-end mb-2">
              <Button
                label="Ajouter un contact"
                icon="pi pi-plus"
                @click="openRelationDialog"
              />
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
              <DataTable
                :value="relations"
                :paginator="relations.length > 10"
                :rows="10"
                dataKey="id"
                :emptyMessage="'Aucun contact pour ce tiers.'"
              >
                <Column header="Tiers lié" style="min-width: 14rem">
                  <template #body="{ data }">
                    <div class="flex flex-col">
                      <span class="font-medium">{{ getRelationDisplayName(data) }}</span>
                      <span class="text-xs text-gray-400">{{ getRelationDisplayType(data) }}</span>
                    </div>
                  </template>
                </Column>
                <Column field="type_relation" header="Type de contact" sortable style="min-width: 12rem">
                  <template #body="{ data }">
                    <Tag :value="getRelationTypeLabel(data.type_relation)" severity="info" class="text-xs" />
                  </template>
                </Column>
                <Column header="Actions" style="width: 8rem">
                  <template #body="{ data }">
                    <Button
                      icon="pi pi-trash"
                      text
                      rounded
                      severity="danger"
                      size="small"
                      @click="deleteRelation(data)"
                      title="Supprimer"
                    />
                  </template>
                </Column>
              </DataTable>
            </div>

            <!-- Add contact dialog -->
            <Dialog
              v-model:visible="showRelationDialog"
              header="Ajouter un contact"
              :modal="true"
              :style="{ width: '500px' }"
            >
              <div class="space-y-4 pt-2">
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium">Personne physique</label>
                  <Dropdown
                    v-model="newRelation.personne_id"
                    :options="personneOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Choisir une personne..."
                    filter
                    class="w-full"
                  />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium">Organisation</label>
                  <Dropdown
                    v-model="newRelation.organisation_id"
                    :options="organisationOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Choisir une organisation..."
                    filter
                    class="w-full"
                  />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium">Type de contact</label>
                  <Dropdown
                    v-model="newRelation.type_relation"
                    :options="RELATION_TYPES"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Choisir un type..."
                    class="w-full"
                  />
                </div>
              </div>
              <template #footer>
                <div class="flex justify-end gap-2">
                  <Button label="Annuler" severity="secondary" outlined @click="showRelationDialog = false" />
                  <Button
                    label="Ajouter"
                    icon="pi pi-check"
                    :disabled="!newRelation.personne_id || !newRelation.organisation_id || !newRelation.type_relation"
                    @click="addRelation"
                  />
                </div>
              </template>
            </Dialog>
          </div>
        </TabPanel>

        <!-- ===== TAB 4 : Historique prestations ===== -->
        <TabPanel header="Historique prestations">
          <div class="p-6 text-center">
            <div class="py-12">
              <i class="pi pi-briefcase text-5xl text-gray-300 mb-4 block"></i>
              <Message severity="info" :closable="false" class="inline-block">
                Les prestations liées à ce tiers seront affichées ici.
              </Message>
            </div>
          </div>
        </TabPanel>

        <!-- ===== TAB 5 : Audit trail ===== -->
        <TabPanel header="Audit trail">
          <div class="p-2">
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
              <DataTable
                :value="auditLog"
                :paginator="auditLog.length > 10"
                :rows="10"
                dataKey="id"
                :emptyMessage="'Aucun événement enregistré.'"
                :sortField="'created_at'"
                :sortOrder="-1"
              >
                <Column field="created_at" header="Date" sortable style="min-width: 12rem">
                  <template #body="{ data }">
                    {{ formatDate(data.created_at) }}
                  </template>
                </Column>
                <Column field="type_evenement" header="Type" sortable style="min-width: 10rem">
                  <template #body="{ data }">
                    <Tag
                      :value="getAuditLabel(data.type_evenement)"
                      :severity="getAuditSeverity(data.type_evenement)"
                      class="text-xs"
                    />
                  </template>
                </Column>
                <Column field="champ" header="Champ" style="min-width: 8rem">
                  <template #body="{ data }">
                    <span class="text-sm">{{ data.champ || '-' }}</span>
                  </template>
                </Column>
                <Column header="Utilisateur" style="min-width: 12rem">
                  <template #body="{ data }">
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                      {{ data.profiles?.email || '-' }}
                    </span>
                  </template>
                </Column>
                <Column header="Modifications" style="min-width: 16rem">
                  <template #body="{ data }">
                    <span class="text-xs text-gray-500">{{ formatAuditChanges(data) }}</span>
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
        </TabPanel>
      </TabView>
    </template>
  </div>
</template>
