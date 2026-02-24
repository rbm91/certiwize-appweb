<script setup>
import { ref, watch } from 'vue';
import InputText from 'primevue/inputtext';
import { useAddressAutocomplete } from '../../composables/useAddressAutocomplete';

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Saisissez une adresse...' },
  disabled: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'address-selected']);

const { suggestions, loading, search, selectAddress, clear } = useAddressAutocomplete();
const showDropdown = ref(false);
const inputValue = ref(props.modelValue);

watch(() => props.modelValue, (val) => {
  inputValue.value = val;
});

const handleInput = (e) => {
  const val = e.target.value;
  inputValue.value = val;
  emit('update:modelValue', val);
  search(val);
  showDropdown.value = true;
};

const handleSelect = (suggestion) => {
  const address = selectAddress(suggestion);
  inputValue.value = suggestion.street;
  emit('update:modelValue', suggestion.street);
  emit('address-selected', address);
  showDropdown.value = false;
};

const handleBlur = () => {
  // Petit délai pour permettre le clic sur une suggestion
  setTimeout(() => {
    showDropdown.value = false;
  }, 200);
};

const handleFocus = () => {
  if (suggestions.value.length > 0) {
    showDropdown.value = true;
  }
};
</script>

<template>
  <div class="relative">
    <InputText
      :modelValue="inputValue"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full"
    />

    <!-- Indicateur de chargement -->
    <div v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2">
      <i class="pi pi-spin pi-spinner text-gray-400"></i>
    </div>

    <!-- Dropdown suggestions -->
    <div
      v-if="showDropdown && suggestions.length > 0"
      class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
    >
      <div
        v-for="(suggestion, index) in suggestions"
        :key="index"
        class="px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
        @mousedown.prevent="handleSelect(suggestion)"
      >
        <div class="flex items-start gap-2">
          <i class="pi pi-map-marker text-primary mt-0.5 text-sm"></i>
          <div>
            <div class="text-sm font-medium text-gray-900 dark:text-white">
              {{ suggestion.label }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ suggestion.context }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
