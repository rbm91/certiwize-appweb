<script setup>
import { ref, computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';

// -- Catégories de veille --
const VEILLE_CATEGORIES = [
  { label: 'Toutes les sources', value: null },
  { label: 'Légale et réglementaire', value: 'legale' },
  { label: 'Innovations', value: 'innovations' },
  { label: 'Métiers', value: 'metiers' },
  { label: 'Autres', value: 'autres' },
];

const getCategorieLabel = (code) => {
  const cat = VEILLE_CATEGORIES.find(c => c.value === code);
  return cat ? cat.label : code || '-';
};

const getCategorieSeverity = (code) => {
  const map = {
    legale: 'danger',
    innovations: 'info',
    metiers: 'success',
    autres: 'secondary',
  };
  return map[code] || 'secondary';
};

const getCategorieIcon = (code) => {
  const map = {
    legale: 'pi pi-balance-scale',
    innovations: 'pi pi-sparkles',
    metiers: 'pi pi-briefcase',
    autres: 'pi pi-bookmark',
  };
  return map[code] || 'pi pi-bookmark';
};

// -- État --
const selectedCategorie = ref(null);
const searchQuery = ref('');
const loading = ref(false);

// -- Articles de veille (données fictives — sera alimenté par n8n) --
const articles = ref([
  {
    id: 1,
    titre: 'Décret n° 2024-1205 : nouvelles obligations pour les organismes de formation',
    source: 'Légifrance',
    categorie: 'legale',
    date: '2025-02-10',
    resume: 'Le décret renforce les exigences documentaires pour les organismes certifiés Qualiopi, notamment sur le suivi des indicateurs de résultats.',
    url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000050000001',
    lu: false,
  },
  {
    id: 2,
    titre: 'Réforme de la VAE : ce qui change en 2025',
    source: 'Centre Inffo',
    categorie: 'legale',
    date: '2025-01-28',
    resume: 'La réforme simplifie le parcours VAE et introduit de nouvelles modalités d\'accompagnement pour les candidats.',
    url: 'https://www.centre-inffo.fr/site-centre-inffo/actualites-centre-inffo',
    lu: true,
  },
  {
    id: 3,
    titre: 'L\'intelligence artificielle au service de l\'ingénierie pédagogique',
    source: 'Thot Cursus',
    categorie: 'innovations',
    date: '2025-02-05',
    resume: 'Comment les outils d\'IA générative transforment la conception de parcours de formation et l\'évaluation des apprenants.',
    url: 'https://cursus.edu/',
    lu: false,
  },
  {
    id: 4,
    titre: 'Adaptive Learning : personnaliser les parcours grâce aux données',
    source: 'EdTech Magazine',
    categorie: 'innovations',
    date: '2025-01-15',
    resume: 'Les plateformes d\'adaptive learning utilisent l\'analyse de données pour adapter le contenu en temps réel au niveau de chaque apprenant.',
    url: 'https://www.edtechmagazine.com/',
    lu: true,
  },
  {
    id: 5,
    titre: 'Les compétences les plus recherchées en 2025 dans la formation professionnelle',
    source: 'France Compétences',
    categorie: 'metiers',
    date: '2025-02-01',
    resume: 'Le rapport annuel identifie les compétences émergentes : IA appliquée, cybersécurité, transition écologique et soft skills.',
    url: 'https://www.francecompetences.fr/',
    lu: false,
  },
  {
    id: 6,
    titre: 'Évolution du métier de formateur : vers un rôle de facilitateur',
    source: 'FFFOD',
    categorie: 'metiers',
    date: '2025-01-20',
    resume: 'Le formateur traditionnel évolue vers un rôle de facilitateur et de designer pédagogique, maîtrisant les outils numériques.',
    url: 'https://www.fffod.org/',
    lu: true,
  },
  {
    id: 7,
    titre: 'Financement de la formation : les nouveaux dispositifs CPF 2025',
    source: 'Caisse des Dépôts',
    categorie: 'legale',
    date: '2025-02-12',
    resume: 'Le reste à charge CPF est désormais modulé selon le type de formation. Tour d\'horizon des impacts pour les organismes.',
    url: 'https://www.moncompteformation.gouv.fr/',
    lu: false,
  },
  {
    id: 8,
    titre: 'Réalité virtuelle et formation immersive : retour d\'expérience',
    source: 'Learning Technologies',
    categorie: 'innovations',
    date: '2025-01-10',
    resume: 'Des organismes de formation partagent leurs retours sur l\'intégration de la VR dans leurs parcours pédagogiques.',
    url: 'https://www.learningtechnologies.co.uk/',
    lu: true,
  },
  {
    id: 9,
    titre: 'Baromètre de la satisfaction des apprenants en formation continue',
    source: 'Cereq',
    categorie: 'autres',
    date: '2025-01-25',
    resume: 'L\'enquête annuelle du Cereq révèle les attentes des apprenants en matière de qualité pédagogique et d\'accompagnement.',
    url: 'https://www.cereq.fr/',
    lu: false,
  },
  {
    id: 10,
    titre: 'Qualiopi 2025 : les points de vigilance lors de l\'audit de surveillance',
    source: 'Certif Pro',
    categorie: 'legale',
    date: '2025-02-08',
    resume: 'Les principaux écarts constatés lors des audits de surveillance et les bonnes pratiques pour s\'y préparer.',
    url: 'https://certificationprofessionnelle.fr/',
    lu: false,
  },
  {
    id: 11,
    titre: 'Microlearning : formats courts pour un meilleur engagement',
    source: 'Elearning Industry',
    categorie: 'innovations',
    date: '2025-02-03',
    resume: 'Le microlearning s\'impose comme format privilégié pour la formation continue. Études de cas et bonnes pratiques.',
    url: 'https://elearningindustry.com/',
    lu: true,
  },
  {
    id: 12,
    titre: 'L\'essor de la formation en situation de travail (FEST)',
    source: 'AFEST Réseau',
    categorie: 'metiers',
    date: '2025-01-18',
    resume: 'La FEST s\'inscrit dans les parcours certifiants et répond aux exigences Qualiopi sur la formation en situation réelle.',
    url: 'https://www.afest.fr/',
    lu: false,
  },
]);

// -- Filtrage --
const filteredArticles = computed(() => {
  let result = articles.value;
  if (selectedCategorie.value) {
    result = result.filter(a => a.categorie === selectedCategorie.value);
  }
  if (searchQuery.value) {
    const s = searchQuery.value.toLowerCase();
    result = result.filter(a =>
      a.titre.toLowerCase().includes(s) ||
      a.source.toLowerCase().includes(s) ||
      a.resume.toLowerCase().includes(s)
    );
  }
  return result;
});

// -- KPI --
const totalArticles = computed(() => articles.value.length);
const nonLus = computed(() => articles.value.filter(a => !a.lu).length);
const parCategorie = computed(() => {
  const counts = {};
  articles.value.forEach(a => {
    counts[a.categorie] = (counts[a.categorie] || 0) + 1;
  });
  return counts;
});

// -- Helpers --
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
};

