import { ref } from 'vue';

/**
 * Créer un signal d'abandon avec timeout compatible Safari < 16
 * (AbortSignal.timeout n'existe pas avant Safari 16)
 */
const createTimeoutSignal = (ms) => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
};

/**
 * Composable pour l'auto-complétion SIREN/SIRET via l'API entreprise.data.gouv.fr
 * Fallback silencieux si l'API est indisponible (ne bloque jamais le formulaire).
 */
export const useSirenLookup = () => {
  const loading = ref(false);
  const error = ref(null);
  const result = ref(null);

  /**
   * Recherche les informations d'une entreprise par SIREN
   * @param {string} siren - Numéro SIREN (9 chiffres)
   * @returns {Object|null} { raison_sociale, naf_ape, siret, adresse, cp, ville }
   */
  const lookup = async (siren) => {
    if (!siren || siren.length < 9) {
      result.value = null;
      return null;
    }

    // Nettoyage : retirer espaces et caractères non numériques
    const cleanSiren = siren.replace(/\D/g, '').substring(0, 9);
    if (cleanSiren.length !== 9) {
      result.value = null;
      return null;
    }

    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(
        `https://entreprise.data.gouv.fr/api/sirene/v3/unites_legales/${cleanSiren}`,
        {
          headers: { 'Accept': 'application/json' },
          signal: createTimeoutSignal(5000), // 5s timeout — compatible Safari
        }
      );

      if (!response.ok) {
        throw new Error(`API erreur: ${response.status}`);
      }

      const data = await response.json();
      const unite = data?.unite_legale;
      if (!unite) {
        result.value = null;
        return null;
      }

      // Extraire les informations pertinentes
      const periodesActives = unite.periodes || [];
      const dernierePeriode = periodesActives[0] || {};

      // Chercher le siège
      const siege = unite.etablissement_siege || {};

      const extracted = {
        raison_sociale: unite.denomination ||
          `${unite.prenom_usuel || ''} ${unite.nom || ''}`.trim() ||
          dernierePeriode.denomination || '',
        naf_ape: dernierePeriode.activite_principale || siege.activite_principale || '',
        siret: siege.siret || '',
        adresse: [
          siege.numero_voie,
          siege.type_voie,
          siege.libelle_voie,
        ].filter(Boolean).join(' ') || '',
        cp: siege.code_postal || '',
        ville: siege.libelle_commune || '',
      };

      result.value = extracted;
      return extracted;
    } catch (e) {
      // Fallback silencieux — ne bloque jamais
      error.value = e.message;
      result.value = null;
      console.warn('[SirenLookup] Erreur API:', e.message);
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Recherche par texte (raison sociale)
   * @param {string} query - Texte de recherche
   * @returns {Array} Liste de résultats
   */
  const search = async (query) => {
    if (!query || query.length < 3) return [];

    loading.value = true;
    try {
      const response = await fetch(
        `https://entreprise.data.gouv.fr/api/sirene/v1/full_text/${encodeURIComponent(query)}?per_page=5`,
        {
          headers: { 'Accept': 'application/json' },
          signal: createTimeoutSignal(5000), // 5s timeout — compatible Safari
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      return (data?.etablissement || []).map(e => ({
        siren: e.siren,
        siret: e.siret,
        raison_sociale: e.nom_raison_sociale || e.l1_normalisee || '',
        adresse: e.l4_normalisee || '',
        cp: e.code_postal || '',
        ville: e.libelle_commune || '',
        naf_ape: e.activite_principale || '',
      }));
    } catch (e) {
      console.warn('[SirenLookup] Erreur recherche:', e.message);
      return [];
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    result,
    lookup,
    search,
  };
};
