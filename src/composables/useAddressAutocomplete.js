import { ref } from 'vue';

/**
 * Composable pour l'auto-complétion d'adresses via l'API adresse.data.gouv.fr
 * Utilisation : const { suggestions, search, selectAddress } = useAddressAutocomplete()
 */
export const useAddressAutocomplete = () => {
  const suggestions = ref([]);
  const loading = ref(false);
  let debounceTimer = null;

  /**
   * Rechercher une adresse (avec debounce)
   * @param {string} query - Le texte à rechercher
   */
  const search = (query) => {
    if (debounceTimer) clearTimeout(debounceTimer);

    if (!query || query.length < 3) {
      suggestions.value = [];
      return;
    }

    debounceTimer = setTimeout(async () => {
      loading.value = true;
      try {
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`
        );
        const data = await response.json();

        suggestions.value = (data.features || []).map((feature) => ({
          label: feature.properties.label,
          street: feature.properties.name || '',
          postcode: feature.properties.postcode || '',
          city: feature.properties.city || '',
          context: feature.properties.context || '',
          department: feature.properties.context ? feature.properties.context.split(',')[0]?.trim() : '',
          lat: feature.geometry?.coordinates?.[1] || null,
          lon: feature.geometry?.coordinates?.[0] || null
        }));
      } catch (err) {
        console.error('[AddressAutocomplete] Erreur API:', err);
        suggestions.value = [];
      } finally {
        loading.value = false;
      }
    }, 300);
  };

  /**
   * Sélectionner une adresse et retourner les données structurées
   * @param {object} address - L'adresse sélectionnée
   * @returns {object} - { street, postcode, city, department }
   */
  const selectAddress = (address) => {
    suggestions.value = [];
    return {
      street: address.street,
      postcode: address.postcode,
      city: address.city,
      department: address.department
    };
  };

  const clear = () => {
    suggestions.value = [];
    if (debounceTimer) clearTimeout(debounceTimer);
  };

  return {
    suggestions,
    loading,
    search,
    selectAddress,
    clear
  };
};
