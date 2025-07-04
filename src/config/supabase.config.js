/**
 * Configuration Supabase - Version modulaire
 * Gestion centralisée de la connexion à Supabase
 */

// Configuration Supabase (à adapter selon votre projet)
export const SUPABASE_CONFIG = {
  url: 'https://qsbdzyhxppdbtsikhozp.supabase.co',
  anon_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzYmR6eWh4cHBkYnRzaWtob3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NzI5OTYsImV4cCI6MjA2NzA0ODk5Nn0.kanu7GfIr-qDtd3wcSmDbjEMK9VYX4o9HdG4cD0rcus'
};

// Instance Supabase globale
let supabaseInstance = null;

/**
 * Initialise la connexion Supabase
 * @returns {Promise<boolean>} true si la connexion réussit
 */
export async function initSupabase() {
  try {
    // Import dynamique de Supabase depuis CDN
    if (!window.supabase) {
      console.error('❌ Supabase CDN non chargé');
      return false;
    }

    const { createClient } = window.supabase;
    supabaseInstance = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anon_key);
    
    // Test de connexion
    const { error } = await supabaseInstance
      .from('licences')
      .select('count', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.warn('⚠️ Erreur Supabase, mode hors ligne activé:', error.message);
      return false;
    }
    
    console.log('✅ Connexion Supabase réussie');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur initialisation Supabase:', error);
    return false;
  }
}

/**
 * Récupère l'instance Supabase
 * @returns {Object|null} Instance Supabase ou null
 */
export function getSupabaseClient() {
  return supabaseInstance;
}

/**
 * Vérifie si Supabase est connecté
 * @returns {boolean} true si connecté
 */
export function isSupabaseConnected() {
  return supabaseInstance !== null;
}

export default {
  SUPABASE_CONFIG,
  initSupabase,
  getSupabaseClient,
  isSupabaseConnected
};
