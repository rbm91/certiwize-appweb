<script setup>
import { onMounted } from 'vue';

const GREEN = 'oklch(0.55 0.14 145)';

onMounted(() => {
  document.title = '404 — Certigestion';
});
</script>

<template>
  <div class="min-h-[70vh] flex items-center justify-center bg-white">
    <div class="marketing-container text-center max-w-2xl">
      <span class="section-label block mb-3">Erreur 404</span>
      <div class="accent-bar mx-auto" />
      <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mt-4 mb-6" style="font-family: var(--font-serif);">
        Cette page n'existe pas.
      </h1>
      <p class="text-gray-600 text-lg mb-10">
        La page que vous cherchez a été déplacée ou n'a jamais existé.
      </p>
      <router-link to="/landing" class="editorial-btn-green">
        Retour à l'accueil <i class="pi pi-arrow-right text-sm" />
      </router-link>
    </div>
  </div>
</template>
