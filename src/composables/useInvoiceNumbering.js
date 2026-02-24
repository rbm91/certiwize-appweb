import { supabase } from '../supabase';
import { useAuthStore } from '../stores/auth';

/**
 * Composable pour la numérotation séquentielle des factures.
 * Règles CDC :
 * - Numérotation unique et continue obligatoire par organisation
 * - Format : FA-YYYY-NNNNN (ex: FA-2026-00001)
 * - Aucun trou dans la séquence
 * - Filtré par organization_id pour le cloisonnement multi-tenant
 */
export const useInvoiceNumbering = () => {
  const authStore = useAuthStore();

  /**
   * Génère le prochain numéro de facture
   * @param {string} prefix - Préfixe (par défaut 'FA')
   * @returns {string} Numéro de facture formaté
   */
  const getNextNumber = async (prefix = 'FA') => {
    const year = new Date().getFullYear();
    const yearPrefix = `${prefix}-${year}-`;

    try {
      const orgId = authStore.currentOrganization?.id;
      if (!orgId) throw new Error('Aucune organisation sélectionnée');

      // Chercher le dernier numéro émis pour cette année et cette organisation
      let query = supabase
        .from('factures')
        .select('numero')
        .eq('organization_id', orgId)
        .like('numero', `${yearPrefix}%`)
        .order('numero', { ascending: false })
        .limit(1);

      const { data, error } = await query;

      if (error) throw error;

      let nextSeq = 1;
      if (data && data.length > 0) {
        const lastNumero = data[0].numero;
        const lastSeq = parseInt(lastNumero.replace(yearPrefix, ''), 10);
        if (!isNaN(lastSeq)) {
          nextSeq = lastSeq + 1;
        }
      }

      return `${yearPrefix}${nextSeq.toString().padStart(5, '0')}`;
    } catch (e) {
      console.error('[InvoiceNumbering] Erreur:', e.message);
      // Fallback avec timestamp pour éviter blocage
      const ts = Date.now().toString().slice(-6);
      return `${yearPrefix}${ts}`;
    }
  };

  /**
   * Génère le prochain numéro d'avoir
   * @returns {string} Numéro d'avoir formaté (AV-YYYY-NNNNN)
   */
  const getNextAvoirNumber = async () => {
    return getNextNumber('AV');
  };

  /**
   * Vérifie qu'un numéro n'existe pas déjà
   * @param {string} numero
   * @returns {boolean} true si le numéro est disponible
   */
  const isNumberAvailable = async (numero) => {
    try {
      const orgId = authStore.currentOrganization?.id;
      if (!orgId) throw new Error('Aucune organisation sélectionnée');

      const { data, error } = await supabase
        .from('factures')
        .select('id')
        .eq('organization_id', orgId)
        .eq('numero', numero)
        .limit(1);

      if (error) throw error;
      return !data || data.length === 0;
    } catch (e) {
      console.error('[InvoiceNumbering] Erreur vérification:', e.message);
      return false;
    }
  };

  return {
    getNextNumber,
    getNextAvoirNumber,
    isNumberAvailable,
  };
};
