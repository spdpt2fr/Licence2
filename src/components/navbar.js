logoutBtn) {
      this.logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    // Menu utilisateur
    const userMenuBtn = this.header.querySelector('#userMenuBtn');
    if (userMenuBtn) {
      userMenuBtn.addEventListener('click', () => this.showUserMenu());
    }

    // Clic sur le statut pour actualiser
    if (this.statusElement) {
      this.statusElement.addEventListener('click', () => this.refreshStatus());
    }

    // Événements personnalisés
    window.addEventListener('auth:loginSuccess', () => this.updateUserDisplay());
    window.addEventListener('licence:saved', () => this.updateStatus());
    window.addEventListener('user:saved', () => this.updateUserDisplay());

    // Détection de changement de connectivité
    window.addEventListener('online', () => this.handleConnectionChange(true));
    window.addEventListener('offline', () => this.handleConnectionChange(false));
  }

  /**
   * Démarrer les mises à jour automatiques
   */
  startAutoUpdates() {
    // Mise à jour du statut toutes les 30 secondes
    this.statusUpdateInterval = setInterval(() => {
      this.updateStatus();
    }, 30000);

    // Mise à jour des alertes toutes les 5 minutes
    this.alertsUpdateInterval = setInterval(() => {
      this.updateAlerts();
    }, 300000);
  }

  /**
   * Arrêter les mises à jour automatiques
   */
  stopAutoUpdates() {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = null;
    }

    if (this.alertsUpdateInterval) {
      clearInterval(this.alertsUpdateInterval);
      this.alertsUpdateInterval = null;
    }
  }

  /**
   * Mettre à jour l'affichage utilisateur
   */
  updateUserDisplay() {
    if (!this.authService.isAuthenticated()) {
      this.hideUserInfo();
      return;
    }

    const user = this.authService.getCurrentUser();
    if (!user) return;

    // Afficher les informations utilisateur
    const userName = this.userDisplay.querySelector('.user-name');
    const userRole = this.userDisplay.querySelector('.user-role');
    
    if (userName) {
      userName.textContent = user.login;
    }
    
    if (userRole) {
      const roleDisplay = this.authService.getRoleDisplayName(user.role);
      userRole.textContent = `(${roleDisplay})`;
      userRole.className = `user-role role-${user.role}`;
    }

    // Afficher les éléments
    Helpers.dom.removeClass(this.userDisplay, 'hidden');
    Helpers.dom.removeClass(this.logoutBtn, 'hidden');
    
    const userMenuBtn = this.header.querySelector('#userMenuBtn');
    if (userMenuBtn) {
      Helpers.dom.removeClass(userMenuBtn, 'hidden');
    }

    // Mettre à jour les permissions d'affichage
    this.updatePermissionsDisplay();
  }

  /**
   * Masquer les informations utilisateur
   */
  hideUserInfo() {
    Helpers.dom.addClass(this.userDisplay, 'hidden');
    Helpers.dom.addClass(this.logoutBtn, 'hidden');
    
    const userMenuBtn = this.header.querySelector('#userMenuBtn');
    if (userMenuBtn) {
      Helpers.dom.addClass(userMenuBtn, 'hidden');
    }
  }

  /**
   * Mettre à jour l'affichage selon les permissions
   */
  updatePermissionsDisplay() {
    // Cette méthode peut être étendue pour contrôler l'affichage
    // selon les permissions de l'utilisateur connecté
    const hasAdminRights = this.authService.hasPermission('admin');
    
    // Exemple: afficher un indicateur pour les admins
    const userRole = this.userDisplay.querySelector('.user-role');
    if (userRole && hasAdminRights) {
      Helpers.dom.addClass(userRole, 'admin-badge');
    }
  }

  /**
   * Mettre à jour le statut de l'application
   */
  async updateStatus() {
    if (!this.licenceService) return;

    try {
      const status = this.licenceService.getStatus();
      const indicator = this.statusElement.querySelector('.status-indicator');
      const textElement = this.statusElement.querySelector('.status-text');
      const detailsElement = this.statusElement.querySelector('.status-details');
      
      // Indicateur de connexion
      if (indicator) {
        indicator.className = `status-indicator ${status.online ? 'online' : 'offline'}`;
      }
      
      // Texte principal
      if (textElement) {
        textElement.textContent = status.online ? 'En ligne' : 'Hors ligne';
      }
      
      // Détails
      if (detailsElement) {
        detailsElement.textContent = `${status.licencesCount} licence(s)`;
      }
      
      // Tooltip avec plus d'informations
      this.statusElement.title = `Mode: ${status.mode}\nLicences: ${status.licencesCount}\nDernière mise à jour: ${new Date().toLocaleTimeString()}`;
      
    } catch (error) {
      Helpers.log.error('Erreur mise à jour statut:', error);
      this.setStatusError();
    }
  }

  /**
   * Définir un état d'erreur pour le statut
   */
  setStatusError() {
    const indicator = this.statusElement.querySelector('.status-indicator');
    const textElement = this.statusElement.querySelector('.status-text');
    
    if (indicator) {
      indicator.className = 'status-indicator error';
    }
    
    if (textElement) {
      textElement.textContent = 'Erreur';
    }
  }

  /**
   * Mettre à jour les alertes d'expiration
   */
  async updateAlerts() {
    if (!this.licenceService || !this.alertsContainer) return;

    try {
      // Récupérer les licences
      const result = await this.licenceService.getAll();
      if (!result.success) return;

      const licences = result.data;
      
      // Effacer les alertes existantes
      this.alertsContainer.innerHTML = '';
      
      // Générer les alertes d'expiration
      const alertStats = NotificationService.showExpirationAlerts(licences);
      
      // Afficher un résumé si il y a des alertes
      if (alertStats.alerts > 0) {
        this.showAlertSummary(alertStats);
      }
      
    } catch (error) {
      Helpers.log.error('Erreur mise à jour alertes:', error);
    }
  }

  /**
   * Afficher un résumé des alertes dans le header
   * @param {Object} stats - Statistiques des alertes
   */
  showAlertSummary(stats) {
    const alertBadge = document.createElement('div');
    alertBadge.className = 'alert-badge';
    alertBadge.innerHTML = `
      <span class="alert-icon">⚠️</span>
      <span class="alert-count">${stats.alerts}</span>
    `;
    alertBadge.title = `${stats.expired} expirée(s), ${stats.expiring} expire(nt) bientôt`;
    
    // Ajouter au header
    const headerCenter = this.header.querySelector('.header-center');
    if (headerCenter) {
      // Supprimer l'ancien badge s'il existe
      const oldBadge = headerCenter.querySelector('.alert-badge');
      if (oldBadge) {
        oldBadge.remove();
      }
      
      headerCenter.appendChild(alertBadge);
    }
  }

  /**
   * Actualiser le statut manuellement
   */
  async refreshStatus() {
    const textElement = this.statusElement.querySelector('.status-text');
    const originalText = textElement.textContent;
    
    // Afficher un indicateur de chargement
    textElement.textContent = 'Actualisation...';
    
    try {
      await this.updateStatus();
      await this.updateAlerts();
      
      // Animation de feedback
      this.statusElement.classList.add('refreshed');
      setTimeout(() => {
        this.statusElement.classList.remove('refreshed');
      }, 1000);
      
    } catch (error) {
      textElement.textContent = originalText;
      NotificationService.error('Erreur lors de l\'actualisation');
    }
  }

  /**
   * Gérer le changement de connectivité
   * @param {boolean} isOnline - État de connexion
   */
  handleConnectionChange(isOnline) {
    if (isOnline) {
      NotificationService.success('Connexion rétablie');
      this.refreshStatus();
    } else {
      NotificationService.warning('Connexion perdue - Mode hors ligne activé');
    }
  }

  /**
   * Gérer la déconnexion
   */
  handleLogout() {
    const confirmed = confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
    if (!confirmed) return;

    try {
      this.authService.logout();
      this.hideUserInfo();
      
      // Arrêter les mises à jour
      this.stopAutoUpdates();
      
      // Recharger la page
      window.location.reload();
      
    } catch (error) {
      Helpers.log.error('Erreur déconnexion:', error);
      NotificationService.error('Erreur lors de la déconnexion');
    }
  }

  /**
   * Afficher le menu utilisateur
   */
  showUserMenu() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    // Menu contextuel simple (pourrait être amélioré avec une vraie modal)
    const menuItems = [
      'Profil utilisateur',
      'Préférences',
      '---',
      'À propos'
    ];

    // Pour l'instant, utiliser un alert simple
    const menu = menuItems.join('\n');
    alert(`Menu utilisateur:\n\n${menu}\n\n(Fonctionnalité à implémenter)`);
  }

  /**
   * Définir un statut personnalisé
   * @param {string} message - Message de statut
   * @param {string} type - Type de statut (online, offline, error, loading)
   */
  setCustomStatus(message, type = 'info') {
    const indicator = this.statusElement.querySelector('.status-indicator');
    const textElement = this.statusElement.querySelector('.status-text');
    
    if (indicator) {
      indicator.className = `status-indicator ${type}`;
    }
    
    if (textElement) {
      textElement.textContent = message;
    }
  }

  /**
   * Ajouter une alerte personnalisée
   * @param {string} message - Message d'alerte
   * @param {string} type - Type d'alerte (danger, warning, success, info)
   */
  addCustomAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
      <span class="alert-icon">${this.getAlertIcon(type)}</span>
      <span class="alert-message">${message}</span>
      <button class="alert-close" onclick="this.parentElement.remove()">✕</button>
    `;
    
    this.alertsContainer.appendChild(alertDiv);
  }

  /**
   * Obtenir l'icône selon le type d'alerte
   * @param {string} type - Type d'alerte
   * @returns {string} - Icône unicode
   */
  getAlertIcon(type) {
    const icons = {
      danger: '🔴',
      warning: '🟡',
      success: '🟢',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  /**
   * Effacer toutes les alertes
   */
  clearAlerts() {
    if (this.alertsContainer) {
      this.alertsContainer.innerHTML = '';
    }
    
    // Supprimer le badge d'alerte du header
    const alertBadge = this.header.querySelector('.alert-badge');
    if (alertBadge) {
      alertBadge.remove();
    }
  }

  /**
   * Obtenir les statistiques d'affichage
   * @returns {Object} - Statistiques du composant
   */
  getStats() {
    return {
      isAuthenticated: this.authService?.isAuthenticated() || false,
      currentUser: this.authService?.getCurrentUser() || null,
      statusVisible: !Helpers.dom.hasClass(this.statusElement, 'hidden'),
      alertsCount: this.alertsContainer?.children.length || 0,
      autoUpdatesActive: !!this.statusUpdateInterval
    };
  }

  /**
   * Basculer la visibilité des alertes
   */
  toggleAlerts() {
    if (this.alertsContainer) {
      Helpers.dom.toggleClass(this.alertsContainer, 'collapsed');
    }
  }

  /**
   * Mettre en évidence temporairement un élément
   * @param {string} element - Élément à mettre en évidence ('status', 'user', 'alerts')
   */
  highlight(element) {
    let targetElement;
    
    switch (element) {
      case 'status':
        targetElement = this.statusElement;
        break;
      case 'user':
        targetElement = this.userDisplay;
        break;
      case 'alerts':
        targetElement = this.alertsContainer;
        break;
      default:
        return;
    }
    
    if (targetElement) {
      targetElement.classList.add('highlighted');
      setTimeout(() => {
        targetElement.classList.remove('highlighted');
      }, 2000);
    }
  }

  /**
   * Redimensionner de manière responsive
   */
  handleResize() {
    // Adaptation pour mobile/tablet
    if (Helpers.isMobile()) {
      this.header.classList.add('mobile-layout');
    } else {
      this.header.classList.remove('mobile-layout');
    }
  }

  /**
   * Nettoyer le composant
   */
  destroy() {
    this.stopAutoUpdates();
    
    if (this.header) {
      this.header.remove();
    }
    
    if (this.alertsContainer) {
      this.alertsContainer.remove();
    }
    
    this.isInitialized = false;
  }
}

// Export global pour compatibilité navigateur
window.NavbarComponent = NavbarComponent;