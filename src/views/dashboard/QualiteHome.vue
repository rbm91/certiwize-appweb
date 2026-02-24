<script setup>
import { useRouter } from 'vue-router';
import Button from 'primevue/button';

const router = useRouter();

const sections = [
  {
    titre: 'Manuel qualité',
    description: 'Gérez vos procédures qualité, le référentiel Qualiopi et le suivi documentaire.',
    icon: 'pi pi-book',
    color: 'purple',
    route: '/dashboard/qualite/manuel',
    bgClass: 'bg-purple-50 dark:bg-purple-900/20',
    iconClass: 'text-purple-600 dark:text-purple-400',
    borderClass: 'border-purple-200 dark:border-purple-800',
    hoverClass: 'hover:border-purple-400 dark:hover:border-purple-600',
  },
  {
    titre: 'Boîte à outils',
    description: 'Modèles de documents types à télécharger et adapter à votre organisme.',
    icon: 'pi pi-box',
    color: 'blue',
    route: '/dashboard/qualite/boite-outils',
    bgClass: 'bg-blue-50 dark:bg-blue-900/20',
    iconClass: 'text-blue-600 dark:text-blue-400',
    borderClass: 'border-blue-200 dark:border-blue-800',
    hoverClass: 'hover:border-blue-400 dark:hover:border-blue-600',
  },
  {
    titre: 'Bibliothèque évaluations',
    description: 'Quiz de positionnement, validation des acquis et enquêtes de satisfaction.',
    icon: 'pi pi-list-check',
    color: 'green',
    route: '/dashboard/qualite/evaluations',
    bgClass: 'bg-green-50 dark:bg-green-900/20',
    iconClass: 'text-green-600 dark:text-green-400',
    borderClass: 'border-green-200 dark:border-green-800',
    hoverClass: 'hover:border-green-400 dark:hover:border-green-600',
  },
  {
    titre: 'Analyse documentaire',
    description: 'Analysez vos documents de formation par intelligence artificielle.',
    icon: 'pi pi-file-check',
    color: 'orange',
    route: '/dashboard/qualite/analyse-doc',
    bgClass: 'bg-orange-50 dark:bg-orange-900/20',
    iconClass: 'text-orange-600 dark:text-orange-400',
    borderClass: 'border-orange-200 dark:border-orange-800',
    hoverClass: 'hover:border-orange-400 dark:hover:border-orange-600',
  },
  {
    titre: 'Réclamations',
    description: 'Suivi des réclamations stagiaires, formateurs et financeurs.',
    icon: 'pi pi-exclamation-triangle',
    color: 'red',
    route: '/dashboard/qualite/reclamations',
    bgClass: 'bg-red-50 dark:bg-red-900/20',
    iconClass: 'text-red-600 dark:text-red-400',
    borderClass: 'border-red-200 dark:border-red-800',
    hoverClass: 'hover:border-red-400 dark:hover:border-red-600',
  },
  {
    titre: 'Enquêtes & indicateurs',
    description: 'Indicateurs consolidés, taux de satisfaction et signaux qualité.',
    icon: 'pi pi-chart-bar',
    color: 'indigo',
    route: '/dashboard/qualite/indicateurs',
    bgClass: 'bg-indigo-50 dark:bg-indigo-900/20',
    iconClass: 'text-indigo-600 dark:text-indigo-400',
    borderClass: 'border-indigo-200 dark:border-indigo-800',
    hoverClass: 'hover:border-indigo-400 dark:hover:border-indigo-600',
  },
];

const navigateTo = (route) => {
  router.push(route);
};
</script>

<template>
  <div class="space-y-8">
    <!-- En-tête -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Qualité</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        Pilotez votre démarche qualité et votre conformité Qualiopi.
      </p>
    </div>

    <!-- Grille de navigation -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="section in sections"
        :key="section.route"
        class="bg-white dark:bg-gray-800 rounded-xl border-2 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
        :class="[section.borderClass, section.hoverClass]"
        @click="navigateTo(section.route)"
      >
        <!-- Icône -->
        <div
          class="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
          :class="section.bgClass"
        >
          <i :class="[section.icon, section.iconClass]" class="text-2xl"></i>
        </div>

        <!-- Contenu -->
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {{ section.titre }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          {{ section.description }}
        </p>

        <!-- Lien discret -->
        <div class="mt-4 flex items-center gap-1 text-sm font-medium" :class="section.iconClass">
          <span>Accéder</span>
          <i class="pi pi-arrow-right text-xs"></i>
        </div>
      </div>
    </div>
  </div>
</template>
