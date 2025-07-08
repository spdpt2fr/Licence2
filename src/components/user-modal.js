/**
 * Composant modal pour la création d'utilisateurs - Application Licence2
 * Taille: ~3KB - Responsabilité unique: gestion création/édition utilisateurs
 */

class UserModalComponent {
  
  constructor() {
    this.authService = null;
    this.modal = null;
    this.form = null;
    this.isEditMode = false;
    this.currentUserId = null;
    this.onSaveCallback = null;
    this.isInitialized = false;
  }

  /**
   * Initialiser le composant
   * @param {AuthService} authService - Service d'authentification
   */
  init(authService) {
    this.authService = authService;
    
    // Créer le modal
    this.createModal();
    this.setupEventListeners();
    
    this.isInitialized = true;
    Helpers.log.success('UserModalComponent initialisé');
  }

  /**
   * Créer le modal utilisateur
   */
  createModal() {
    // Créer le modal s'il n'existe pas
    this.modal = Helpers.dom.get('#userForm');
    if (!this.modal) {
      this.modal = document.createElement('div');
      this.modal.id = 'userForm';
      this.modal.className = 'modal hidden';
      document.body.appendChild(this.modal);
    }

    // HTML du modal
    this.modal.innerHTML = `
      <div class="modal-content">
        <form id="userFormElement">
          <div class="modal-header">
            <h2 id="userFormTitle">Nouvel utilisateur</h2>
            <button type="button" class="modal-close" aria-label="Fermer">✕</button>
          </div>

          <input type="hidden" id="userId" />

          <div class="form-fields">
            <div class="form-group">
              <label for="userLogin">Nom d'utilisateur *</label>
              <input 
                id="userLogin" 
                type="text" 
                required 
                autocomplete="username"
                maxlength="20"
                pattern="[a-zA-Z0-9-_]{3,20}"
                placeholder="3-20 caractères (lettres, chiffres, - ou _)"
                aria-describedby="userLogin-help"
              />
              <small id="userLogin-help" class="field-help">
                Identifiant unique pour la connexion
              </small>
              <div id="userLogin-availability" class="field-status hidden"></div>
            </div>

            <div class="form-group">
              <label for="userPassword">Mot de passe *</label>
              <input 
                id="userPassword" 
                type="password" 
                required 
                autocomplete="new-password"
                minlength="4"
                placeholder="Minimum 4 caractères"
                aria-describedby="userPassword-help"
              />
              <small id="userPassword-help" class="field-help">
                L'utilisateur devra le changer lors de sa première connexion
              </small>
              <button type="button" id="togglePassword" class="password-toggle" title="Afficher/masquer le mot de passe">
                👁️
              </button>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirmer le mot de passe *</label>
              <input 
                id="confirmPassword" 
                type="password" 
                required 
                autocomplete="new-password"
                placeholder="Saisir à nouveau le mot de passe"
                aria-describedby="confirmPassword-help"
              />
              <small id="confirmPassword-help" class="field-help">
                Doit correspondre au mot de passe saisi ci-dessus
              </small>
            </div>

            <div class="form-group">
              <label for="userRole">Rôle *</label>
              <select id="userRole" required aria-describedby="userRole-help">
                <option value="">Sélectionner un rôle</option>
                <option value="read">Lecture - Consultation uniquement</option>
                <option value="write">Écriture - Gestion des licences</option>
                <option value="admin">Administrateur - Accès complet</option>
              </select>
              <small id="userRole-help" class="field-help">
                Détermine les permissions de l'utilisateur
              </small>
            </div>

            <div class="form-group">
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="mustChangePassword" checked />
                  <span class="checkbox-custom"></span>
                  Obliger à changer le mot de passe à la première connexion
                </label>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              <span class="btn-icon">👤</span>
              <span class="btn-text">Créer l'utilisateur</span>
              <span class="btn-loading hidden">Création...</span>
            </button>
            <button type="button" id="cancelUserForm" class="btn btn-secondary">
              <span class="btn-icon">❌</span>
              Annuler
            </button>
          </div>
          
          <div id="userFormError" class="error-message hidden"></div>
        </form>
      </div>
      <div class="modal-overlay"></div>
    `;

    this.form = this.modal.querySelector('#userFormElement');
  }

