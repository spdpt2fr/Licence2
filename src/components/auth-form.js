/**
 * Composant de formulaire d'authentification pour l'application Licence2
 * Taille: ~3KB - Responsabilité unique: gestion connexion et changement mot de passe
 */

class AuthFormComponent {
  
  constructor() {
    this.authService = null;
    this.loginForm = null;
    this.passwordForm = null;
    this.loginPage = null;
    this.passwordPage = null;
    this.isInitialized = false;
  }

  /**
   * Initialiser le composant d'authentification
   * @param {AuthService} authService - Instance du service d'authentification
   */
  async init(authService) {
    this.authService = authService;
    
    // Créer les éléments DOM
    this.createLoginPage();
    this.createPasswordPage();
    
    // Configurer les événements
    this.setupEventListeners();
    
    // Vérifier l'état initial
    this.checkAuthState();
    
    this.isInitialized = true;
    Helpers.log.success('AuthFormComponent initialisé');
  }

  /**
   * Créer la page de connexion
   */
  createLoginPage() {
    // Créer la page de connexion si elle n'existe pas
    this.loginPage = Helpers.dom.get('#loginPage');
    if (!this.loginPage) {
      this.loginPage = document.createElement('div');
      this.loginPage.id = 'loginPage';
      this.loginPage.className = 'login-page hidden';
      document.body.appendChild(this.loginPage);
    }

    // HTML du formulaire de connexion
    this.loginPage.innerHTML = `
      <form id="loginForm" class="login-form">
        <h2>Connexion</h2>
        <div class="form-group">
          <input 
            id="loginUser" 
            type="text" 
            placeholder="Login" 
            required 
            autocomplete="username"
            aria-label="Nom d'utilisateur"
          />
        </div>
        <div class="form-group">
          <input
            id="loginPass"
            type="password"
            placeholder="Mot de passe"
            required
            autocomplete="current-password"
            aria-label="Mot de passe"
          />
        </div>
        <button type="submit" class="btn btn-primary">
          <span class="btn-text">Se connecter</span>
          <span class="btn-loading hidden">Connexion...</span>
        </button>
        <p class="login-hint">
          Identifiants par défaut : <strong>Admin/Admin</strong>
        </p>
        <div id="loginError" class="error-message hidden"></div>
      </form>
    `;

    this.loginForm = this.loginPage.querySelector('#loginForm');
  }

  /**
   * Créer la page de changement de mot de passe
   */
  createPasswordPage() {
    // Créer la page de changement de mot de passe si elle n'existe pas
    this.passwordPage = Helpers.dom.get('#passwordPage');
    if (!this.passwordPage) {
      this.passwordPage = document.createElement('div');
      this.passwordPage.id = 'passwordPage';
      this.passwordPage.className = 'login-page hidden';
      document.body.appendChild(this.passwordPage);
    }

    // HTML du formulaire de changement de mot de passe
    this.passwordPage.innerHTML = `
      <form id="passwordForm" class="login-form">
        <h2>Nouveau mot de passe</h2>
        <p class="password-info">
          Vous devez changer votre mot de passe lors de votre première connexion.
        </p>
        <div class="form-group">
          <input
            id="newPass"
            type="password"
            placeholder="Nouveau mot de passe"
            required
            minlength="4"
            autocomplete="new-password"
            aria-label="Nouveau mot de passe"
          />
          <small class="field-help">Minimum 4 caractères</small>
        </div>
        <div class="form-group">
          <input
            id="confirmPass"
            type="password"
            placeholder="Confirmer le mot de passe"
            required
            autocomplete="new-password"
            aria-label="Confirmer le mot de passe"
          />
        </div>
        <button type="submit" class="btn btn-primary">
          <span class="btn-text">Enregistrer</span>
          <span class="btn-loading hidden">Enregistrement...</span>
        </button>
        <div id="passwordError" class="error-message hidden"></div>
      </form>
    `;

    this.passwordForm = this.passwordPage.querySelector('#passwordForm');
  }

