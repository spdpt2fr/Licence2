.classList.add('modal-open');
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
    
    const submitBtn = this.form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    try {
      // Afficher l'état de chargement
      this.setLoadingState(submitBtn, btnText, btnLoading, true);
      this.clearErrors();
      
      // Collecter les données du formulaire
      const formData = this.collectFormData();
      
      // Validation côté client
      const validation = Validators.validateLicence(formData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      // Sauvegarder
      let result;
      if (this.isEditMode) {
        result = await this.licenceService.update(this.currentLicenceId, formData);
      } else {
        result = await this.licenceService.create(formData);
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la sauvegarde');
      }
      
      // Succès
      const action = this.isEditMode ? 'mise à jour' : 'création';
      NotificationService.success(`Licence ${action} avec succès`);
      
      // Fermer le modal
      this.close();
      
      // Callback de succès
      if (this.onSaveCallback) {
        this.onSaveCallback(result.data, this.isEditMode);
      }
      
      // Événement personnalisé
      window.dispatchEvent(new CustomEvent('licence:saved', {
        detail: { 
          licence: result.data, 
          isEdit: this.isEditMode 
        }
      }));
      
    } catch (error) {
      Helpers.log.error('Erreur sauvegarde licence:', error);
      this.showError(error.message);
      
    } finally {
      this.setLoadingState(submitBtn, btnText, btnLoading, false);
    }
  }

  /**
   * Collecter les données du formulaire
   * @returns {Object} - Données de la licence
   */
  collectFormData() {
    return {
      softwareName: Validators.sanitizeString(this.getFieldValue('softwareName'), 100),
      vendor: Validators.sanitizeString(this.getFieldValue('vendor'), 50),
      version: Validators.sanitizeString(this.getFieldValue('version'), 20),
      type: this.getFieldValue('type') || 'perpetuelle',
      seats: parseInt(this.getFieldValue('seats'), 10) || 1,
      purchaseDate: this.getFieldValue('purchaseDate'),
      expirationDate: this.getFieldValue('expirationDate'),
      initialCost: parseFloat(this.getFieldValue('initialCost')) || 0,
      assignedTo: Validators.sanitizeString(this.getFieldValue('assignedTo'), 100)
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
   * Afficher une erreur
   * @param {string} message - Message d'erreur
   */
  showError(message) {
    const errorDiv = this.modal.querySelector('#formError');
    if (errorDiv) {
      errorDiv.textContent = message;
      Helpers.dom.removeClass(errorDiv, 'hidden');
      
      // Scroll vers l'erreur
      errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * Nettoyer les erreurs
   */
  clearErrors() {
    const errorDiv = this.modal.querySelector('#formError');
    if (errorDiv) {
      errorDiv.textContent = '';
      Helpers.dom.addClass(errorDiv, 'hidden');
    }
    
    // Nettoyer les erreurs de validation des champs
    const errorFields = this.modal.querySelectorAll('.error');
    errorFields.forEach(field => {
      Helpers.dom.removeClass(field, 'error');
      field.setCustomValidity('');
    });
  }

  /**
   * Définir le callback de sauvegarde
   * @param {Function} callback - Fonction appelée après sauvegarde
   */
  onSave(callback) {
    this.onSaveCallback = callback;
  }

  /**
   * Valider le formulaire en temps réel
   */
  validateRealTime() {
    // Validation des champs obligatoires
    const requiredFields = ['softwareName', 'vendor', 'version', 'purchaseDate', 'expirationDate', 'initialCost'];
    
    requiredFields.forEach(fieldId => {
      const field = this.modal.querySelector(`#${fieldId}`);
      if (field) {
        field.addEventListener('blur', () => {
          if (!field.value.trim()) {
            Helpers.dom.addClass(field, 'error');
            field.setCustomValidity('Ce champ est obligatoire');
          } else {
            Helpers.dom.removeClass(field, 'error');
            field.setCustomValidity('');
          }
        });
        
        field.addEventListener('input', () => {
          if (field.value.trim()) {
            Helpers.dom.removeClass(field, 'error');
            field.setCustomValidity('');
          }
        });
      }
    });
    
    // Validation spécifique du nombre de sièges
    const seatsField = this.modal.querySelector('#seats');
    if (seatsField) {
      seatsField.addEventListener('input', () => {
        const value = parseInt(seatsField.value, 10);
        if (isNaN(value) || value < 1) {
          Helpers.dom.addClass(seatsField, 'error');
          seatsField.setCustomValidity('Le nombre de sièges doit être au moins 1');
        } else {
          Helpers.dom.removeClass(seatsField, 'error');
          seatsField.setCustomValidity('');
        }
      });
    }
    
    // Validation du coût
    const costField = this.modal.querySelector('#initialCost');
    if (costField) {
      costField.addEventListener('input', () => {
        const value = parseFloat(costField.value);
        if (isNaN(value) || value < 0) {
          Helpers.dom.addClass(costField, 'error');
          costField.setCustomValidity('Le coût ne peut pas être négatif');
        } else {
          Helpers.dom.removeClass(costField, 'error');
          costField.setCustomValidity('');
        }
      });
    }
  }

  /**
   * Pré-remplir certains champs selon le contexte
   * @param {Object} defaults - Valeurs par défaut
   */
  setDefaults(defaults = {}) {
    if (!defaults) return;
    
    Object.entries(defaults).forEach(([fieldId, value]) => {
      const field = this.modal.querySelector(`#${fieldId}`);
      if (field && !field.value) {
        field.value = value;
      }
    });
  }

  /**
   * Obtenir les données actuelles du formulaire
   * @returns {Object} - Données actuelles
   */
  getCurrentData() {
    if (!this.form) return null;
    
    return this.collectFormData();
  }

  /**
   * Vérifier si le formulaire a été modifié
   * @returns {boolean} - True si modifié
   */
  isDirty() {
    if (!this.form) return false;
    
    // Comparer avec les données initiales (fonctionnalité future)
    const currentData = this.collectFormData();
    return Object.values(currentData).some(value => value !== '');
  }

  /**
   * Activer la validation en temps réel
   */
  enableRealTimeValidation() {
    this.validateRealTime();
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
window.LicenceFormComponent = LicenceFormComponent;