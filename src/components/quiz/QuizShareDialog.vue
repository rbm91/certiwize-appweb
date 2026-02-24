<script setup>
import { ref, computed } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  visible: { type: Boolean, default: false },
  shareToken: { type: String, default: '' },
});

const emit = defineEmits(['update:visible']);

const copied = ref(false);

const shareUrl = computed(() => {
  return `${window.location.origin}/quiz/${props.shareToken}`;
});

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch (err) {
    // Fallback
    const input = document.createElement('input');
    input.value = shareUrl.value;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  }
};
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="t('quiz_builder.share_title')"
    modal
    :style="{ width: '500px' }"
    :dismissableMask="true"
  >
    <div class="space-y-4">
      <p class="text-sm text-surface-600 dark:text-surface-400">
        {{ t('quiz_builder.share_desc') }}
      </p>

      <div class="flex gap-2">
        <InputText
          :modelValue="shareUrl"
          readonly
          class="flex-1 font-mono text-sm"
        />
        <Button
          :icon="copied ? 'pi pi-check' : 'pi pi-copy'"
          :severity="copied ? 'success' : 'primary'"
          :label="copied ? t('quiz_builder.copied') : t('quiz_builder.copy')"
          @click="copyLink"
        />
      </div>

      <div class="bg-surface-50 dark:bg-surface-900 rounded-lg p-3 text-xs text-surface-500 dark:text-surface-400">
        <i class="pi pi-info-circle mr-1" />
        {{ t('quiz_builder.share_info') }}
      </div>
    </div>
  </Dialog>
</template>
