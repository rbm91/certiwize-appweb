/**
 * Fonctions utilitaires réutilisables
 * Élimine la duplication de code dans les composants
 */

import { DATE_FORMATS, VALIDATION, STORAGE } from '../config/constants';

/**
 * Formate une date selon le format français
 * @param {Date|string} date - Date à formater
 * @param {string} locale - Locale à utiliser (défaut: fr-FR)
 * @returns {string} - Date formatée ou '-' si invalide
 *
 * @example
 * formatDate(new Date()); // "30/01/2026"
 * formatDate('2026-01-30'); // "30/01/2026"
 * formatDate(null); // "-"
 */
export const formatDate = (date, locale = DATE_FORMATS.LOCALE) => {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '-';

    return dateObj.toLocaleDateString(locale);
  } catch (error) {
    console.error('[formatDate] Error formatting date:', error);
    return '-';
  }
};

/**
 * Parse une date de manière sécurisée
 * @param {any} val - Valeur à parser
 * @returns {Date|null} - Date parsée ou null si invalide
 *
 * @example
 * parseDateSafely('2026-01-30'); // Date object
 * parseDateSafely(null); // null
 * parseDateSafely('invalid'); // null
 */
export const parseDateSafely = (val) => {
  if (!val) return null;

  try {
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch (error) {
    console.error('[parseDateSafely] Error parsing date:', error);
    return null;
  }
};

/**
 * Nettoie un nom de fichier en supprimant les caractères spéciaux
 * @param {string} fileName - Nom de fichier à nettoyer
 * @param {string} replacement - Caractère de remplacement (défaut: '_')
 * @returns {string} - Nom de fichier nettoyé
 *
 * @example
 * sanitizeFileName('Mon fichier (1).pdf'); // "Mon_fichier__1_.pdf"
 * sanitizeFileName('Été 2026.docx'); // "Ete_2026.docx"
 */
export const sanitizeFileName = (fileName, replacement = '_') => {
  if (!fileName) return '';

  return fileName
    .normalize('NFD') // Décomposer les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-zA-Z0-9.]/g, replacement); // Remplacer les caractères spéciaux
};

/**
 * Extrait le chemin de fichier depuis une URL Supabase Storage
 * @param {string} url - URL complète du fichier
 * @param {string} bucketName - Nom du bucket
 * @returns {string|null} - Chemin du fichier ou null si invalide
 *
 * @example
 * extractStoragePath('https://...storage.../qualiopi-files/DOC1/file.pdf', 'qualiopi-files');
 * // Returns: "DOC1/file.pdf"
 */
export const extractStoragePath = (url, bucketName) => {
  if (!url || !bucketName) return null;

  try {
    const searchPattern = `/${bucketName}/`;
    const index = url.indexOf(searchPattern);

    if (index === -1) return null;

    return url.substring(index + searchPattern.length);
  } catch (error) {
    console.error('[extractStoragePath] Error extracting path:', error);
    return null;
  }
};

/**
 * Valide une adresse email
 * @param {string} email - Email à valider
 * @returns {boolean} - True si valide
 *
 * @example
 * validateEmail('test@example.com'); // true
 * validateEmail('invalid'); // false
 */
export const validateEmail = (email) => {
  if (!email) return false;
  return VALIDATION.EMAIL_REGEX.test(email);
};

/**
 * Valide un numéro de téléphone français
 * @param {string} phone - Numéro à valider
 * @returns {boolean} - True si valide
 *
 * @example
 * validatePhone('06 12 34 56 78'); // true
 * validatePhone('+33612345678'); // true
 * validatePhone('invalid'); // false
 */
export const validatePhone = (phone) => {
  if (!phone) return false;
  return VALIDATION.PHONE_REGEX.test(phone);
};

/**
 * Valide un numéro SIRET
 * @param {string} siret - SIRET à valider
 * @returns {boolean} - True si valide
 *
 * @example
 * validateSiret('12345678901234'); // true (si checksum valide)
 * validateSiret('123'); // false
 */
export const validateSiret = (siret) => {
  if (!siret) return false;

  // Supprimer les espaces
  const cleaned = siret.replace(/\s/g, '');

  // Vérifier la longueur
  if (cleaned.length !== VALIDATION.SIRET_LENGTH) return false;

  // Vérifier que ce sont tous des chiffres
  if (!/^\d+$/.test(cleaned)) return false;

  // Algorithme de Luhn pour valider le SIRET
  let sum = 0;
  for (let i = 0; i < cleaned.length; i++) {
    let digit = parseInt(cleaned[i]);

    // Doubler les chiffres aux positions paires
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
  }

  return sum % 10 === 0;
};

/**
 * Vérifie si un fichier respecte les contraintes de taille et type
 * @param {File} file - Fichier à valider
 * @param {number} maxSize - Taille maximale en octets (défaut: 10MB)
 * @param {Array<string>} allowedTypes - Types MIME autorisés
 * @returns {Object} - {valid: boolean, error: string|null}
 *
 * @example
 * validateFile(file); // {valid: true, error: null}
 * validateFile(file, 5000000); // {valid: false, error: 'File too large'}
 */
export const validateFile = (
  file,
  maxSize = STORAGE.MAX_FILE_SIZE,
  allowedTypes = STORAGE.ALLOWED_FILE_TYPES
) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Vérifier la taille
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Le fichier est trop volumineux (max: ${(maxSize / 1000000).toFixed(1)}MB)`
    };
  }

  // Vérifier le type
  if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Type de fichier non autorisé'
    };
  }

  return { valid: true, error: null };
};

/**
 * Génère un nom de fichier unique avec timestamp
 * @param {string} originalName - Nom original du fichier
 * @param {string} prefix - Préfixe optionnel
 * @returns {string} - Nom de fichier unique
 *
 * @example
 * generateUniqueFileName('document.pdf'); // "1706623456789_document.pdf"
 * generateUniqueFileName('photo.jpg', 'user'); // "user_1706623456789_photo.jpg"
 */
export const generateUniqueFileName = (originalName, prefix = '') => {
  const timestamp = Date.now();
  const sanitized = sanitizeFileName(originalName);
  return prefix ? `${prefix}_${timestamp}_${sanitized}` : `${timestamp}_${sanitized}`;
};

/**
 * Calcule le prix TTC à partir du HT
 * @param {number} priceHT - Prix HT
 * @param {number} vatRate - Taux de TVA (défaut: 20%)
 * @returns {number} - Prix TTC arrondi à 2 décimales
 *
 * @example
 * calculateTTC(100); // 120
 * calculateTTC(100, 0.055); // 105.5
 */
export const calculateTTC = (priceHT, vatRate = 0.20) => {
  if (!priceHT || isNaN(priceHT)) return 0;
  return Math.round(priceHT * (1 + vatRate) * 100) / 100;
};

/**
 * Calcule le prix HT à partir du TTC
 * @param {number} priceTTC - Prix TTC
 * @param {number} vatRate - Taux de TVA (défaut: 20%)
 * @returns {number} - Prix HT arrondi à 2 décimales
 *
 * @example
 * calculateHT(120); // 100
 * calculateHT(105.5, 0.055); // 100
 */
export const calculateHT = (priceTTC, vatRate = 0.20) => {
  if (!priceTTC || isNaN(priceTTC)) return 0;
  return Math.round((priceTTC / (1 + vatRate)) * 100) / 100;
};

/**
 * Tronque un texte à une longueur maximale
 * @param {string} text - Texte à tronquer
 * @param {number} maxLength - Longueur maximale
 * @param {string} suffix - Suffixe à ajouter (défaut: '...')
 * @returns {string} - Texte tronqué
 *
 * @example
 * truncate('Un très long texte ici', 10); // "Un très lo..."
 */
export const truncate = (text, maxLength, suffix = '...') => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Débounce une fonction
 * @param {Function} func - Fonction à debouncer
 * @param {number} wait - Délai en ms
 * @returns {Function} - Fonction debouncée
 *
 * @example
 * const debouncedSearch = debounce((query) => search(query), 300);
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Deep clone d'un objet
 * @param {any} obj - Objet à cloner
 * @returns {any} - Clone profond
 *
 * @example
 * const cloned = deepClone({a: {b: 1}});
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj));
};

export default {
  formatDate,
  parseDateSafely,
  sanitizeFileName,
  extractStoragePath,
  validateEmail,
  validatePhone,
  validateSiret,
  validateFile,
  generateUniqueFileName,
  calculateTTC,
  calculateHT,
  truncate,
  debounce,
  deepClone
};
