/**
 * Service de gestion des licences pour l'application Licence2
 * Taille: ~4KB - Responsabilité unique: CRUD licences avec Supabase/offline
 */

class LicenceService {
  constructor() {
    this.supabase = null;
    this.fallbackData = [];
    this.useOfflineMode = false;
    this.lastLicencesCount = 0;
  }

  /**
   * Initialiser le service
   */
  async init() {
    try {
      if (typeof window.initSupabase === 'function') {
        const initialized = await window.initSupabase();
        if (initialized && window.supabaseClient) {
          this.supabase = window.supabaseClient;
          Helpers.log.success('Service Licences connecté à Supabase');
          return true;
        }
      }
      
      Helpers.log.warn('Supabase non disponible, mode hors ligne activé');
      this.useOfflineMode = true;
      return false;
    } catch (error) {
      Helpers.log.error('Erreur initialisation service:', error);
      this.useOfflineMode = true;
      return false;
    }
  }

  /**
   * Créer une nouvelle licence
   * @param {Object} licenceData - Données de la licence
   * @returns {Object} - Résultat de l'opération
   */
  async create(licenceData) {
    try {
      // Validation des données
      const validation = Validators.validateLicence(licenceData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      // Préparer les données pour Supabase (format snake_case)
      const dbData = {
        software_name: Validators.sanitizeString(licenceData.softwareName, 100),
        vendor: Validators.sanitizeString(licenceData.vendor, 50),
        version: Validators.sanitizeString(licenceData.version, 20),
        type: licenceData.type || 'perpetuelle',
        seats: licenceData.seats || 1,
        purchase_date: licenceData.purchaseDate,
        expiration_date: licenceData.expirationDate,
        initial_cost: licenceData.initialCost || 0,
        assigned_to: Validators.sanitizeString(licenceData.assignedTo, 100) || null
      };

      if (this.useOfflineMode) {
        // Mode hors ligne - ajouter un ID généré
        const offlineData = {
          id: Helpers.generateId(),
          ...dbData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        this.fallbackData.push(offlineData);
        this.lastLicencesCount = this.fallbackData.length;
        Helpers.log.info('Licence sauvegardée en mode hors ligne');
        return { success: true, data: offlineData };
      }

      // Mode Supabase - ID auto-généré
      const { data, error } = await this.supabase
        .from(APP_CONFIG.tableName)
        .insert([dbData])
        .select();

      if (error) throw error;

      Helpers.log.success('Licence créée dans Supabase');
      return { success: true, data: data[0] };

    } catch (error) {
      Helpers.log.error('Erreur création licence:', error);
      
      // Fallback vers mode hors ligne
      const fallbackData = {
        id: Helpers.generateId(),
        software_name: licenceData.softwareName,
        vendor: licenceData.vendor,
        version: licenceData.version,
        type: licenceData.type || 'perpetuelle',
        seats: licenceData.seats || 1,
        purchase_date: licenceData.purchaseDate,
        expiration_date: licenceData.expirationDate,
        initial_cost: licenceData.initialCost || 0,
        assigned_to: licenceData.assignedTo || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      this.fallbackData.push(fallbackData);
      this.lastLicencesCount = this.fallbackData.length;
      Helpers.log.info('Licence sauvegardée en mode fallback');
      return { success: true, data: fallbackData, fallback: true };
    }
  }

  /**
   * Récupérer toutes les licences
   * @returns {Object} - Résultat avec les licences
   */
  async getAll() {
    try {
      if (this.useOfflineMode) {
        Helpers.log.info('Chargement depuis mode hors ligne');
        this.lastLicencesCount = this.fallbackData.length;
        return { success: true, data: this.fallbackData };
      }

      const { data, error } = await this.supabase
        .from(APP_CONFIG.tableName)
        .select('*')
        .order('software_name');

      if (error) throw error;

      this.lastLicencesCount = data.length;
      Helpers.log.success(`${data.length} licences chargées depuis Supabase`);
      return { success: true, data: data };

    } catch (error) {
      Helpers.log.error('Erreur chargement licences:', error);
      Helpers.log.info('Fallback vers données hors ligne');
      this.lastLicencesCount = this.fallbackData.length;
      return { success: true, data: this.fallbackData, fallback: true };
    }
  }

  /**
   * Récupérer une licence par ID
   * @param {string|number} id - ID de la licence
   * @returns {Object} - Licence trouvée
   */
  async getById(id) {
    try {
      if (this.useOfflineMode) {
        const licence = this.fallbackData.find(l => String(l.id) === String(id));
        return licence ? { success: true, data: licence } : { success: false, error: 'Licence non trouvée' };
      }

      const { data, error } = await this.supabase
        .from(APP_CONFIG.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return { success: true, data: data };

    } catch (error) {
      Helpers.log.error('Erreur récupération licence:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mettre à jour une licence
   * @param {string|number} id - ID de la licence
   * @param {Object} licenceData - Nouvelles données
   * @returns {Object} - Résultat de l'opération
   */  async update(id, licenceData) {
    try {
      // Validation des données
      const validation = Validators.validateLicence(licenceData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      const updateData = {
        software_name: Validators.sanitizeString(licenceData.softwareName, 100),
        vendor: Validators.sanitizeString(licenceData.vendor, 50),
        version: Validators.sanitizeString(licenceData.version, 20),
        type: licenceData.type || 'perpetuelle',
        seats: licenceData.seats || 1,
        purchase_date: licenceData.purchaseDate,
        expiration_date: licenceData.expirationDate,
        initial_cost: licenceData.initialCost || 0,
        assigned_to: Validators.sanitizeString(licenceData.assignedTo, 100) || null,
        updated_at: new Date().toISOString()
      };

      if (this.useOfflineMode) {
        // Mode hors ligne
        const index = this.fallbackData.findIndex(l => String(l.id) === String(id));
        if (index !== -1) {
          this.fallbackData[index] = { ...this.fallbackData[index], ...updateData };
          Helpers.log.info('Licence mise à jour en mode hors ligne');
          return { success: true, data: this.fallbackData[index] };
        } else {
          throw new Error('Licence non trouvée');
        }
      }

      // Mode Supabase
      const { data, error } = await this.supabase
        .from(APP_CONFIG.tableName)
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) throw error;

      if (data.length === 0) {
        throw new Error('Licence non trouvée');
      }

      Helpers.log.success('Licence mise à jour dans Supabase');
      return { success: true, data: data[0] };

    } catch (error) {
      Helpers.log.error('Erreur mise à jour licence:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Supprimer une licence
   * @param {string|number} id - ID de la licence
   * @returns {Object} - Résultat de l'opération
   */
  async delete(id) {
    try {
      if (this.useOfflineMode) {
        // Mode hors ligne
        const index = this.fallbackData.findIndex(l => String(l.id) === String(id));
        if (index !== -1) {
          this.fallbackData.splice(index, 1);
          this.lastLicencesCount = this.fallbackData.length;
          Helpers.log.info('Licence supprimée en mode hors ligne');
          return { success: true };
        } else {
          throw new Error('Licence non trouvée');
        }
      }

      // Mode Supabase
      const { error } = await this.supabase
        .from(APP_CONFIG.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      Helpers.log.success('Licence supprimée de Supabase');
      return { success: true };

    } catch (error) {
      Helpers.log.error('Erreur suppression licence:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Rechercher des licences
   * @param {string} searchTerm - Terme de recherche
   * @param {Object} filters - Filtres additionnels
   * @returns {Object} - Résultats de recherche
   */
  async search(searchTerm = '', filters = {}) {
    try {
      const allLicences = await this.getAll();
      if (!allLicences.success) {
        return allLicences;
      }

      let filtered = allLicences.data;

      // Filtrage par terme de recherche
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(licence => 
          licence.software_name.toLowerCase().includes(term) ||
          licence.vendor.toLowerCase().includes(term) ||
          licence.version.toLowerCase().includes(term) ||
          (licence.assigned_to && licence.assigned_to.toLowerCase().includes(term))
        );
      }

      // Filtres additionnels
      if (filters.type) {
        filtered = filtered.filter(licence => licence.type === filters.type);
      }

      if (filters.vendor) {
        filtered = filtered.filter(licence => licence.vendor === filters.vendor);
      }

      if (filters.expiringSoon) {
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
        filtered = filtered.filter(licence => {
          const expDate = new Date(licence.expiration_date);
          return expDate <= thirtyDaysFromNow && expDate >= today;
        });
      }

      if (filters.expired) {
        const today = new Date();
        filtered = filtered.filter(licence => {
          const expDate = new Date(licence.expiration_date);
          return expDate < today;
        });
      }

      return { success: true, data: filtered, total: filtered.length };

    } catch (error) {
      Helpers.log.error('Erreur recherche licences:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les statistiques des licences
   * @returns {Object} - Statistiques
   */
  async getStats() {
    try {
      const allLicences = await this.getAll();
      if (!allLicences.success) {
        return allLicences;
      }

      const licences = allLicences.data;
      const today = new Date();
      
      const stats = {
        total: licences.length,
        byType: {},
        byVendor: {},
        expiration: {
          expired: 0,
          expiringSoon: 0, // < 30 jours
          valid: 0
        },
        totalCost: 0,
        averageCost: 0
      };

      licences.forEach(licence => {
        // Compter par type
        stats.byType[licence.type] = (stats.byType[licence.type] || 0) + 1;
        
        // Compter par éditeur
        stats.byVendor[licence.vendor] = (stats.byVendor[licence.vendor] || 0) + 1;
        
        // Statuts d'expiration
        const expDate = new Date(licence.expiration_date);
        const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          stats.expiration.expired++;
        } else if (diffDays <= 30) {
          stats.expiration.expiringSoon++;
        } else {
          stats.expiration.valid++;
        }
        
        // Coûts
        const cost = parseFloat(licence.initial_cost) || 0;
        stats.totalCost += cost;
      });

      stats.averageCost = stats.total > 0 ? stats.totalCost / stats.total : 0;

      return { success: true, data: stats };

    } catch (error) {
      Helpers.log.error('Erreur stats licences:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir le statut de la connexion
   * @returns {Object} - Statut
   */
  getStatus() {
    return {
      online: !this.useOfflineMode,
      licencesCount: this.lastLicencesCount,
      mode: this.useOfflineMode ? 'offline' : 'supabase'
    };
  }

  /**
   * Synchroniser les données hors ligne avec Supabase
   * @returns {Object} - Résultat de la synchronisation
   */
  async syncOfflineData() {
    if (!this.useOfflineMode || !this.supabase) {
      return { success: false, error: 'Synchronisation non nécessaire' };
    }

    try {
      let synced = 0;
      let errors = 0;

      for (const licence of this.fallbackData) {
        try {
          // Essayer de créer chaque licence dans Supabase
          const { software_name, vendor, version, type, seats, purchase_date, expiration_date, initial_cost, assigned_to } = licence;
          
          await this.supabase
            .from(APP_CONFIG.tableName)
            .insert([{
              software_name, vendor, version, type, seats, 
              purchase_date, expiration_date, initial_cost, assigned_to
            }]);
          
          synced++;
        } catch (err) {
          console.error('Erreur sync licence:', licence, err);
          errors++;
        }
      }

      // Si succès, vider les données hors ligne
      if (synced > 0 && errors === 0) {
        this.fallbackData = [];
        this.useOfflineMode = false;
      }

      return { 
        success: true, 
        synced, 
        errors,
        message: `${synced} licence(s) synchronisée(s), ${errors} erreur(s)`
      };

    } catch (error) {
      Helpers.log.error('Erreur synchronisation:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export global pour compatibilité navigateur
window.LicenceService = LicenceService;