const truncateText = (text, max = 120) => {
  if (!text) return '-';
  return text.length > max ? text.substring(0, max) + '...' : text;
};

const markAsRead = (article) => {
  article.lu = true;
};

const openArticle = (article) => {
  markAsRead(article);
  window.open(article.url, '_blank');
};
</script>

<template>
  <div class="p-6">
    <!-- En-tête -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Veille</h1>
        <p class="text-surface-500 dark:text-surface-400 mt-1">
          Suivez l'actualité légale, réglementaire, les innovations et les tendances métiers de la formation professionnelle.
        </p>
      </div>
    </div>

    <!-- Cartes KPI -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <!-- Total -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <i class="pi pi-inbox text-blue-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Total articles</p>
            <p class="text-xl font-bold text-blue-600">{{ totalArticles }}</p>
          </div>
        </div>
      </div>

      <!-- Non lus -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <i class="pi pi-eye text-orange-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Non lus</p>
            <p class="text-xl font-bold text-orange-600">{{ nonLus }}</p>
          </div>
        </div>
      </div>

      <!-- Légale -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <i class="pi pi-balance-scale text-red-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Légale</p>
            <p class="text-xl font-bold text-red-600">{{ parCategorie.legale || 0 }}</p>
          </div>
        </div>
      </div>

      <!-- Innovations -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <i class="pi pi-sparkles text-indigo-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Innovations</p>
            <p class="text-xl font-bold text-indigo-600">{{ parCategorie.innovations || 0 }}</p>
          </div>
        </div>
      </div>

      <!-- Métiers -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <i class="pi pi-briefcase text-green-500 text-lg" />
          </div>
          <div>
            <p class="text-sm text-surface-500">Métiers</p>
            <p class="text-xl font-bold text-green-600">{{ parCategorie.metiers || 0 }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Barre de recherche + filtre -->
    <div class="flex flex-col md:flex-row gap-3 mb-6">
      <div class="relative flex-1 max-w-md">
        <i class="pi pi-search absolute top-1/2 -translate-y-1/2 left-3 text-surface-400" />
        <InputText v-model="searchQuery" placeholder="Rechercher un article..." class="w-full pl-10" />
      </div>
      <Select
        v-model="selectedCategorie"
        :options="VEILLE_CATEGORIES"
        optionLabel="label"
        optionValue="value"
        placeholder="Filtrer par source"
        class="w-full md:w-64"
      />
    </div>

    <!-- Grille d'articles en mode cartes -->
    <div v-if="filteredArticles.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="article in filteredArticles"
        :key="article.id"
        class="bg-white dark:bg-gray-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 flex flex-col"
        :class="{ 'border-l-4 border-l-orange-400': !article.lu }"
        @click="openArticle(article)"
      >
        <!-- Header carte -->
        <div class="p-5 flex-1">
          <div class="flex items-center gap-2 mb-3">
            <Tag :value="getCategorieLabel(article.categorie)" :severity="getCategorieSeverity(article.categorie)" class="text-xs" />
            <span v-if="!article.lu" class="w-2 h-2 rounded-full bg-orange-400 animate-pulse" v-tooltip.top="'Non lu'" />
          </div>

          <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-0 mb-2 line-clamp-2 leading-snug">
            {{ article.titre }}
          </h3>

          <p class="text-xs text-surface-500 dark:text-surface-400 leading-relaxed mb-3">
            {{ truncateText(article.resume, 140) }}
          </p>
        </div>

        <!-- Footer carte -->
        <div class="px-5 py-3 bg-surface-50 dark:bg-surface-800/50 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between">
          <div class="flex items-center gap-2 text-xs text-surface-400">
            <i class="pi pi-calendar" />
            <span>{{ formatDate(article.date) }}</span>
          </div>
          <div class="flex items-center gap-1 text-xs text-surface-500 font-medium">
            <i class="pi pi-link" />
            <span>{{ article.source }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- État vide -->
    <div v-else class="flex flex-col items-center justify-center py-16 text-surface-400">
      <i class="pi pi-inbox text-5xl mb-4" />
      <p class="text-lg font-medium">Aucun article trouvé</p>
      <p class="text-sm mt-1">Modifiez vos filtres ou revenez plus tard pour de nouveaux articles.</p>
    </div>

    <!-- Note d'information -->
    <div class="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
      <div class="flex items-start gap-3">
        <i class="pi pi-info-circle text-blue-500 mt-0.5" />
        <div class="text-sm text-blue-700 dark:text-blue-300">
          <p class="font-medium mb-1">Alimentation automatique</p>
          <p>
            Les articles de veille sont collectés automatiquement depuis des sources spécialisées via notre pipeline d'automatisation.
            Les nouvelles publications sont ajoutées quotidiennement.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
