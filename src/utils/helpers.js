/**
 * Utilitaires généraux pour l'application Licence2
 * Taille: ~2KB - Responsabilité unique: fonctions d'aide communes
 */

class Helpers {
  
  /**
   * Générer un ID unique
   * @returns {string} - ID unique basé sur timestamp + random
   */
  static generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * Générer un UUID v4 simple
   * @returns {string} - UUID v4
   */
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  /**
   * Gestion des cookies
   */
  static cookie = {
    /**
     * Définir un cookie
     * @param {string} name - Nom du cookie
     * @param {string} value - Valeur du cookie
     * @param {number} days - Durée en jours
     */
    set(name, value, days = 7) {
      const expires = days * 24 * 60 * 60;
      document.cookie = `${name}=${value}; Max-Age=${expires}; path=/`;
    },
    
    /**
     * Récupérer un cookie
     * @param {string} name - Nom du cookie
     * @returns {string|null}
     */
    get(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(";").shift();
      return null;
    },
    
    /**
     * Supprimer un cookie
     * @param {string} name - Nom du cookie
     */
    delete(name) {
      document.cookie = `${name}=; Max-Age=0; path=/`;
    }
  };
  
  /**
   * Utilitaires DOM
   */
  static dom = {
    /**
     * Sélectionner un élément avec vérification
     * @param {string} selector - Sélecteur CSS
     * @returns {Element|null}
     */
    get(selector) {
      return document.querySelector(selector);
    },
    
    /**
     * Sélectionner tous les éléments
     * @param {string} selector - Sélecteur CSS
     * @returns {NodeList}
     */
    getAll(selector) {
      return document.querySelectorAll(selector);
    },
    
    /**
     * Ajouter une classe avec vérification
     * @param {string|Element} target - Sélecteur ou élément
     * @param {string} className - Classe à ajouter
     */
    addClass(target, className) {
      const element = typeof target === 'string' ? this.get(target) : target;
      element?.classList.add(className);
    },
    
    /**
     * Supprimer une classe avec vérification
     * @param {string|Element} target - Sélecteur ou élément
     * @param {string} className - Classe à supprimer
     */
    removeClass(target, className) {
      const element = typeof target === 'string' ? this.get(target) : target;
      element?.classList.remove(className);
    },
    
    /**
     * Basculer une classe
     * @param {string|Element} target - Sélecteur ou élément
     * @param {string} className - Classe à basculer
     */
    toggleClass(target, className) {
      const element = typeof target === 'string' ? this.get(target) : target;
      element?.classList.toggle(className);
    },
    
    /**
     * Vérifier si un élément a une classe
     * @param {string|Element} target - Sélecteur ou élément
     * @param {string} className - Classe à vérifier
     * @returns {boolean}
     */
    hasClass(target, className) {
      const element = typeof target === 'string' ? this.get(target) : target;
      return element?.classList.contains(className) || false;
    }
  };
  
  /**
   * Utilitaires de delay et timing
   */
  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Debounce une fonction
   * @param {Function} func - Fonction à debouncer
   * @param {number} wait - Délai en ms
   * @returns {Function}
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  /**
   * Copier du texte dans le presse-papier
   * @param {string} text - Texte à copier
   * @returns {boolean} - Succès de l'opération
   */
  static async copyToClipboard(text) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback pour anciens navigateurs
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      }
    } catch (err) {
      console.error('Erreur copie presse-papier:', err);
      return false;
    }
  }
  
  /**
   * Télécharger un fichier
   * @param {Blob|string} content - Contenu du fichier
   * @param {string} filename - Nom du fichier
   * @param {string} mimeType - Type MIME (optionnel)
   */
  static downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
  }
  
  /**
   * Vérifier si l'appareil est mobile
   * @returns {boolean}
   */
  static isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  /**
   * Obtenir les paramètres URL
   * @returns {Object} - Objet avec les paramètres
   */
  static getUrlParams() {
    const params = {};
    const urlSearchParams = new URLSearchParams(window.location.search);
    for (const [key, value] of urlSearchParams) {
      params[key] = value;
    }
    return params;
  }
  
  /**
   * Logger amélioré avec timestamp
   */
  static log = {
    info(message, ...args) {
      console.log(`[${new Date().toISOString()}] ℹ️ ${message}`, ...args);
    },
    
    warn(message, ...args) {
      console.warn(`[${new Date().toISOString()}] ⚠️ ${message}`, ...args);
    },
    
    error(message, ...args) {
      console.error(`[${new Date().toISOString()}] ❌ ${message}`, ...args);
    },
    
    success(message, ...args) {
      console.log(`[${new Date().toISOString()}] ✅ ${message}`, ...args);
    }
  };
  
  /**
   * Utilitaires de stockage local
   */
  static storage = {
    /**
     * Sauvegarder dans localStorage avec gestion d'erreurs
     * @param {string} key - Clé de stockage
     * @param {any} value - Valeur à stocker
     * @returns {boolean} - Succès de l'opération
     */
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (err) {
        console.error('Erreur localStorage set:', err);
        return false;
      }
    },
    
    /**
     * Récupérer depuis localStorage
     * @param {string} key - Clé de stockage
     * @param {any} defaultValue - Valeur par défaut
     * @returns {any}
     */
    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (err) {
        console.error('Erreur localStorage get:', err);
        return defaultValue;
      }
    },
    
    /**
     * Supprimer une clé
     * @param {string} key - Clé à supprimer
     */
    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (err) {
        console.error('Erreur localStorage remove:', err);
        return false;
      }
    }
  };
}

// Export global pour compatibilité navigateur
window.Helpers = Helpers;