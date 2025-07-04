// Configuration Supabase RÉELLE
const SUPABASE_CONFIG = {
  url: 'https://qsbdzyhxppdbtsikhozp.supabase.co',
  anon_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzYmR6eWh4cHBkYnRzaWtob3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5OTgwOTAsImV4cCI6MjA1MTU3NDA5MH0.Vl7mXwrJxMqQBrVRMtfJixaXGD6qJtfFVZyTRm3ePfw'
};

// Configuration de l'application
const APP_CONFIG = {
  tableName: 'licences',
  enableOfflineMode: true,
  debugMode: true
};

// Fonction d'initialisation
async function initSupabase() {
  try {
    // Import dynamique de Supabase depuis CDN
    const { createClient } = supabase;
    
    const supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anon_key);
    
    // Test de connexion
    const { data, error } = await supabaseClient
      .from('licences')
      .select('count', { count: 'exact' });
    
    if (error) {
      console.warn('⚠️ Erreur Supabase, mode hors ligne activé:', error.message);
      return false;
    }
    
    console.log('✅ Connexion Supabase réussie');
    window.supabaseClient = supabaseClient;
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

console.log('🔧 Configuration Supabase chargée:', SUPABASE_CONFIG.url);
