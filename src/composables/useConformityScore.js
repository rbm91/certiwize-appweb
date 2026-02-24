import { SCORE_THRESHOLDS } from '../config/constants';

/**
 * Composable pour calculer le score de complétude d'un tiers.
 * Le score est non bloquant (informatif uniquement).
 *
 * Critères CDC :
 * - Type renseigné (nature)
 * - Au moins un rôle
 * - Email renseigné
 * - Téléphone renseigné
 * - Si formateur → NDA ou justificatif présent
 */
export const useConformityScore = () => {

  /**
   * Calcule le score de complétude d'un tiers
   * @param {Object} tier - Les données du tiers
   * @param {Array} roles - Les rôles du tiers ['client', 'apprenant', ...]
   * @param {Array} documents - Les documents rattachés au tiers
   * @returns {{ score: number, missing: string[], severity: string }}
   */
  const computeScore = (tier, roles = [], documents = []) => {
    const checks = [];
    const missing = [];

    // 1. Nature renseignée (personne_physique ou organisation)
    const hasNature = !!tier?.nature;
    checks.push(hasNature);
    if (!hasNature) missing.push('Nature du tiers (personne/organisation)');

    // 2. Au moins un rôle attribué
    const hasRole = roles.length > 0;
    checks.push(hasRole);
    if (!hasRole) missing.push('Au moins un rôle');

    // 3. Nom affiché renseigné
    const hasName = !!(tier?.nom_affiche || tier?.name || tier?.raison_sociale);
    checks.push(hasName);
    if (!hasName) missing.push('Nom affiché');

    // 4. Email renseigné
    const hasEmail = !!tier?.email;
    checks.push(hasEmail);
    if (!hasEmail) missing.push('Email');

    // 5. Téléphone renseigné
    const hasPhone = !!(tier?.telephone || tier?.phone);
    checks.push(hasPhone);
    if (!hasPhone) missing.push('Téléphone');

    // 6. Adresse renseignée
    const hasAddress = !!(tier?.address && tier?.city);
    checks.push(hasAddress);
    if (!hasAddress) missing.push('Adresse complète');

    // 7. Si formateur → NDA ou justificatif
    if (roles.includes('formateur')) {
      const hasFormateurDoc = tier?.nda_signe ||
        tier?.nda_document_url ||
        documents.some(d => d.type_document === 'nda');
      checks.push(hasFormateurDoc);
      if (!hasFormateurDoc) missing.push('NDA ou justificatif formateur');
    }

    // 8. Si organisation → raison sociale
    if (tier?.nature === 'organisation') {
      const hasRaisonSociale = !!tier?.raison_sociale;
      checks.push(hasRaisonSociale);
      if (!hasRaisonSociale) missing.push('Raison sociale');
    }

    // 9. Si apprenant → date de naissance recommandée
    if (roles.includes('apprenant')) {
      const hasBirthDate = !!tier?.date_naissance;
      checks.push(hasBirthDate);
      if (!hasBirthDate) missing.push('Date de naissance (apprenant)');
    }

    // Calcul du score
    const completed = checks.filter(Boolean).length;
    const total = checks.length;
    const score = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Sévérité pour le badge
    let severity = 'danger';
    if (score >= SCORE_THRESHOLDS.GREEN) severity = 'success';
    else if (score >= SCORE_THRESHOLDS.ORANGE) severity = 'warn';

    return { score, missing, severity, completed, total };
  };

  /**
   * Retourne la couleur CSS pour un score donné
   * @param {number} score
   * @returns {string}
   */
  const getScoreColor = (score) => {
    if (score >= SCORE_THRESHOLDS.GREEN) return '#10B981';
    if (score >= SCORE_THRESHOLDS.ORANGE) return '#F59E0B';
    return '#EF4444';
  };

  return {
    computeScore,
    getScoreColor,
  };
};