  /**
   * Configurer les événements
   */
  setupEventListeners() {
    // Événement de soumission du formulaire de connexion
    if (this.loginForm) {
      this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Événement de soumission du formulaire de mot de passe
    if (this.passwordForm) {
      this.passwordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
    }

    // Validation en temps réel du mot de passe
    const newPassInput = Helpers.dom.get('#newPass');
    const confirmPassInput = Helpers.dom.get('#confirmPass');
    
    if (confirmPassInput) {
      confirmPassInput.addEventListener('input', () => {
        this.validatePasswordMatch();
      });
    }

    // Touche Entrée pour passer au champ suivant
    if (newPassInput && confirmPassInput) {
      newPassInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          confirmPassInput.focus();
        }
      });
    }
  }

  /**
   * Gérer la connexion
   * @param {Event} event - Événement de soumission
   */
  async handleLogin(event) {
    event.preventDefault();
    
    const submitBtn = this.loginForm.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    const errorDiv = Helpers.dom.get('#loginError');
    
    try {
      // Afficher l'état de chargement
      this.setLoadingState(submitBtn, btnText, btnLoading, true);
      this.hideError(errorDiv);
      
      // Récupérer les valeurs
      const username = Helpers.dom.get('#loginUser').value.trim();
      const password = Helpers.dom.get('#loginPass').value;
      
      // Validation côté client
      if (!username || !password) {
        throw new Error('Veuillez saisir un nom d\'utilisateur et un mot de passe');
      }
      
      // Tentative de connexion
      await this.authService.login(username, password);
      
      // Succès - vérifier si changement de mot de passe requis
      if (this.authService.mustChangePassword()) {
        this.showPasswordPage();
        NotificationService.info('Veuillez changer votre mot de passe');
      } else {
        this.onLoginSuccess();
      }
      
    } catch (error) {
      Helpers.log.error('Erreur de connexion:', error);
      this.showError(errorDiv, error.message);
      
    } finally {
      this.setLoadingState(submitBtn, btnText, btnLoading, false);
    }
  }

  /**
   * Gérer le changement de mot de passe
   * @param {Event} event - Événement de soumission
   */
  async handlePasswordChange(event) {
    event.preventDefault();
    
    const submitBtn = this.passwordForm.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    const errorDiv = Helpers.dom.get('#passwordError');
    
    try {
      // Afficher l'état de chargement
      this.setLoadingState(submitBtn, btnText, btnLoading, true);
      this.hideError(errorDiv);
      
      // Récupérer les valeurs
      const newPassword = Helpers.dom.get('#newPass').value;
      const confirmPassword = Helpers.dom.get('#confirmPass').value;
      
      // Validation
      const validation = this.validatePasswordForm(newPassword, confirmPassword);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      // Changer le mot de passe
      await this.authService.changePassword(newPassword);
      
      // Succès
      NotificationService.success('Mot de passe changé avec succès');
      this.onLoginSuccess();
      
    } catch (error) {
      Helpers.log.error('Erreur changement mot de passe:', error);
      this.showError(errorDiv, error.message);
      
    } finally {
      this.setLoadingState(submitBtn, btnText, btnLoading, false);
    }
  }

  /**
   * Valider le formulaire de mot de passe
   * @param {string} newPassword - Nouveau mot de passe
   * @param {string} confirmPassword - Confirmation du mot de passe
   * @returns {Object} - Résultat de validation
   */
  validatePasswordForm(newPassword, confirmPassword) {
    const errors = [];
    
    if (!newPassword) {
      errors.push('Le nouveau mot de passe est obligatoire');
    } else if (newPassword.length < 4) {
      errors.push('Le mot de passe doit contenir au moins 4 caractères');
    }
    
    if (!confirmPassword) {
      errors.push('La confirmation du mot de passe est obligatoire');
    }
    
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errors.push('Les mots de passe ne correspondent pas');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valider la correspondance des mots de passe en temps réel
   */
  validatePasswordMatch() {
    const newPass = Helpers.dom.get('#newPass');
    const confirmPass = Helpers.dom.get('#confirmPass');
    
    if (!newPass || !confirmPass) return;
    
    if (confirmPass.value && newPass.value !== confirmPass.value) {
      confirmPass.setCustomValidity('Les mots de passe ne correspondent pas');
      Helpers.dom.addClass(confirmPass, 'error');
    } else {
      confirmPass.setCustomValidity('');
      Helpers.dom.removeClass(confirmPass, 'error');
    }
  }

  /**
   * Définir l'état de chargement d'un bouton
   */
  setLoadingState(button, textSpan, loadingSpan, isLoading) {
    if (isLoading) {
      button.disabled = true;
      Helpers.dom.addClass(textSpan, 'hidden');
      Helpers.dom.removeClass(loadingSpan, 'hidden');
    } else {
      button.disabled = false;
      Helpers.dom.removeClass(textSpan, 'hidden');
      Helpers.dom.addClass(loadingSpan, 'hidden');
    }
  }

  /**
   * Afficher une erreur
   */
  showError(errorElement, message) {
    if (errorElement) {
      errorElement.textContent = message;
      Helpers.dom.removeClass(errorElement, 'hidden');
    }
  }

  /**
   * Masquer une erreur
   */
  hideError(errorElement) {
    if (errorElement) {
      errorElement.textContent = '';
      Helpers.dom.addClass(errorElement, 'hidden');
    }
  }

  /**
   * Afficher la page de connexion
   */
  showLoginPage() {
    this.hideAllPages();
    Helpers.dom.removeClass(this.loginPage, 'hidden');
    
    // Focus sur le champ utilisateur
    setTimeout(() => {
      const userInput = Helpers.dom.get('#loginUser');
      if (userInput) userInput.focus();
    }, 100);
  }

  /**
   * Afficher la page de changement de mot de passe
   */
  showPasswordPage() {
    this.hideAllPages();
    Helpers.dom.removeClass(this.passwordPage, 'hidden');
    
    // Focus sur le champ nouveau mot de passe
    setTimeout(() => {
      const newPassInput = Helpers.dom.get('#newPass');
      if (newPassInput) newPassInput.focus();
    }, 100);
  }

  /**
   * Masquer toutes les pages d'authentification
   */
  hideAllPages() {
    Helpers.dom.addClass(this.loginPage, 'hidden');
    Helpers.dom.addClass(this.passwordPage, 'hidden');
  }

  /**
   * Vérifier l'état d'authentification
   */
  checkAuthState() {
    if (!this.authService) return;
    
    if (this.authService.isAuthenticated()) {
      if (this.authService.mustChangePassword()) {
        this.showPasswordPage();
      } else {
        this.hideAllPages();
      }
    } else {
      this.showLoginPage();
    }
  }

  /**
   * Callback lors du succès de connexion
   */
  onLoginSuccess() {
    this.hideAllPages();
    
    // Réinitialiser les formulaires
    if (this.loginForm) this.loginForm.reset();
    if (this.passwordForm) this.passwordForm.reset();
    
    // Déclencher l'événement personnalisé
    window.dispatchEvent(new CustomEvent('auth:loginSuccess', {
      detail: { user: this.authService.getCurrentUser() }
    }));
  }

  /**
   * Réinitialiser les formulaires
   */
  reset() {
    if (this.loginForm) {
      this.loginForm.reset();
      this.hideError(Helpers.dom.get('#loginError'));
    }
    
    if (this.passwordForm) {
      this.passwordForm.reset();
      this.hideError(Helpers.dom.get('#passwordError'));
    }
  }

  /**
   * Nettoyer le composant
   */
  destroy() {
    if (this.loginPage) {
      this.loginPage.remove();
    }
    
    if (this.passwordPage) {
      this.passwordPage.remove();
    }
    
    this.isInitialized = false;
  }
}

// Export global pour compatibilité navigateur
window.AuthFormComponent = AuthFormComponent;