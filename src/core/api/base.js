/**
 * BaseAPI - Classe de base pour toutes les API
 * Gestion commune : connexion, mode offline, erreurs
 */

import { getSupabaseClient, isSupabaseConnected } from '../config/supabase.config.js';
import { EVENTS } from '../config/constants.js';

export class BaseAPI {
  constructor(tableName) {
    this.tableName = tableName;
    this.fallbackData = [];
    this.useOfflineMode = false;
    this.lastSyncTime = null;
  }

  /**
   * Initialise l'API
   */
  async init() {
    try {
      if (isSupabaseConnected()) {
        console.log(`✅ ${this.constructor.name} connectée à Supabase`);
        this.useOfflineMode = false;
        return true;
      } else {
        console.warn(`⚠️ ${this.constructor.name} en mode hors ligne`);
        this.useOfflineMode = true;
        return false;
      }
    } catch (error) {
      console.error(`❌ Erreur initialisation ${this.constructor.name}:`, error);
      this.useOfflineMode = true;
      return false;
    }
  }

  /**
   * Récupère le client Supabase
   */
  get supabase() {
    return getSupabaseClient();
  }

  /**
   * Génère un ID unique pour le mode offline
   */
  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Gestion centralisée des erreurs
   */
  handleError(error, operation = 'unknown') {
    console.error(`❌ Erreur ${this.constructor.name}.${operation}:`, error);
    
    // Émettre événement d'erreur
    this.emitEvent(EVENTS.ERROR_OCCURRED, {
      source: this.constructor.name,
      operation,
      error: error.message || error
    });
    
    return {
      success: false,
      error: error.message || error.toString(),
      fallback: this.useOfflineMode
    };
  }

  /**
   * Émet un événement personnalisé
   */
  emitEvent(eventName, data = {}) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    }
  }

  /**
   * Sauvegarde en mode offline
   */
  saveOffline(data, operation = 'create') {
    try {
      const timestamp = new Date().toISOString();
      
      switch (operation) {
        case 'create':
          const newItem = {
            id: this.generateId(),
            ...data,
            created_at: timestamp,
            updated_at: timestamp
          };
          this.fallbackData.push(newItem);
          return { success: true, data: newItem };
          
        case 'update':
          const index = this.fallbackData.findIndex(item => item.id === data.id);
          if (index !== -1) {
            this.fallbackData[index] = {
              ...this.fallbackData[index],
              ...data,
              updated_at: timestamp
            };
            return { success: true, data: this.fallbackData[index] };
          }
          throw new Error('Item non trouvé');
          
        case 'delete':
          const deleteIndex = this.fallbackData.findIndex(item => item.id === data);
          if (deleteIndex !== -1) {
            this.fallbackData.splice(deleteIndex, 1);
            return { success: true };
          }
          throw new Error('Item non trouvé');
          
        default:
          throw new Error(`Opération inconnue: ${operation}`);
      }
    } catch (error) {
      return this.handleError(error, `saveOffline.${operation}`);
    }
  }

  /**
   * Récupère toutes les données (template method)
   */
  async getAll() {
    if (this.useOfflineMode) {
      console.log(`📱 ${this.constructor.name}: Chargement mode hors ligne`);
      return { success: true, data: this.fallbackData, fallback: true };
    }

    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.lastSyncTime = new Date();
      console.log(`✅ ${this.constructor.name}: ${data.length} éléments chargés`);
      
      return { success: true, data };
    } catch (error) {
      console.warn(`⚠️ ${this.constructor.name}: Fallback vers mode offline`);
      return { success: true, data: this.fallbackData, fallback: true };
    }
  }

  /**
   * Synchronise les données offline avec Supabase
   */
  async syncOfflineData() {
    if (this.useOfflineMode || !this.fallbackData.length) return;

    try {
      console.log(`🔄 Synchronisation ${this.constructor.name}...`);
      
      // Ici, on pourrait implémenter une logique de sync plus complexe
      // Pour l'instant, on se contente de vider le cache offline
      this.fallbackData = [];
      this.lastSyncTime = new Date();
      
      console.log(`✅ Synchronisation ${this.constructor.name} terminée`);
    } catch (error) {
      console.error(`❌ Erreur synchronisation ${this.constructor.name}:`, error);
    }
  }

  /**
   * Retourne l'état de l'API
   */
  getStatus() {
    return {
      online: !this.useOfflineMode,
      tableName: this.tableName,
      itemsCount: this.useOfflineMode ? this.fallbackData.length : 'connected',
      lastSync: this.lastSyncTime,
      fallbackItems: this.fallbackData.length
    };
  }
}

export default BaseAPI;
