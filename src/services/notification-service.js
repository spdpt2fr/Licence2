/**
 * Service de notifications pour l'application Licence2
 * Taille: ~3KB - Responsabilité unique: gestion des messages, alertes et notifications
 */

class NotificationService {
  
  constructor() {
    this.notifications = [];
    this.maxNotifications = 5;
    this.defaultDuration = 3000; // 3 secondes
  }

  /**
   * Afficher un message de succès
   * @param {string} message - Message à afficher
   * @param {number} duration - Durée en ms (optionnel)
   */
  static success(message, duration = null) {
    return this.show(message, 'success', duration);
  }

  /**
   * Afficher un message d'erreur
   * @param {string} message - Message à afficher
   * @param {number} duration - Durée en ms (optionnel)
   */
  static error(message, duration = null) {
    return this.show(message, 'error', duration || 5000); // Erreurs plus longues
  }

  /**
   * Afficher un message d'avertissement
   * @param {string} message - Message à afficher
   * @param {number} duration - Durée en ms (optionnel)
   */
  static warning(message, duration = null) {
    return this.show(message, 'warning', duration);
  }

  /**
   * Afficher un message d'information
   * @param {string} message - Message à afficher
   * @param {number} duration - Durée en ms (optionnel)
   */
  static info(message, duration = null) {
    return this.show(message, 'info', duration);
  }

  /**
   * Afficher une notification toast
   * @param {string} message - Message à afficher
   * @param {string} type - Type de notification (success, error, warning, info)
   * @param {number} duration - Durée en ms
   * @returns {HTMLElement} - Élément toast créé
   */
  static show(message, type = 'info', duration = 3000) {
    // Créer l'élément toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    
    // Contenu du toast
    const content = document.createElement('div');
    content.className = 'toast-content';
    
    // Icône selon le type
    const icon = this.getIcon(type);
    const iconSpan = document.createElement('span');
    iconSpan.className = 'toast-icon';
    iconSpan.textContent = icon;
    
    // Message
    const messageSpan = document.createElement('span');
    messageSpan.className = 'toast-message';
    messageSpan.textContent = message;
    
    // Bouton de fermeture
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.textContent = '✕';
    closeBtn.setAttribute('aria-label', 'Fermer la notification');
    closeBtn.addEventListener('click', () => this.remove(toast));
    
    // Assembler le toast
    content.appendChild(iconSpan);
    content.appendChild(messageSpan);
    content.appendChild(closeBtn);
    toast.appendChild(content);
    
    // Ajouter les styles inline si nécessaire
    this.applyToastStyles(toast, type);
    
    // Ajouter au DOM
    this.addToContainer(toast);
    
    // Animation d'entrée
    setTimeout(() => {
      toast.classList.add('toast-visible');
    }, 10);
    
    // Suppression automatique
    if (duration > 0) {
      setTimeout(() => {
        this.remove(toast);
      }, duration);
    }
    
    // Log pour debug
    Helpers.log.info(`Notification ${type}: ${message}`);
    
    return toast;
  }

