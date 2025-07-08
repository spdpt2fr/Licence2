/**
 * Formatters - Utilitaires de formatage
 * Formatage de dates, prix, textes pour l'interface
 */

import { APP_CONFIG } from '../config/app.config.js';

/**
 * Formate une date pour l'affichage
 * @param {string|Date} date - Date à formater
 * @param {string} format - Format de sortie
 * @returns {string} Date formatée
 */
export function formatDate(date, format = 'display') {
  if (!date) return '-';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Date invalide';
  
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  
  if (format === 'datetime') {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return new Intl.DateTimeFormat('fr-FR', options).format(d);
}

/**
 * Formate un prix avec la devise
 * @param {number} amount - Montant
 * @param {string} currency - Devise
 * @returns {string} Prix formaté
 */
export function formatPrice(amount, currency = APP_CONFIG.currencySymbol) {
  if (amount === null || amount === undefined) return '-';
  
  const formatter = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return `${formatter.format(amount)} ${currency}`;
}

/**
 * Calcule et formate les jours jusqu'à expiration
 * @param {string|Date} expirationDate - Date d'expiration
 * @returns {Object} Informations sur l'expiration
 */
export function formatExpirationStatus(expirationDate) {
  if (!expirationDate) return { status: 'unknown', days: 0, text: 'Date inconnue' };
  
  const expDate = new Date(expirationDate);
  const today = new Date();
  const diffTime = expDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return {
      status: 'expired',
      days: Math.abs(diffDays),
      text: `Expiré depuis ${Math.abs(diffDays)} jour(s)`
    };
  } else if (diffDays <= 30) {
    return {
      status: 'warning',
      days: diffDays,
      text: `Expire dans ${diffDays} jour(s)`
    };
  } else {
    return {
      status: 'active',
      days: diffDays,
      text: `Expire dans ${diffDays} jour(s)`
    };
  }
}

/**
 * Formate un nom d'utilisateur pour l'affichage
 * @param {string} role - Rôle utilisateur
 * @returns {string} Nom du rôle formaté
 */
export function formatRole(role) {
  const roleMap = {
    'read': 'Lecture',
    'write': 'Écriture',
    'admin': 'Admin'
  };
  
  return roleMap[role] || role;
}

/**
 * Formate un texte court avec troncature
 * @param {string} text - Texte à formater
 * @param {number} maxLength - Longueur maximum
 * @returns {string} Texte tronqué
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export default {
  formatDate,
  formatPrice,
  formatExpirationStatus,
  formatRole,
  truncateText
};