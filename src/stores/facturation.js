import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '../supabase';
import { useAuthStore } from './auth';
import { useAuditTrail } from '../composables/useAuditTrail';
import { useInvoiceNumbering } from '../composables/useInvoiceNumbering';

const cleanPayload = (data) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === '') continue;
    cleaned[key] = value;
  }
  return cleaned;
};

export const useFacturationStore = defineStore('facturation', () => {
  const factures = ref([]);
  const paiements = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const auth = useAuthStore();
  const { logEvent } = useAuditTrail();
  const { getNextNumber, getNextAvoirNumber } = useInvoiceNumbering();

  // ── Getters ──

  const activeFactures = computed(() =>
    factures.value.filter(f => !f.deleted_at)
  );

  const facturesParStatut = (statut) =>
    activeFactures.value.filter(f => f.statut === statut);

  const facturesEnRetard = computed(() =>
    activeFactures.value.filter(f => {
      if (f.statut === 'payee' || f.statut === 'annulee') return false;
      if (!f.date_echeance) return false;
      return new Date(f.date_echeance) < new Date();
    })
  );

  const avoirs = computed(() =>
    activeFactures.value.filter(f => f.type_facture === 'avoir')
  );

  const totalEnAttente = computed(() =>
    activeFactures.value
      .filter(f => ['emise', 'envoyee'].includes(f.statut))
      .reduce((sum, f) => sum + (parseFloat(f.montant_ttc) - parseFloat(f.montant_paye || 0)), 0)
  );

  const totalEnRetard = computed(() =>
    facturesEnRetard.value
      .reduce((sum, f) => sum + (parseFloat(f.montant_ttc) - parseFloat(f.montant_paye || 0)), 0)
  );

  // ── Fetch ──

  const fetchFactures = async () => {
    if (!auth.currentOrganization?.id && !auth.isSuperAdmin) return;

    loading.value = true;
    error.value = null;
    try {
      const orgId = auth.currentOrganization?.id;

      let query = supabase
        .from('factures')
        .select(`
          *,
          client:client_id(id, nom_affiche, raison_sociale),
          payeur:payeur_id(id, nom_affiche, raison_sociale),
          prestation:prestation_id(id, intitule, reference, type)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (!auth.isSuperAdmin) {
        query = query.eq('organization_id', orgId);
      }

      const { data, error: err } = await query;
      if (err) throw err;

      factures.value = data || [];

      // Auto-détection des retards
      const now = new Date();
      for (const f of factures.value) {
        if (['emise', 'envoyee'].includes(f.statut) && f.date_echeance && new Date(f.date_echeance) < now) {
          if (f.statut !== 'en_retard') {
            // Mettre à jour le statut en base (silencieux)
            supabase.from('factures').update({ statut: 'en_retard' }).eq('id', f.id).then();
            f.statut = 'en_retard';
          }
        }
      }
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // ── CRUD ──

  const createFacture = async (factureData) => {
    loading.value = true;
    try {
      const isAvoir = factureData.type_facture === 'avoir';
      const numero = isAvoir ? await getNextAvoirNumber() : await getNextNumber();

      // Calcul TVA
      const montantHt = parseFloat(factureData.montant_ht) || 0;
      const tauxTva = parseFloat(factureData.taux_tva) || 20;
      const montantTva = Math.round(montantHt * tauxTva) / 100;
      const montantTtc = montantHt + montantTva;

      const finalData = cleanPayload({
        ...factureData,
        numero,
        montant_ht: montantHt,
        taux_tva: tauxTva,
        montant_tva: montantTva,
        montant_ttc: montantTtc,
        montant_paye: 0,
        statut: 'brouillon',
        organization_id: auth.currentOrganization?.id,
        user_id: auth.user.id,
      });

      const { data, error: err } = await supabase
        .from('factures')
        .insert([finalData])
        .select()
        .single();

      if (err) throw err;

      factures.value.unshift(data);

      await logEvent('facture', data.id, 'creation', null, null, {
        numero, type: factureData.type_facture, montant_ttc: montantTtc,
      });

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Émettre une facture — verrouillage (plus modifiable après)
   */
  const emettreFacture = async (id) => {
    try {
      const { data, error: err } = await supabase
        .from('factures')
        .update({
          statut: 'emise',
          date_emission: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('statut', 'brouillon') // seulement si brouillon
        .select()
        .single();

      if (err) throw err;

      const index = factures.value.findIndex(f => f.id === id);
      if (index !== -1) factures.value[index] = data;

      await logEvent('facture', id, 'emission');
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Marquer facture comme envoyée
   */
  const envoyerFacture = async (id) => {
    try {
      const { data, error: err } = await supabase
        .from('factures')
        .update({
          statut: 'envoyee',
          date_envoi: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (err) throw err;

      const index = factures.value.findIndex(f => f.id === id);
      if (index !== -1) factures.value[index] = data;

      await logEvent('facture', id, 'envoi');
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ── Paiements ──

  const enregistrerPaiement = async (factureId, montant, mode = 'virement', notes = '') => {
    try {
      const { data: paiement, error: err } = await supabase
        .from('paiements')
        .insert({
          facture_id: factureId,
          date_paiement: new Date().toISOString().split('T')[0],
          montant: parseFloat(montant),
          mode,
          notes,
          organization_id: auth.currentOrganization?.id,
          created_by: auth.user.id,
        })
        .select()
        .single();

      if (err) throw err;

      // Mettre à jour la facture
      const facture = factures.value.find(f => f.id === factureId);
      const totalPaye = parseFloat(facture?.montant_paye || 0) + parseFloat(montant);
      const nouveauStatut = totalPaye >= parseFloat(facture?.montant_ttc || 0) ? 'payee' : facture?.statut;

      const { data: updatedFacture, error: updateErr } = await supabase
        .from('factures')
        .update({
          montant_paye: totalPaye,
          statut: nouveauStatut,
          date_paiement: nouveauStatut === 'payee' ? new Date().toISOString().split('T')[0] : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', factureId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      const index = factures.value.findIndex(f => f.id === factureId);
      if (index !== -1) factures.value[index] = updatedFacture;

      await logEvent('facture', factureId, 'paiement', 'montant', null, {
        montant, mode, total_paye: totalPaye,
      });

      return { success: true, data: paiement };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ── Acomptes & Soldes ──

  /**
   * Génère automatiquement une facture d'acompte pour une prestation
   */
  const genererAcompte = async (prestationId, pourcentage = 30) => {
    try {
      // Récupérer la prestation
      const { data: prestation, error: err } = await supabase
        .from('prestations')
        .select('*, client:client_id(id), payeur:payeur_id(id)')
        .eq('id', prestationId)
        .single();

      if (err) throw err;

      const montantHt = Math.round((parseFloat(prestation.montant_ht || 0) * pourcentage) / 100 * 100) / 100;

      return await createFacture({
        prestation_id: prestationId,
        client_id: prestation.client_id,
        payeur_id: prestation.payeur_id,
        type_facture: 'acompte',
        montant_ht: montantHt,
        taux_tva: parseFloat(prestation.taux_tva) || 20,
        conditions_paiement: 'immediat',
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Génère la facture de solde (montant total - acomptes payés)
   */
  const genererFactureSolde = async (prestationId) => {
    try {
      const { data: prestation } = await supabase
        .from('prestations')
        .select('*')
        .eq('id', prestationId)
        .single();

      // Récupérer les acomptes déjà facturés
      const { data: acomptes } = await supabase
        .from('factures')
        .select('montant_ht')
        .eq('prestation_id', prestationId)
        .eq('type_facture', 'acompte')
        .is('deleted_at', null);

      const totalAcomptes = (acomptes || []).reduce((sum, a) => sum + parseFloat(a.montant_ht || 0), 0);
      const montantSolde = parseFloat(prestation.montant_ht || 0) - totalAcomptes;

      if (montantSolde <= 0) {
        return { success: false, error: 'Le montant de solde est nul ou négatif' };
      }

      return await createFacture({
        prestation_id: prestationId,
        client_id: prestation.client_id,
        payeur_id: prestation.payeur_id,
        type_facture: 'solde',
        montant_ht: Math.round(montantSolde * 100) / 100,
        taux_tva: parseFloat(prestation.taux_tva) || 20,
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Créer un avoir (annulation d'une facture)
   */
  const creerAvoir = async (factureId) => {
    try {
      const facture = factures.value.find(f => f.id === factureId);
      if (!facture) throw new Error('Facture introuvable');

      const result = await createFacture({
        prestation_id: facture.prestation_id,
        client_id: facture.client_id,
        payeur_id: facture.payeur_id,
        type_facture: 'avoir',
        montant_ht: -Math.abs(parseFloat(facture.montant_ht)),
        taux_tva: facture.taux_tva,
        facture_avoir_id: factureId,
        mentions_legales: `Avoir pour la facture ${facture.numero}`,
      });

      if (result.success) {
        // Marquer la facture originale comme annulée
        await supabase
          .from('factures')
          .update({ statut: 'annulee', facture_avoir_id: result.data.id, updated_at: new Date().toISOString() })
          .eq('id', factureId);

        const index = factures.value.findIndex(f => f.id === factureId);
        if (index !== -1) factures.value[index].statut = 'annulee';

        await logEvent('facture', factureId, 'annulation_avoir', null, null, { avoir_id: result.data.id });
      }

      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ── Trésorerie prévisionnelle ──

  /**
   * Calcule la trésorerie prévisionnelle sur N mois
   * @param {number} mois - Nombre de mois (6 ou 12)
   */
  const getTresoreriePrevisionnelle = (mois = 6) => {
    const now = new Date();
    const result = [];

    for (let i = 0; i <= mois; i++) {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);

      const monthFactures = activeFactures.value.filter(f => {
        if (!f.date_echeance) return false;
        const echeance = new Date(f.date_echeance);
        return echeance >= targetMonth && echeance <= monthEnd && f.statut !== 'annulee';
      });

      const encaissements = monthFactures
        .filter(f => f.statut === 'payee')
        .reduce((sum, f) => sum + parseFloat(f.montant_ttc || 0), 0);

      const aRecevoir = monthFactures
        .filter(f => ['emise', 'envoyee', 'en_retard'].includes(f.statut))
        .reduce((sum, f) => sum + (parseFloat(f.montant_ttc || 0) - parseFloat(f.montant_paye || 0)), 0);

      result.push({
        mois: targetMonth.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        encaissements,
        aRecevoir,
        total: encaissements + aRecevoir,
        factures: monthFactures.length,
      });
    }

    return result;
  };

  return {
    // State
    factures,
    paiements,
    loading,
    error,
    // Getters
    activeFactures,
    facturesParStatut,
    facturesEnRetard,
    avoirs,
    totalEnAttente,
    totalEnRetard,
    // Fetch
    fetchFactures,
    // CRUD
    createFacture,
    emettreFacture,
    envoyerFacture,
    // Paiements
    enregistrerPaiement,
    // Acomptes
    genererAcompte,
    genererFactureSolde,
    creerAvoir,
    // Trésorerie
    getTresoreriePrevisionnelle,
  };
});
