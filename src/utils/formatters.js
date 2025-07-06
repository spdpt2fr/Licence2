/**
 * Utilitaires de formatage pour l'application Licence2
 * Taille: ~2KB - Responsabilité unique: formatage et affichage des données
 */

class Formatters {
  
  /**
   * Formater une date pour l'affichage
   * @param {string|Date} date - Date à formater
   * @param {string} format - Format de sortie ('short', 'long', 'iso')
   * @returns {string}
   */
  static formatDate(date, format = 'short') {
    if (!date) return '-';
    
    const d = new Date(date);
    if (isNaN(d)) return 'Date invalide';
    
    switch (format) {
      case 'short':
        return d.toLocaleDateString('fr-FR');
      
      case 'long':
        return d.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long', 
          day: 'numeric'
        });
      
      case 'iso':
        return d.toISOString().split('T')[0];
      
      default:
        return d.toLocaleDateString('fr-FR');
    }
  }
  
  /**
   * Formater un prix en euros
   * @param {number} amount - Montant à formater
   * @param {boolean} showCurrency - Afficher le symbole € (défaut: true)
   * @returns {string}
   */
  static formatPrice(amount, showCurrency = true) {
    if (amount === null || amount === undefined) return '-';
    
    const num = Number(amount);
    if (isNaN(num)) return 'Prix invalide';
    
    const formatted = num.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return showCurrency ? `${formatted} €` : formatted;
  }
  
  /**
   * Formater le nom d'affichage d'un rôle utilisateur
   * @param {string} role - Rôle technique (read, write, admin)
   * @returns {string}
   */
  static formatRole(role) {
    const roleMap = {
      'read': 'Lecture',
      'write': 'Écriture',
      'admin': 'Administrateur'
    };
    
    return roleMap[role] || 'Inconnu';
  }
  
  /**
   * Formater le type de licence pour l'affichage
   * @param {string} type - Type technique de licence
   * @returns {string}
   */
  static formatLicenceType(type) {
    const typeMap = {
      'perpetuelle': 'Perpétuelle',
      'abonnement': 'Abonnement',
      'utilisateur': 'Par utilisateur',
      'concurrent': 'Concurrent'
    };
    
    return typeMap[type] || type || '-';
  }
  
  /**
   * Formater le statut d'expiration d'une licence
   * @param {string} expirationDate - Date d'expiration
   * @returns {Object} - { text, level, daysLeft }
   */
  static formatExpirationStatus(expirationDate) {
    if (!expirationDate) {
      return { text: 'Pas d\'expiration', level: 'neutral', daysLeft: null };
    }
    
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return {
        text: `Expirée depuis ${Math.abs(diffDays)} jour(s)`,
        level: 'danger',
        daysLeft: diffDays
      };
    } else if (diffDays <= 30) {
      return {
        text: `Expire dans ${diffDays} jour(s)`,
        level: 'warning',
        daysLeft: diffDays
      };
    } else {
      return {
        text: `Expire le ${this.formatDate(expirationDate)}`,
        level: 'success',
        daysLeft: diffDays
      };
    }
  }
  
  /**
   * Formater un nom de logiciel pour l'affichage
   * @param {string} name - Nom du logiciel
   * @param {number} maxLength - Longueur max (défaut: 30)
   * @returns {string}
   */
  static formatSoftwareName(name, maxLength = 30) {
    if (!name) return '-';
    
    const cleanName = String(name).trim();
    
    if (cleanName.length <= maxLength) {
      return cleanName;
    }
    
    return cleanName.substring(0, maxLength - 3) + '...';
  }
  
  /**
   * Formater un nombre de sièges
   * @param {number} seats - Nombre de sièges
   * @returns {string}
   */
  static formatSeats(seats) {
    if (!seats || seats < 1) return '1';
    
    const num = Number(seats);
    return isNaN(num) ? '1' : num.toString();
  }
  
  /**
   * Formater une taille de fichier
   * @param {number} bytes - Taille en bytes
   * @returns {string}
   */
  static formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
  
  /**
   * Formater du texte pour l'affichage (capitalisation)
   * @param {string} text - Texte à formater
   * @param {string} style - Style ('title', 'sentence', 'upper', 'lower')
   * @returns {string}
   */
  static formatText(text, style = 'sentence') {
    if (!text) return '';
    
    const str = String(text).trim();
    
    switch (style) {
      case 'title':
        return str.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
      
      case 'sentence':
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      
      case 'upper':
        return str.toUpperCase();
      
      case 'lower':
        return str.toLowerCase();
      
      default:
        return str;
    }
  }
  
  /**
   * Formater un nom d'utilisateur pour l'affichage
   * @param {string} login - Login de l'utilisateur
   * @param {string} role - Rôle de l'utilisateur
   * @returns {string}
   */
  static formatUserDisplay(login, role = null) {
    if (!login) return 'Utilisateur inconnu';
    
    let display = String(login).trim();
    
    if (role) {
      display += ` (${this.formatRole(role)})`;
    }
    
    return display;
  }
}

// Export global pour compatibilité navigateur
window.Formatters = Formatters;