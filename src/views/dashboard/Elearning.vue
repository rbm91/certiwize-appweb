<script setup>
import { ref } from 'vue';
import Button from 'primevue/button';
import Message from 'primevue/message';

// État
const interested = ref(false);
const email = ref('');

// Features principales
const features = [
  {
    id: 1,
    icon: 'pi pi-book',
    title: 'Création de parcours e-learning',
    description: 'Construisez des parcours structurés avec drag-and-drop intuitif et organisation flexible.',
    color: 'indigo',
  },
  {
    id: 2,
    icon: 'pi pi-play-circle',
    title: 'Modules interactifs',
    description: 'Intégrez des vidéos, quiz, documents et activités pour un apprentissage engageant.',
    color: 'violet',
  },
  {
    id: 3,
    icon: 'pi pi-chart-line',
    title: 'Suivi de progression',
    description: 'Visualisez en temps réel l\'avancement de chaque apprenant et identifiez les points de blocage.',
    color: 'purple',
  },
  {
    id: 4,
    icon: 'pi pi-verified',
    title: 'Certificats automatiques',
    description: 'Délivrez des certificats automatiquement à la fin d\'un parcours réussi.',
    color: 'indigo',
  },
  {
    id: 5,
    icon: 'pi pi-check-circle',
    title: 'Norme SCORM',
    description: 'Compatible SCORM 1.2 et 2004 pour intégration avec d\'autres plateformes LMS.',
    color: 'violet',
  },
  {
    id: 6,
    icon: 'pi pi-chart-bar',
    title: 'Statistiques et analytics',
    description: 'Analysez les données de suivi pour optimiser vos parcours pédagogiques.',
    color: 'purple',
  },
];

// Bénéfices
const benefits = [
  {
    icon: 'pi pi-clock',
    text: 'Flexibilité : vos apprenants apprennent à leur rythme',
  },
  {
    icon: 'pi pi-users',
    text: 'Scalabilité : formations pour des dizaines ou des milliers d\'apprenants',
  },
  {
    icon: 'pi pi-check',
    text: 'Conformité Qualiopi : suivi et traçabilité intégrés',
  },
  {
    icon: 'pi pi-mobile',
    text: 'Responsif : accessible sur desktop, tablette et mobile',
  },
];

// Handlers
const handleInterestClick = () => {
  interested.value = !interested.value;
};

const handleNotifyMe = () => {
  if (!email.value || !email.value.includes('@')) return;
  interested.value = false;
  email.value = '';
};

