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