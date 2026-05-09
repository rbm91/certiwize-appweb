<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  document.title = 'Politique de confidentialité — Certigestion';
});
</script>

<template>
  <div class="py-32 bg-white">
    <div class="marketing-container">
      <div class="max-w-3xl mx-auto">
        <span class="section-label block mb-3">Confidentialité</span>
        <div class="accent-bar" />
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-10" style="font-family: var(--font-serif);">
          Politique de confidentialité
        </h1>

        <div class="prose max-w-none text-gray-700 space-y-6">
          <section>
            <h2 class="text-xl font-bold text-gray-900 mb-3" style="font-family: var(--font-serif);">Données collectées</h2>
            <p>
              Nous collectons uniquement les données strictement nécessaires : nom, email, téléphone (optionnel)
              et le contenu de votre message lorsque vous nous contactez via les formulaires du site. Aucune
              donnée n'est collectée sans votre action volontaire.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-bold text-gray-900 mb-3" style="font-family: var(--font-serif);">Finalités</h2>
            <p>
              Ces données servent exclusivement à vous recontacter dans le cadre de votre demande, à vous
              proposer un échange ou un diagnostic, et à assurer le suivi de notre relation commerciale.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-bold text-gray-900 mb-3" style="font-family: var(--font-serif);">Conservation</h2>
            <p>
              Vos données sont conservées pour une durée maximale de 3 ans à compter du dernier contact, puis
              supprimées ou anonymisées.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-bold text-gray-900 mb-3" style="font-family: var(--font-serif);">Vos droits</h2>
            <p>
              Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, et
              d'opposition au traitement. Pour exercer ces droits, écrivez-nous à
              <a href="mailto:contact@certigestion.fr" class="underline">contact@certigestion.fr</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
