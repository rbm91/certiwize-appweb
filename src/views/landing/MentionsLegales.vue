<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  document.title = 'Mentions légales — Certigestion';
});
</script>

<template>
  <div class="py-32 bg-white">
    <div class="marketing-container">
      <div class="max-w-3xl mx-auto">
        <span class="section-label block mb-3">Mentions légales</span>
        <div class="accent-bar" />
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-10" style="font-family: var(--font-serif);">
          Mentions légales
        </h1>

        <div class="prose max-w-none text-gray-700 space-y-6">
          <section>
            <h2 class="text-xl font-bold text-gray-900 mb-3" style="font-family: var(--font-serif);">Éditeur</h2>
            <p>
              Le présent site est édité par Certigestion.<br />
              Adresse : Paris et périphérie<br />
              Email : <a href="mailto:contact@certigestion.fr" class="underline">contact@certigestion.fr</a><br />
              Téléphone : +33 7 45 08 92 27
            </p>
          </section>

          <section>
            <h2 class="text-xl font-bold text-gray-900 mb-3" style="font-family: var(--font-serif);">Hébergement</h2>
            <p>
              Le site est hébergé sur Cloudflare Pages.<br />
              Cloudflare, Inc. — 101 Townsend St, San Francisco, CA 94107, États-Unis.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-bold text-gray-900 mb-3" style="font-family: var(--font-serif);">Propriété intellectuelle</h2>
            <p>
              L'ensemble du contenu de ce site (textes, images, logos, marques) est protégé par le droit
              de la propriété intellectuelle. Toute reproduction, totale ou partielle, sans autorisation
              écrite préalable est strictement interdite.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-bold text-gray-900 mb-3" style="font-family: var(--font-serif);">Contact</h2>
            <p>
              Pour toute question concernant ces mentions légales, vous pouvez nous écrire à
              <a href="mailto:contact@certigestion.fr" class="underline">contact@certigestion.fr</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