  /**
   * Configurer les événements
   */
  setupEventListeners() {
    if (!this.form) return;

    // Soumission du formulaire
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Boutons de fermeture
    const cancelBtn = this.modal.querySelector('#cancelUserForm');
    const closeBtn = this.modal.querySelector('.modal-close');
    const overlay = this.modal.querySelector('.modal-overlay');
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.close());
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
    
    if (overlay) {
      overlay.addEventListener('click', () => this.close());
    }

    // Fermeture avec Échap
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !Helpers.dom.hasClass(this.modal, 'hidden')) {
        this.close();
      }
    });

    // Validation en temps réel
    this.setupRealTimeValidation();

    // Affichage/masquage du mot de passe
    const toggleBtn = this.modal.querySelector('#togglePassword');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.togglePasswordVisibility());
    }

    // Vérification de disponibilité du login
    const loginInput = this.modal.querySelector('#userLogin');
    if (loginInput) {
      loginInput.addEventListener('input', Helpers.debounce(() => {
        this.checkLoginAvailability();
      }, 500));
    }
  }

  /**
   * Configurer la validation en temps réel
   */
  setupRealTimeValidation() {
    // Validation du login
    const loginInput = this.modal.querySelector('#userLogin');
    if (loginInput) {
      loginInput.addEventListener('input', () => {
        this.validateLogin();
      });
    }

    // Validation des mots de passe
    const passwordInput = this.modal.querySelector('#userPassword');
    const confirmInput = this.modal.querySelector('#confirmPassword');
    
    if (passwordInput) {
      passwordInput.addEventListener('input', () => {
        this.validatePassword();
        this.validatePasswordMatch();
      });
    }
    
    if (confirmInput) {
      confirmInput.addEventListener('input', () => {
        this.validatePasswordMatch();
      });
    }

    // Validation du rôle
    const roleSelect = this.modal.querySelector('#userRole');
    if (roleSelect) {
      roleSelect.addEventListener('change', () => {
        this.validateRole();
      });
    }
  }

  /**
   * Valider le login
   */
  validateLogin() {
    const loginInput = this.modal.querySelector('#userLogin');
    const value = loginInput.value.trim();
    
    // Effacer l'erreur précédente
    this.clearFieldError(loginInput);
    
    if (!value) {
      this.setFieldError(loginInput, 'Le nom d\'utilisateur est obligatoire');
      return false;
    }
    
    if (!/^[a-zA-Z0-9-_]{3,20}$/.test(value)) {
      this.setFieldError(loginInput, 'Format invalide (3-20 caractères: lettres, chiffres, - ou _)');
      return false;
    }
    
    return true;
  }

  /**
   * Valider le mot de passe
   */
  validatePassword() {
    const passwordInput = this.modal.querySelector('#userPassword');
    const value = passwordInput.value;
    
    this.clearFieldError(passwordInput);
    
    if (!value) {
      this.setFieldError(passwordInput, 'Le mot de passe est obligatoire');
      return false;
    }
    
    if (value.length < 4) {
      this.setFieldError(passwordInput, 'Le mot de passe doit contenir au moins 4 caractères');
      return false;
    }
    
    return true;
  }

  /**
   * Valider la correspondance des mots de passe
   */
  validatePasswordMatch() {
    const passwordInput = this.modal.querySelector('#userPassword');
    const confirmInput = this.modal.querySelector('#confirmPassword');
    
    if (!passwordInput.value || !confirmInput.value) return;
    
    this.clearFieldError(confirmInput);
    
    if (passwordInput.value !== confirmInput.value) {
      this.setFieldError(confirmInput, 'Les mots de passe ne correspondent pas');
      return false;
    }
    
    return true;
  }

  /**
   * Valider le rôle
   */
  validateRole() {
    const roleSelect = this.modal.querySelector('#userRole');
    const value = roleSelect.value;
    
    this.clearFieldError(roleSelect);
    
    if (!value) {
      this.setFieldError(roleSelect, 'Veuillez sélectionner un rôle');
      return false;
    }
    
    return true;
  }

  /**
   * Vérifier la disponibilité du login
   */
  async checkLoginAvailability() {
    const loginInput = this.modal.querySelector('#userLogin');
    const statusDiv = this.modal.querySelector('#userLogin-availability');
    const value = loginInput.value.trim();
    
    if (!value || !this.validateLogin()) {
      Helpers.dom.addClass(statusDiv, 'hidden');
      return;
    }
    
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await this.authService.getUser(value);
      
      if (existingUser && (!this.isEditMode || existingUser.login !== this.currentUserId)) {
        statusDiv.textContent = '❌ Ce nom d\'utilisateur est déjà pris';
        statusDiv.className = 'field-status error';
        Helpers.dom.removeClass(statusDiv, 'hidden');
        return false;
      } else {
        statusDiv.textContent = '✅ Nom d\'utilisateur disponible';
        statusDiv.className = 'field-status success';
        Helpers.dom.removeClass(statusDiv, 'hidden');
        return true;
      }
      
    } catch (error) {
      Helpers.log.error('Erreur vérification login:', error);
      Helpers.dom.addClass(statusDiv, 'hidden');
      return true; // En cas d'erreur, on laisse passer
    }
  }

  /**
   * Basculer la visibilité du mot de passe
   */
  togglePasswordVisibility() {
    const passwordInput = this.modal.querySelector('#userPassword');
    const toggleBtn = this.modal.querySelector('#togglePassword');
    
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      toggleBtn.textContent = '🙈';
      toggleBtn.title = 'Masquer le mot de passe';
    } else {
      passwordInput.type = 'password';
      toggleBtn.textContent = '👁️';
      toggleBtn.title = 'Afficher le mot de passe';
    }
  }

  /**
   * Définir une erreur sur un champ
   * @param {HTMLElement} field - Champ concerné
   * @param {string} message - Message d'erreur
   */
  setFieldError(field, message) {
    Helpers.dom.addClass(field, 'error');
    field.setCustomValidity(message);
    
    // Afficher le message dans le tooltip
    field.title = message;
  }

  /**
   * Effacer l'erreur d'un champ
   * @param {HTMLElement} field - Champ concerné
   */
  clearFieldError(field) {
    Helpers.dom.removeClass(field, 'error');
    field.setCustomValidity('');
    field.title = '';
  }

  /**
   * Ouvrir le modal pour créer un utilisateur
   */
  openForCreate() {
    this.isEditMode = false;
    this.currentUserId = null;
    
    // Titre
    const title = this.modal.querySelector('#userFormTitle');
    if (title) title.textContent = 'Nouvel utilisateur';
    
    // Texte du bouton
    const btnText = this.modal.querySelector('.btn-text');
    if (btnText) btnText.textContent = 'Créer l\'utilisateur';
    
    this.resetForm();
    this.show();
    
    // Focus sur le premier champ
    setTimeout(() => {
      const firstInput = this.modal.querySelector('#userLogin');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  /**
   * Ouvrir le modal pour éditer un utilisateur
   * @param {Object} user - Données utilisateur
   */
  openForEdit(user) {
    this.isEditMode = true;
    this.currentUserId = user.login;
    
    // Titre
    const title = this.modal.querySelector('#userFormTitle');
    if (title) title.textContent = 'Modifier utilisateur';
    
    // Texte du bouton
    const btnText = this.modal.querySelector('.btn-text');
    if (btnText) btnText.textContent = 'Mettre à jour';
    
    // Remplir le formulaire
    this.populateForm(user);
    this.show();
  }

  /**
   * Remplir le formulaire avec les données utilisateur
   * @param {Object} user - Données utilisateur
   */
  populateForm(user) {
    const fields = {
      'userId': user.login,
      'userLogin': user.login,
      'userRole': user.role,
      'mustChangePassword': user.must_change || false
    };
    
    Object.entries(fields).forEach(([fieldId, value]) => {
      const field = this.modal.querySelector(`#${fieldId}`);
      if (field) {
        if (field.type === 'checkbox') {
          field.checked = Boolean(value);
        } else {
          field.value = value || '';
        }
      }
    });
    
    // En mode édition, le login n'est pas modifiable
    const loginInput = this.modal.querySelector('#userLogin');
    if (loginInput) {
      loginInput.readOnly = true;
      Helpers.dom.addClass(loginInput, 'readonly');
    }
    
    // Mot de passe optionnel en édition
    const passwordInput = this.modal.querySelector('#userPassword');
    const confirmInput = this.modal.querySelector('#confirmPassword');
    if (passwordInput && confirmInput) {
      passwordInput.required = false;
      confirmInput.required = false;
      passwordInput.placeholder = 'Laisser vide pour ne pas changer';
      confirmInput.placeholder = 'Laisser vide pour ne pas changer';
    }
  }

  /**
   * Réinitialiser le formulaire
   */
  resetForm() {
    if (this.form) {
      this.form.reset();
      
      // Valeurs par défaut
      const mustChangeCheckbox = this.modal.querySelector('#mustChangePassword');
      if (mustChangeCheckbox) mustChangeCheckbox.checked = true;
      
      // Réinitialiser l'état du login
      const loginInput = this.modal.querySelector('#userLogin');
      if (loginInput) {
        loginInput.readOnly = false;
        Helpers.dom.removeClass(loginInput, 'readonly');
      }
      
      // Réinitialiser les exigences de mot de passe
      const passwordInput = this.modal.querySelector('#userPassword');
      const confirmInput = this.modal.querySelector('#confirmPassword');
      if (passwordInput && confirmInput) {
        passwordInput.required = true;
        confirmInput.required = true;
        passwordInput.placeholder = 'Minimum 4 caractères';
        confirmInput.placeholder = 'Saisir à nouveau le mot de passe';
      }
      
      this.clearErrors();
    }
  }

  /**
   * Afficher le modal
   */
  show() {
    Helpers.dom.removeClass(this.modal, 'hidden');
    document.body.classList.add('modal-open');
  }

  /**
   * Fermer le modal
   */
  close() {
    Helpers.dom.addClass(this.modal, 'hidden');
    document.body.classList.remove('modal-open');
    this.resetForm();
  }

  /**
   * Gérer la soumission du formulaire
   * @param {Event} event - Événement de soumission
   */
  async handleSubmit(event) {
    event.preventDefault();
    
    // Vérifier les permissions
    if (!this.authService.hasPermission('create_user')) {
      NotificationService.error('Vous n\'avez pas les permissions pour gérer les utilisateurs');
      return;
    }
    
    const submitBtn = this.form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    try {
      // État de chargement
      this.setLoadingState(submitBtn, btnText, btnLoading, true);
      this.clearErrors();
      
      // Collecter et valider les données
      const formData = this.collectFormData();
      const validation = await this.validateForm(formData);
      
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      // Créer ou mettre à jour l'utilisateur
      let result;
      if (this.isEditMode) {
        result = await this.authService.updateUser(this.currentUserId, {
          role: formData.role,
          must_change: formData.mustChangePassword,
          ...(formData.password && { password: btoa(formData.password) })
        });
      } else {
        result = await this.authService.createUser(
          formData.login,
          formData.password,
          formData.role
        );
      }
      
      // Succès
      const action = this.isEditMode ? 'mis à jour' : 'créé';
      NotificationService.success(`Utilisateur ${action} avec succès`);
      
      this.close();
      
      // Callback
      if (this.onSaveCallback) {
        this.onSaveCallback(result, this.isEditMode);
      }
      
      // Événement personnalisé
      window.dispatchEvent(new CustomEvent('user:saved', {
        detail: { user: result, isEdit: this.isEditMode }
      }));
      
    } catch (error) {
      Helpers.log.error('Erreur sauvegarde utilisateur:', error);
      this.showError(error.message);
      
    } finally {
      this.setLoadingState(submitBtn, btnText, btnLoading, false);
    }
  }

  /**
   * Collecter les données du formulaire
   * @returns {Object} - Données du formulaire
   */
  collectFormData() {
    return {
      login: this.getFieldValue('userLogin'),
      password: this.getFieldValue('userPassword'),
      confirmPassword: this.getFieldValue('confirmPassword'),
      role: this.getFieldValue('userRole'),
      mustChangePassword: this.modal.querySelector('#mustChangePassword').checked
    };
  }

  /**
   * Valider le formulaire complet
   * @param {Object} data - Données à valider
   * @returns {Object} - Résultat de validation
   */
  async validateForm(data) {
    const errors = [];
    
    // Validation du login
    if (!this.validateLogin()) {
      errors.push('Nom d\'utilisateur invalide');
    }
    
    // Vérification de disponibilité (seulement en création)
    if (!this.isEditMode) {
      const available = await this.checkLoginAvailability();
      if (!available) {
        errors.push('Ce nom d\'utilisateur est déjà pris');
      }
    }
    
    // Validation du mot de passe (obligatoire en création, optionnel en édition)
    if (!this.isEditMode || data.password) {
      if (!this.validatePassword()) {
        errors.push('Mot de passe invalide');
      }
      
      if (!this.validatePasswordMatch()) {
        errors.push('Les mots de passe ne correspondent pas');
      }
    }
    
    // Validation du rôle
    if (!this.validateRole()) {
      errors.push('Rôle requis');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Récupérer la valeur d'un champ
   * @param {string} fieldId - ID du champ
   * @returns {string} - Valeur du champ
   */
  getFieldValue(fieldId) {
    const field = this.modal.querySelector(`#${fieldId}`);
    return field ? field.value.trim() : '';
  }

  /**
   * Définir l'état de chargement
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
   * Afficher une erreur globale
   * @param {string} message - Message d'erreur
   */
  showError(message) {
    const errorDiv = this.modal.querySelector('#userFormError');
    if (errorDiv) {
      errorDiv.textContent = message;
      Helpers.dom.removeClass(errorDiv, 'hidden');
    }
  }

  /**
   * Nettoyer toutes les erreurs
   */
  clearErrors() {
    const errorDiv = this.modal.querySelector('#userFormError');
    if (errorDiv) {
      errorDiv.textContent = '';
      Helpers.dom.addClass(errorDiv, 'hidden');
    }
    
    const errorFields = this.modal.querySelectorAll('.error');
    errorFields.forEach(field => this.clearFieldError(field));
    
    const statusDiv = this.modal.querySelector('#userLogin-availability');
    if (statusDiv) {
      Helpers.dom.addClass(statusDiv, 'hidden');
    }
  }

  /**
   * Définir le callback de sauvegarde
   * @param {Function} callback - Fonction appelée après sauvegarde
   */
  onSave(callback) {
    this.onSaveCallback = callback;
  }

  /**
   * Nettoyer le composant
   */
  destroy() {
    if (this.modal) {
      this.modal.remove();
    }
    
    this.isInitialized = false;
  }
}

// Export global pour compatibilité navigateur
window.UserModalComponent = UserModalComponent;