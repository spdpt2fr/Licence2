// API Layer pour gestion des licences avec Supabase
class LicencesAPI {
  constructor() {
    this.supabase = null;
    this.fallbackData = [];
    this.useOfflineMode = false;
  }

  // Initialisation
  async init() {
    try {
      if (typeof window.initSupabase === 'function') {
        const initialized = await window.initSupabase();
        if (initialized && window.supabaseClient) {
          this.supabase = window.supabaseClient;
          console.log('✅ API Licences connectée à Supabase');
          return true;
        }
      }
      
      console.warn('⚠️ Supabase non disponible, mode hors ligne activé');
      this.useOfflineMode = true;
      return false;
    } catch (error) {
      console.error('❌ Erreur initialisation API:', error);
      this.useOfflineMode = true;
      return false;
    }
  }

  // CREATE - Créer une nouvelle licence
  async create(licence) {
    try {
      // Préparer les données pour Supabase (SANS id - auto-généré)
      const licenceData = {
        software_name: licence.softwareName,
        vendor: licence.vendor,
        version: licence.version,
        type: licence.type,
        seats: licence.seats || 1,
        purchase_date: licence.purchaseDate,
        expiration_date: licence.expirationDate,
        initial_cost: licence.initialCost || 0,
        assigned_to: licence.assignedTo || null
      };

      if (this.useOfflineMode) {
        // Mode hors ligne - ajouter un ID généré
        const offlineData = {
          id: this.generateId(),
          ...licenceData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        this.fallbackData.push(offlineData);
        console.log('💾 Licence sauvegardée en mode hors ligne');
        return { success: true, data: offlineData };
      }

      // Mode Supabase - laisser l'ID être auto-généré
      const { data, error } = await this.supabase
        .from(APP_CONFIG.tableName)
        .insert([licenceData])
        .select();

      if (error) throw error;

      console.log('✅ Licence créée dans Supabase');
      return { success: true, data: data[0] };

    } catch (error) {
      console.error('❌ Erreur création licence:', error);
      
      // Fallback vers mode hors ligne
      const fallbackData = {
        id: this.generateId(),
        software_name: licence.softwareName,
        vendor: licence.vendor,
        version: licence.version,
        type: licence.type,
        seats: licence.seats || 1,
        purchase_date: licence.purchaseDate,
        expiration_date: licence.expirationDate,
        initial_cost: licence.initialCost || 0,
        assigned_to: licence.assignedTo || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      this.fallbackData.push(fallbackData);
      console.log('💾 Licence sauvegardée en mode fallback');
      return { success: true, data: fallbackData, fallback: true };
    }
  }

  // READ - Récupérer toutes les licences
  async getAll() {
    try {
      if (this.useOfflineMode) {
        console.log('📱 Chargement depuis mode hors ligne');
        return { success: true, data: this.fallbackData };
      }

      const { data, error } = await this.supabase
        .from(APP_CONFIG.tableName)
        .select('*')
        .order('software_name');

      if (error) throw error;

      console.log(`✅ ${data.length} licences chargées depuis Supabase`);
      return { success: true, data: data };

    } catch (error) {
      console.error('❌ Erreur chargement licences:', error);
      console.log('💾 Fallback vers données hors ligne');
      return { success: true, data: this.fallbackData, fallback: true };
    }
  }

  // UPDATE - Mettre à jour une licence
  async update(id, licence) {
    try {
      const licenceData = {
        software_name: licence.softwareName,
        vendor: licence.vendor,
        version: licence.version,
        type: licence.type,
        seats: licence.seats || 1,
        purchase_date: licence.purchaseDate,
        expiration_date: licence.expirationDate,
        initial_cost: licence.initialCost || 0,
        assigned_to: licence.assignedTo || null,
        updated_at: new Date().toISOString()
      };

      if (this.useOfflineMode) {
        // Mode hors ligne
        const index = this.fallbackData.findIndex(l => l.id === id);
        if (index !== -1) {
          this.fallbackData[index] = { ...this.fallbackData[index], ...licenceData };
          console.log('💾 Licence mise à jour en mode hors ligne');
          return { success: true, data: this.fallbackData[index] };
        } else {
          throw new Error('Licence non trouvée');
        }
      }

      // Mode Supabase
      const { data, error } = await this.supabase
        .from(APP_CONFIG.tableName)
        .update(licenceData)
        .eq('id', id)
        .select();

      if (error) throw error;

      if (data.length === 0) {
        throw new Error('Licence non trouvée');
      }

      console.log('✅ Licence mise à jour dans Supabase');
      return { success: true, data: data[0] };

    } catch (error) {
      console.error('❌ Erreur mise à jour licence:', error);
      return { success: false, error: error.message };
    }
  }

  // DELETE - Supprimer une licence
  async delete(id) {
    try {
      if (this.useOfflineMode) {
        // Mode hors ligne
        const index = this.fallbackData.findIndex(l => l.id === id);
        if (index !== -1) {
          this.fallbackData.splice(index, 1);
          console.log('💾 Licence supprimée en mode hors ligne');
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

      console.log('✅ Licence supprimée de Supabase');
      return { success: true };

    } catch (error) {
      console.error('❌ Erreur suppression licence:', error);
      return { success: false, error: error.message };
    }
  }

  // Utilitaire - Générer un ID unique
  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Utilitaire - Statut de la connexion
  getStatus() {
    return {
      online: !this.useOfflineMode,
      licencesCount: this.useOfflineMode ? this.fallbackData.length : 'unknown',
      mode: this.useOfflineMode ? 'offline' : 'supabase'
    };
  }
}

// Export global
window.LicencesAPI = LicencesAPI;
