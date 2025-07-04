// Configuration Supabase
const SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co', // À modifier avec votre URL Supabase
  anon_key: 'your-anon-key', // À modifier avec votre clé publique
};

// Configuration de l'application
const APP_CONFIG = {
  tableName: 'licences',
  enableOfflineMode: true,
  debugMode: true
};

// Initialisation du client Supabase
let supabaseClient = null;

// Fonction d'initialisation
async function initSupabase() {
  try {
    // Import dynamique de Supabase depuis CDN
    const { createClient } = supabase;
    
    supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anon_key);
    
    if (APP_CONFIG.debugMode) {
      console.log('✅ Client Supabase initialisé');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erreur initialisation Supabase:', error);
    return false;
  }
}

// Export pour utilisation globale
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.APP_CONFIG = APP_CONFIG;
window.initSupabase = initSupabase;
