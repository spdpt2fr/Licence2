/**
 * Utilitaires de validation pour l'application Licence2
 * Taille: ~2KB - Responsabilité unique: validation des données
 */

class Validators {
  
  /**
   * Valider les données d'une licence
   * @param {Object} licenceData - Données de la licence à valider
   * @returns {Object} - { isValid: boolean, errors: string[] }
   */
  static validateLicence(licenceData) {
    const errors = [];
    
    // Champs obligatoires
    if (!licenceData.softwareName?.trim()) {
      errors.push('Le nom du logiciel est obligatoire');
    }
    
    if (!licenceData.vendor?.trim()) {
      errors.push('L\'éditeur est obligatoire');
    }
    
    if (!licenceData.version?.trim()) {
      errors.push('La version est obligatoire');
    }
    
    // Validation des sièges
    if (licenceData.seats && (licenceData.seats < 1 || !Number.isInteger(licenceData.seats))) {
      errors.push('Le nombre de sièges doit être un entier positif');
    }
    
    // Validation des dates
    if (licenceData.purchaseDate && !this.isValidDate(licenceData.purchaseDate)) {
      errors.push('La date d\'achat n\'est pas valide');
    }
    
    if (licenceData.expirationDate && !this.isValidDate(licenceData.expirationDate)) {
      errors.push('La date d\'expiration n\'est pas valide');
    }
    
    // Validation logique des dates
    if (licenceData.purchaseDate && licenceData.expirationDate) {
      const purchase = new Date(licenceData.purchaseDate);
      const expiration = new Date(licenceData.expirationDate);
      
      if (expiration <= purchase) {
        errors.push('La date d\'expiration doit être postérieure à la date d\'achat');
      }
    }
    
    // Validation du coût
    if (licenceData.initialCost && licenceData.initialCost < 0) {
      errors.push('Le coût initial ne peut pas être négatif');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Valider les données d'un utilisateur
   * @param {Object} userData - Données utilisateur à valider
   * @returns {Object} - { isValid: boolean, errors: string[] }
   */
  static validateUser(userData) {
    const errors = [];
    
    // Login obligatoire
    if (!userData.login?.trim()) {
      errors.push('Le login est obligatoire');
    } else {
      // Validation format login (lettres, chiffres, tirets)
      if (!/^[a-zA-Z0-9-_]{3,20}$/.test(userData.login)) {
        errors.push('Le login doit contenir 3-20 caractères (lettres, chiffres, - ou _)');
      }
    }
    
    // Mot de passe obligatoire
    if (!userData.password) {
      errors.push('Le mot de passe est obligatoire');
    } else {
      // Validation force du mot de passe
      if (userData.password.length < 4) {
        errors.push('Le mot de passe doit contenir au moins 4 caractères');
      }
    }
    
    // Validation du rôle
    const validRoles = ['read', 'write', 'admin'];
    if (userData.role && !validRoles.includes(userData.role)) {
      errors.push('Le rôle doit être: read, write ou admin');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Valider une date
   * @param {string} dateString - Date au format YYYY-MM-DD
   * @returns {boolean}
   */
  static isValidDate(dateString) {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
  }
  
  /**
   * Valider un email
   * @param {string} email - Adresse email à valider
   * @returns {boolean}
   */
  static isValidEmail(email) {
    if (!email) return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }
  
  /**
   * Valider un nombre positif
   * @param {any} value - Valeur à valider
   * @returns {boolean}
   */
  static isPositiveNumber(value) {
    const num = Number(value);
    return !isNaN(num) && num >= 0;
  }
  
  /**
   * Valider un entier positif
   * @param {any} value - Valeur à valider
   * @returns {boolean}
   */
  static isPositiveInteger(value) {
    const num = Number(value);
    return Number.isInteger(num) && num > 0;
  }
  
  /**
   * Nettoyer et valider un string
   * @param {any} value - Valeur à nettoyer
   * @param {number} maxLength - Longueur maximale (optionnel)
   * @returns {string}
   */
  static sanitizeString(value, maxLength = null) {
    if (!value) return '';
    
    let cleaned = String(value).trim();
    
    if (maxLength && cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength);
    }
    
    return cleaned;
  }
  
  /**
   * Valider les champs obligatoires
   * @param {Object} data - Objet contenant les données
   * @param {string[]} requiredFields - Liste des champs obligatoires
   * @returns {string[]} - Liste des erreurs
   */
  static validateRequiredFields(data, requiredFields) {
    const errors = [];
    
    requiredFields.forEach(field => {
      if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
        errors.push(`Le champ "${field}" est obligatoire`);
      }
    });
    
    return errors;
  }
}

// Export global pour compatibilité navigateur
window.Validators = Validators;