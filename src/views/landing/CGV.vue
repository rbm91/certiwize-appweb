<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  document.title = 'Conditions générales de vente — Certigestion';
});
</script>

<template>
  <div class="py-32 bg-white">
    <div class="marketing-container">
      <div class="max-w-3xl mx-auto">
        <span class="section-label block mb-3">Conditions générales</span>
        <div class="accent-bar" />
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-10" style="font-family: var(--font-serif);">
          Conditions générales de vente
        </h1>

        <div class="prose max-w-none text-gray-700 space-y-6">
          <section>
            <h2 class="text-xl font-bold text-gray-900 mb-3" style="font-family: var(--font-serif);">Objet</h2>
            <p>
              Les présentes conditions régissent la fourniture par Certigestion de prestations
              d'accompagnement et d'accès à son outil SaaS de structuration des organismes de formation.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-bold text-gray-900 mb-3" style="font-family: var(--font-serif);">Tarifs et engagement</h2>
            <p>
              Les tarifs en vigueur sont indiqués sur la page <router-link to="/pricing" class="underline">Tarifs</router-link>.
              L'abonnement mensuel est facturé à terme à échoir et peut être souscrit avec ou sans engagement.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-bold text-gray-900 mb-3" style="font-family: var(--font-serif);">Garantie satisfaction</h2>
            <p>
              Vous disposez de 30 jours pour vous rétracter et obtenir le remboursement intégral des sommes
              versées, sous réserve d'en faire la demande par écrit à
              <a href="mailto:contact@certigestion.fr" class="underline">contact@certigestion.fr</a>.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-bold text-gray-900 mb-3" style="font-family: var(--font-serif);">Loi applicable</h2>
            <p>
              Les présentes conditions sont soumises au droit français. Tout litige relèvera de la compétence
              exclusive des tribunaux de Paris.
            </p>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
