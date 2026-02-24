<script setup>
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';

defineProps({
  visible: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['update:visible']);

const reloadPage = () => {
    window.location.reload();
};
</script>

<template>
    <Dialog :visible="visible" header="Session expirée / Chargement long" :modal="true" :closable="false">
      <div class="flex flex-col items-center gap-4 p-4">
        <i class="pi pi-clock text-orange-500 text-4xl"></i>
        <p class="text-center">Votre session semble avoir expiré ou la connexion est lente.</p>
        <div class="flex gap-2 mt-2">
          <Button label="Recharger la page" severity="warning" icon="pi pi-refresh" @click="reloadPage" />
        </div>
      </div>
    </Dialog>
</template>