  /**
   * Obtenir l'icône selon le type
   * @param {string} type - Type de notification
   * @returns {string} - Icône unicode
   */
  static getIcon(type) {
    const icons = {
      success: '✅',
      error: '❌', 
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  /**
   * Appliquer les styles CSS inline au toast
   * @param {HTMLElement} toast - Élément toast
   * @param {string} type - Type de notification
   */
  static applyToastStyles(toast, type) {
    // Styles de base
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: '9999',
      minWidth: '300px',
      maxWidth: '500px',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      opacity: '0',
      transform: 'translateX(100%)',
      transition: 'all 0.3s ease-in-out',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
      fontSize: '14px',
      lineHeight: '1.4'
    });

    // Couleurs selon le type
    const colors = {
      success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
      error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' },
      warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' },
      info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' }
    };

    const color = colors[type] || colors.info;
    Object.assign(toast.style, {
      backgroundColor: color.bg,
      border: `1px solid ${color.border}`,
      color: color.text
    });

    // Styles pour le contenu
    const content = toast.querySelector('.toast-content');
    if (content) {
      Object.assign(content.style, {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      });
    }

    // Styles pour l'icône
    const icon = toast.querySelector('.toast-icon');
    if (icon) {
      Object.assign(icon.style, {
        fontSize: '16px',
        flexShrink: '0'
      });
    }

    // Styles pour le message
    const message = toast.querySelector('.toast-message');
    if (message) {
      Object.assign(message.style, {
        flex: '1',
        wordBreak: 'break-word'
      });
    }

    // Styles pour le bouton de fermeture
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
      Object.assign(closeBtn.style, {
        background: 'none',
        border: 'none',
        fontSize: '16px',
        cursor: 'pointer',
        padding: '0',
        marginLeft: '8px',
        opacity: '0.7',
        flexShrink: '0'
      });
      
      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.opacity = '1';
      });
      
      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.opacity = '0.7';
      });
    }

    // Classe pour l'animation visible
    const style = document.createElement('style');
    style.textContent = `
      .toast-visible {
        opacity: 1 !important;
        transform: translateX(0) !important;
      }
    `;
    
    if (!document.querySelector('#toast-styles')) {
      style.id = 'toast-styles';
      document.head.appendChild(style);
    }
  }

  /**
   * Ajouter le toast au conteneur
   * @param {HTMLElement} toast - Élément toast
   */
  static addToContainer(toast) {
    // Créer ou récupérer le conteneur
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      Object.assign(container.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '9999',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none'
      });
      document.body.appendChild(container);
    }

    // Permettre les interactions sur ce toast
    toast.style.pointerEvents = 'auto';

    // Limiter le nombre de notifications
    const existingToasts = container.children;
    if (existingToasts.length >= 5) {
      this.remove(existingToasts[0]);
    }

    container.appendChild(toast);
  }

  /**
   * Supprimer un toast
   * @param {HTMLElement} toast - Élément toast à supprimer
   */
  static remove(toast) {
    if (!toast || !toast.parentNode) return;

    // Animation de sortie
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  /**
   * Supprimer toutes les notifications
   */
  static clearAll() {
    const container = document.getElementById('toast-container');
    if (container) {
      Array.from(container.children).forEach(toast => this.remove(toast));
    }
  }

  /**
   * Afficher les alertes d'expiration de licences
   * @param {Array} licences - Liste des licences
   * @returns {Object} - Statistiques des alertes
   */
  static showExpirationAlerts(licences) {
    if (!licences || !licences.length) return { alerts: 0 };

    const today = new Date();
    let expiredCount = 0;
    let expiringCount = 0;

    licences.forEach(licence => {
      const expirationDate = licence.expirationDate || licence.expiration_date;
      if (!expirationDate) return;

      const expDate = new Date(expirationDate);
      const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
      const softwareName = licence.softwareName || licence.software_name;

      if (diffDays < 0) {
        // Licence expirée
        this.error(`${softwareName} a expiré il y a ${Math.abs(diffDays)} jour(s)`, 0);
        expiredCount++;
      } else if (diffDays <= 30) {
        // Licence expire bientôt
        this.warning(`${softwareName} expire dans ${diffDays} jour(s)`, 0);
        expiringCount++;
      }
    });

    return {
      alerts: expiredCount + expiringCount,
      expired: expiredCount,
      expiring: expiringCount
    };
  }

  /**
   * Notification de confirmation avec callback
   * @param {string} message - Message de confirmation
   * @param {Function} onConfirm - Callback si confirmé
   * @param {Function} onCancel - Callback si annulé (optionnel)
   */
  static confirm(message, onConfirm, onCancel = null) {
    // Utiliser la confirmation native du navigateur pour simplicité
    if (confirm(message)) {
      if (typeof onConfirm === 'function') {
        onConfirm();
      }
    } else {
      if (typeof onCancel === 'function') {
        onCancel();
      }
    }
  }

  /**
   * Notification de progression
   * @param {string} message - Message de base
   * @param {number} progress - Progression (0-100)
   * @returns {HTMLElement} - Élément toast de progression
   */
  static progress(message, progress = 0) {
    const toast = this.show(`${message} (${Math.round(progress)}%)`, 'info', 0);
    
    // Ajouter une barre de progression
    const progressBar = document.createElement('div');
    Object.assign(progressBar.style, {
      width: '100%',
      height: '4px',
      backgroundColor: 'rgba(0,0,0,0.1)',
      borderRadius: '2px',
      marginTop: '8px',
      overflow: 'hidden'
    });
    
    const progressFill = document.createElement('div');
    Object.assign(progressFill.style, {
      width: `${progress}%`,
      height: '100%',
      backgroundColor: '#007bff',
      transition: 'width 0.3s ease',
      borderRadius: '2px'
    });
    
    progressBar.appendChild(progressFill);
    toast.appendChild(progressBar);
    
    // Méthode pour mettre à jour la progression
    toast.updateProgress = (newProgress, newMessage = null) => {
      progressFill.style.width = `${newProgress}%`;
      if (newMessage) {
        const messageSpan = toast.querySelector('.toast-message');
        if (messageSpan) {
          messageSpan.textContent = `${newMessage} (${Math.round(newProgress)}%)`;
        }
      }
      
      if (newProgress >= 100) {
        setTimeout(() => this.remove(toast), 1000);
      }
    };
    
    return toast;
  }
}

// Export global pour compatibilité navigateur
window.NotificationService = NotificationService;