const getFeatureColorClass = (color) => {
  const map = {
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', icon: 'text-indigo-500', border: 'border-indigo-200 dark:border-indigo-800' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', icon: 'text-violet-500', border: 'border-violet-200 dark:border-violet-800' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-500', border: 'border-purple-200 dark:border-purple-800' },
  };
  return map[color] || map.indigo;
};
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <!-- Hero Section -->
    <div class="relative overflow-hidden">
      <div class="absolute inset-0 opacity-40">
        <div class="absolute top-20 left-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div class="absolute top-40 right-10 w-72 h-72 bg-violet-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div class="absolute bottom-20 left-1/2 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <div class="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28">
        <!-- Badge "Bientôt disponible" -->
        <div class="flex justify-center mb-8">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-full border border-indigo-300 dark:border-indigo-700">
            <i class="pi pi-clock text-indigo-600 dark:text-indigo-300 text-sm"></i>
            <span class="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Bientôt disponible</span>
          </div>
        </div>

        <!-- Titre principal -->
        <div class="text-center mb-8">
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-surface-900 dark:text-surface-0 mb-6 leading-tight">
            Créez vos <span class="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">parcours e-learning</span>
          </h1>
          <p class="text-lg md:text-xl text-surface-600 dark:text-surface-400 max-w-3xl mx-auto leading-relaxed">
            Une plateforme de formation en ligne intégrée à Certiwize pour créer, déployer et suivre vos modules e-learning avec facilité.
          </p>
        </div>

        <!-- Appel à l'action principal -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button
            label="Je suis intéressé"
            icon="pi pi-star-fill"
            @click="handleInterestClick"
            class="!bg-gradient-to-r !from-indigo-600 !to-violet-600 !text-white !border-0 !px-8 !py-3 !text-base !font-semibold hover:!shadow-lg hover:!shadow-indigo-400/50 transition-all"
          />
        </div>

        <!-- Formulaire d'intérêt -->
        <transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div v-if="interested" class="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-surface-200 dark:border-surface-700">
            <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-1">
              Restez informé
            </h3>
            <p class="text-sm text-surface-500 dark:text-surface-400 mb-4">
              Inscrivez-vous pour recevoir une notification dès que le module sera disponible.
            </p>

            <div class="space-y-3">
              <div>
                <label for="email" class="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-2">
                  Adresse email
                </label>
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  placeholder="votre@email.com"
                  class="w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-0 placeholder-surface-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  @keyup.enter="handleNotifyMe"
                />
              </div>

              <Button
                label="Me notifier"
                @click="handleNotifyMe"
                class="w-full !bg-gradient-to-r !from-indigo-600 !to-violet-600 !text-white !border-0 !font-semibold"
              />

              <Button
                label="Annuler"
                severity="secondary"
                text
                @click="handleInterestClick"
                class="w-full"
              />
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- Section Features -->
    <div class="max-w-6xl mx-auto px-6 py-20">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold text-surface-900 dark:text-surface-0 mb-4">
          Fonctionnalités principales
        </h2>
        <p class="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
          Tout ce dont vous avez besoin pour créer et gérer efficacement vos formations en ligne
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="feature in features"
          :key="feature.id"
          class="bg-white dark:bg-gray-800 rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 p-6"
          :class="getFeatureColorClass(feature.color).border"
        >
          <div
            class="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
            :class="getFeatureColorClass(feature.color).bg"
          >
            <i :class="[feature.icon, 'text-xl', getFeatureColorClass(feature.color).icon]"></i>
          </div>

          <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-2">
            {{ feature.title }}
          </h3>
          <p class="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
            {{ feature.description }}
          </p>
        </div>
      </div>
    </div>

    <!-- Section Bénéfices -->
    <div class="bg-white dark:bg-gray-800 border-y border-surface-200 dark:border-surface-700">
      <div class="max-w-6xl mx-auto px-6 py-20">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold text-surface-900 dark:text-surface-0 mb-4">
            Pourquoi choisir le module e-learning de Certiwize ?
          </h2>
          <p class="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
            Intégré à votre plateforme existante, conçu pour les organismes de formation
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="(benefit, index) in benefits"
            :key="index"
            class="flex items-start gap-4 p-6 bg-surface-50 dark:bg-surface-800/50 rounded-lg border border-surface-200 dark:border-surface-700"
          >
            <div class="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30 flex items-center justify-center flex-shrink-0 mt-1">
              <i :class="[benefit.icon, 'text-indigo-600 dark:text-indigo-400']"></i>
            </div>
            <p class="text-base text-surface-700 dark:text-surface-300 font-medium">
              {{ benefit.text }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Section Intégration -->
    <div class="max-w-6xl mx-auto px-6 py-20">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 class="text-3xl md:text-4xl font-bold text-surface-900 dark:text-surface-0 mb-6">
            Intégré à Certiwize
          </h2>
          <p class="text-lg text-surface-600 dark:text-surface-400 mb-6 leading-relaxed">
            Le module e-learning sera entièrement intégré à votre plateforme Certiwize. Vos données, vos utilisateurs, vos organisations : tout reste centralisé et sécurisé.
          </p>

          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i class="pi pi-check text-indigo-600 dark:text-indigo-400 text-xs"></i>
              </div>
              <div>
                <h4 class="font-semibold text-surface-900 dark:text-surface-0">Même infrastructure</h4>
                <p class="text-sm text-surface-600 dark:text-surface-400">Pas de changement de plateforme, tout en un seul endroit</p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i class="pi pi-check text-indigo-600 dark:text-indigo-400 text-xs"></i>
              </div>
              <div>
                <h4 class="font-semibold text-surface-900 dark:text-surface-0">Données synchronisées</h4>
                <p class="text-sm text-surface-600 dark:text-surface-400">Apprenants, projets et données partagés automatiquement</p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i class="pi pi-check text-indigo-600 dark:text-indigo-400 text-xs"></i>
              </div>
              <div>
                <h4 class="font-semibold text-surface-900 dark:text-surface-0">Sécurité Qualiopi</h4>
                <p class="text-sm text-surface-600 dark:text-surface-400">RLS, audit trails et conformité construits en natif</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-12 flex items-center justify-center h-80">
          <div class="text-center">
            <i class="pi pi-desktop text-6xl text-indigo-400 dark:text-indigo-500 mb-4 block"></i>
            <p class="text-surface-600 dark:text-surface-400 font-medium">Interface intuitive et moderne</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Section CTA finale -->
    <div class="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 relative overflow-hidden">
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-20 left-10 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div class="absolute bottom-20 right-10 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      <div class="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 class="text-3xl md:text-4xl font-bold text-white mb-6">
          Prêt à transformer votre formation ?
        </h2>
        <p class="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
          Rejoignez les organismes de formation qui font confiance à Certiwize pour moderniser leurs pratiques pédagogiques.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            label="Me notifier du lancement"
            icon="pi pi-bell"
            @click="handleInterestClick"
            class="!bg-white !text-indigo-600 !border-0 !px-8 !py-3 !text-base !font-semibold hover:!bg-indigo-50 transition-all"
          />
        </div>
      </div>
    </div>

    <!-- Info box footer -->
    <div class="max-w-6xl mx-auto px-6 py-12">
      <Message severity="info" :closable="false">
        <div class="flex items-start gap-3">
          <i class="pi pi-info-circle text-blue-500 mt-0.5 flex-shrink-0"></i>
          <div class="text-sm">
            <p class="font-semibold mb-1">Vous avez des questions ?</p>
            <p>
              Le module e-learning est en cours de développement. Contactez notre équipe support pour connaître la date de lancement estimée et pour adapter le module à vos besoins spécifiques.
            </p>
          </div>
        </div>
      </Message>
    </div>
  </div>
</template>
