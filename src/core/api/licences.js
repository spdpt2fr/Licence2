/**
 * LicencesAPI - Gestion des licences modulaire
 * Hérite de BaseAPI pour fonctionnalités communes
 */

import BaseAPI from './base.js';
import { APP_CONFIG } from '../../config/app.config.js';
import { EVENTS, LICENCE_TYPES } from '../../config/constants.js';

export class LicencesAPI extends BaseAPI {
  constructor() {
    super(APP_CONFIG.tableName);
    this.lastLicencesCount = 0;
  }

  /**
   * Crée une nouvelle licence
   * @param {Object} licenceData - Données de la licence
   * @returns {Promise<Object>} Résultat de l'opération
   */
  async create(licenceData) {
    try {
      // Validation des données
      const validation = this.validateLicenceData(licenceData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Préparer les données pour Supabase (format snake_case)
      const dbData = this.toDbFormat(licenceData);

      if (this.useOfflineMode) {
        const result = this.saveOffline(dbData, 'create');
        this.lastLicencesCount = this.fallbackData.length;
        this.emitEvent(EVENTS.LICENCE_CREATED, result.data);
        return result;
      }

      // Mode Supabase - ID auto-généré
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert([dbData])
        .select();

      if (error) throw error;

      const licence = this.fromDbFormat(data[0]);
      console.log('✅ Licence créée dans Supabase:', licence.softwareName);
      
      this.emitEvent(EVENTS.LICENCE_CREATED, licence);
      return { success: true, data: licence };

    } catch (error) {
      // Fallback vers mode offline en cas d'erreur
      try {
        const fallbackResult = this.saveOffline(this.toDbFormat(licenceData), 'create');
        this.lastLicencesCount = this.fallbackData.length;
        console.warn('💾 Licence sauvegardée en mode fallback');
        this.emitEvent(EVENTS.LICENCE_CREATED, fallbackResult.data);
        return { ...fallbackResult, fallback: true };
      } catch (fallbackError) {
        return this.handleError(error, 'create');
      }
    }
  }

  /**
   * Récupère toutes les licences
   * @returns {Promise<Object>} Liste des licences
   */
  async getAll() {
    try {
      if (this.useOfflineMode) {
        this.lastLicencesCount = this.fallbackData.length;
        const licences = this.fallbackData.map(l => this.fromDbFormat(l));
        this.emitEvent(EVENTS.DATA_LOADED, { count: licences.length, fallback: true });
        return { success: true, data: licences, fallback: true };
      }

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .order('expiration_date', { ascending: true });

      if (error) throw error;

      const licences = data.map(l => this.fromDbFormat(l));
      this.lastLicencesCount = licences.length;
      
      console.log(`✅ ${licences.length} licences chargées depuis Supabase`);
      this.emitEvent(EVENTS.DATA_LOADED, { count: licences.length });
      
      return { success: true, data: licences };

    } catch (error) {
      console.warn('⚠️ Fallback vers données offline');
      this.lastLicencesCount = this.fallbackData.length;
      const licences = this.fallbackData.map(l => this.fromDbFormat(l));
      this.emitEvent(EVENTS.DATA_LOADED, { count: licences.length, fallback: true });
      return { success: true, data: licences, fallback: true };
    }
  }

  /**
   * Met à jour une licence
   * @param {string} id - ID de la licence
   * @param {Object} licenceData - Nouvelles données
   * @returns {Promise<Object>} Résultat de l'opération
   */
  async update(id, licenceData) {
    try {
      // Validation des données
      const validation = this.validateLicenceData(licenceData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const dbData = {
        ...this.toDbFormat(licenceData),
        updated_at: new Date().toISOString()
      };

      if (this.useOfflineMode) {
        const result = this.saveOffline({ id, ...dbData }, 'update');
        this.emitEvent(EVENTS.LICENCE_UPDATED, result.data);
        return result;
      }

      // Mode Supabase
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(dbData)
        .eq('id', id)
        .select();

      if (error) throw error;

      if (data.length === 0) {
        throw new Error('Licence non trouvée');
      }

      const licence = this.fromDbFormat(data[0]);
      console.log('✅ Licence mise à jour:', licence.softwareName);
      
      this.emitEvent(EVENTS.LICENCE_UPDATED, licence);
      return { success: true, data: licence };

    } catch (error) {
      return this.handleError(error, 'update');
    }
  }

  /**
   * Supprime une licence
   * @param {string} id - ID de la licence
   * @returns {Promise<Object>} Résultat de l'opération
   */
  async delete(id) {
    try {
      if (this.useOfflineMode) {
        const result = this.saveOffline(id, 'delete');
        this.lastLicencesCount = this.fallbackData.length;
        this.emitEvent(EVENTS.LICENCE_DELETED, { id });
        return result;
      }

      // Mode Supabase
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Licence supprimée de Supabase');
      this.emitEvent(EVENTS.LICENCE_DELETED, { id });
      
      return { success: true };

    } catch (error) {
      return this.handleError(error, 'delete');
    }
  }

  /**
   * Recherche des licences par critères
   * @param {string} query - Termes de recherche
   * @param {Object} filters - Filtres additionnels
   * @returns {Promise<Object>} Résultats de recherche
   */
  async search(query = '', filters = {}) {
    try {
      const allLicences = await this.getAll();
      if (!allLicences.success) return allLicences;

      let results = allLicences.data;

      // Recherche textuelle
      if (query.trim()) {
        const searchTerm = query.toLowerCase();
        results = results.filter(licence => 
          licence.softwareName.toLowerCase().includes(searchTerm) ||
          licence.vendor.toLowerCase().includes(searchTerm) ||
          licence.version.toLowerCase().includes(searchTerm) ||
          (licence.assignedTo && licence.assignedTo.toLowerCase().includes(searchTerm))
        );
      }

      // Filtres additionnels
      if (filters.type) {
        results = results.filter(licence => licence.type === filters.type);
      }

      if (filters.expired !== undefined) {
        const now = new Date();
        results = results.filter(licence => {
          const expDate = new Date(licence.expirationDate);
          const isExpired = expDate < now;
          return filters.expired ? isExpired : !isExpired;
        });
      }

      if (filters.expiringSoon !== undefined) {
        const now = new Date();
        const threshold = new Date(now.getTime() + (filters.expiringSoon * 24 * 60 * 60 * 1000));
        results = results.filter(licence => {
          const expDate = new Date(licence.expirationDate);
          return expDate <= threshold && expDate >= now;
        });
      }

      return {
        success: true,
        data: results,
        meta: {
          total: allLicences.data.length,
          filtered: results.length,
          query,
          filters
        }
      };

    } catch (error) {
      return this.handleError(error, 'search');
    }
  }

  /**
   * Analyse des licences (statistiques)
   * @returns {Promise<Object>} Statistiques des licences
   */
  async getAnalytics() {
    try {
      const allLicences = await this.getAll();
      if (!allLicences.success) return allLicences;

      const licences = allLicences.data;
      const now = new Date();

      const analytics = {
        total: licences.length,
        expired: 0,
        expiringSoon: 0, // < 30 jours
        byType: {},
        byVendor: {},
        totalCost: 0,
        avgCost: 0
      };

      licences.forEach(licence => {
        const expDate = new Date(licence.expirationDate);
        const daysUntilExpiry = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

        // Statut d'expiration
        if (daysUntilExpiry < 0) {
          analytics.expired++;
        } else if (daysUntilExpiry <= 30) {
          analytics.expiringSoon++;
        }

        // Par type
        analytics.byType[licence.type] = (analytics.byType[licence.type] || 0) + 1;

        // Par éditeur
        analytics.byVendor[licence.vendor] = (analytics.byVendor[licence.vendor] || 0) + 1;

        // Coûts
        analytics.totalCost += licence.initialCost || 0;
      });

      analytics.avgCost = analytics.total > 0 ? analytics.totalCost / analytics.total : 0;

      return {
        success: true,
        data: analytics,
        meta: {
          generatedAt: new Date().toISOString(),
          fallback: allLicences.fallback
        }
      };

    } catch (error) {
      return this.handleError(error, 'getAnalytics');
    }
  }

  /**
   * Valide les données d'une licence
   * @param {Object} data - Données à valider
   * @returns {Object} Résultat de validation
   */
  validateLicenceData(data) {
    const errors = [];

    if (!data.softwareName || data.softwareName.trim() === '') {
      errors.push('Le nom du logiciel est obligatoire');
    }

    if (!data.vendor || data.vendor.trim() === '') {
      errors.push('L\'éditeur est obligatoire');
    }

    if (!data.version || data.version.trim() === '') {
      errors.push('La version est obligatoire');
    }

    if (!Object.values(LICENCE_TYPES).includes(data.type)) {
      errors.push('Type de licence invalide');
    }

    if (!data.purchaseDate) {
      errors.push('La date d\'achat est obligatoire');
    }

    if (!data.expirationDate) {
      errors.push('La date d\'expiration est obligatoire');
    }

    if (data.purchaseDate && data.expirationDate) {
      if (new Date(data.purchaseDate) >= new Date(data.expirationDate)) {
        errors.push('La date d\'expiration doit être postérieure à la date d\'achat');
      }
    }

    if (data.seats && (isNaN(data.seats) || data.seats < 1)) {
      errors.push('Le nombre de sièges doit être un nombre positif');
    }

    if (data.initialCost && (isNaN(data.initialCost) || data.initialCost < 0)) {
      errors.push('Le coût initial doit être un nombre positif ou nul');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convertit les données UI vers format DB (camelCase → snake_case)
   * @param {Object} uiData - Données format UI
   * @returns {Object} Données format DB
   */
  toDbFormat(uiData) {
    return {
      software_name: uiData.softwareName,
      vendor: uiData.vendor,
      version: uiData.version,
      type: uiData.type,
      seats: parseInt(uiData.seats, 10) || 1,
      purchase_date: uiData.purchaseDate,
      expiration_date: uiData.expirationDate,
      initial_cost: parseFloat(uiData.initialCost) || 0,
      assigned_to: uiData.assignedTo || null
    };
  }

  /**
   * Convertit les données DB vers format UI (snake_case → camelCase)
   * @param {Object} dbData - Données format DB
   * @returns {Object} Données format UI
   */
  fromDbFormat(dbData) {
    return {
      id: dbData.id,
      softwareName: dbData.software_name,
      vendor: dbData.vendor,
      version: dbData.version,
      type: dbData.type,
      seats: dbData.seats,
      purchaseDate: dbData.purchase_date,
      expirationDate: dbData.expiration_date,
      initialCost: dbData.initial_cost,
      assignedTo: dbData.assigned_to,
      createdAt: dbData.created_at,
      updatedAt: dbData.updated_at
    };
  }

  /**
   * Retourne l'état de l'API avec compteur de licences
   * @returns {Object} État actuel
   */
  getStatus() {
    return {
      ...super.getStatus(),
      licencesCount: this.lastLicencesCount,
      features: {
        search: true,
        analytics: true,
        validation: true,
        fallback: true
      }
    };
  }
}

export default LicencesAPI;
