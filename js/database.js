// Gestion des opérations base de données
window.DatabaseManager = {
    
    // Initialise la connexion à Supabase
    async init() {
        try {
            window.AppState.supabase = window.supabase.createClient(
                window.AppConfig.SUPABASE_URL, 
                window.AppConfig.SUPABASE_KEY
            );
            console.log('✅ Supabase initialisé');
            
            await this.testConnection();
            return true;
        } catch (error) {
            console.error('❌ Erreur initialisation Supabase:', error);
            window.UIManager.showNotification(window.AppConfig.MESSAGES.CONNECTION_ERROR, 'danger');
            return false;
        }
    },

    // Test de connexion à la base de données
    async testConnection() {
        try {
            console.log('🔗 Test de connexion à la base de données...');
            
            const { data, error, count } = await window.AppState.supabase
                .from(window.AppConfig.TABLES.LICENCES)
                .select('*', { count: 'exact' });
            
            if (error) {
                console.error('❌ Erreur connexion base:', error);
                throw new Error(`Erreur base de données: ${error.message}`);
            }
            
            console.log(`✅ Connexion base réussie - ${count} licences trouvées`);
            window.UIManager.updateStatus(`Base de données connectée (${count} licences)`, true);
            return { success: true, count };
        } catch (error) {
            console.error('❌ Test connexion échoué:', error);
            window.UIManager.updateStatus('Erreur base de données', false);
            throw error;
        }
    },

    // Charge toutes les licences
    async loadLicences() {
        try {
            window.UIManager.updateStatus('Chargement depuis la base...', false);
            console.log('🔄 Chargement des licences depuis Supabase...');
            
            const { data, error } = await window.AppState.supabase
                .from(window.AppConfig.TABLES.LICENCES)
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('❌ Erreur Supabase:', error);
                throw new Error(`Erreur base de données: ${error.message}`);
            }
            
            window.AppState.licences = data || [];
            window.UIManager.updateStatus(`Base de données connectée (${window.AppState.licences.length} licences)`, true);
            
            console.log(`✅ ${window.AppState.licences.length} licences chargées depuis la base`);
            
            window.LicenceManager.renderLicences();
            window.UIManager.updateLicenceCount();
            window.LicenceManager.checkExpirations();
            
        } catch (error) {
            console.error('❌ Erreur chargement:', error);
            window.UIManager.updateStatus('Erreur base de données', false);
            window.UIManager.showNotification(`Erreur: ${error.message}`, 'danger');
            
            window.AppState.licences = [];
            window.LicenceManager.renderLicences();
            window.UIManager.updateLicenceCount();
        }
    },

    // Crée une nouvelle licence
    async createLicence(licenceData) {
        try {
            console.log('➕ Création licence:', licenceData);
            
            const dataToInsert = {
                ...licenceData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const result = await window.AppState.supabase
                .from(window.AppConfig.TABLES.LICENCES)
                .insert([dataToInsert]);
            
            if (result.error) throw result.error;
            
            window.UIManager.showNotification(window.AppConfig.MESSAGES.LICENCE_CREATED, 'success');
            await this.loadLicences();
            return true;
            
        } catch (error) {
            console.error('❌ Erreur création licence:', error);
            window.UIManager.showNotification(`Erreur: ${error.message}`, 'danger');
            return false;
        }
    },

    // Met à jour une licence existante
    async updateLicence(licenceId, licenceData) {
        try {
            console.log('✏️ Mise à jour licence:', licenceId, licenceData);
            
            const dataToUpdate = {
                ...licenceData,
                updated_at: new Date().toISOString()
            };
            
            const result = await window.AppState.supabase
                .from(window.AppConfig.TABLES.LICENCES)
                .update(dataToUpdate)
                .eq('id', licenceId);
            
            if (result.error) throw result.error;
            
            window.UIManager.showNotification(window.AppConfig.MESSAGES.LICENCE_UPDATED, 'success');
            await this.loadLicences();
            return true;
            
        } catch (error) {
            console.error('❌ Erreur mise à jour licence:', error);
            window.UIManager.showNotification(`Erreur: ${error.message}`, 'danger');
            return false;
        }
    },

    // Supprime une licence
    async deleteLicence(licenceId) {
        try {
            console.log('🗑️ Suppression licence ID:', licenceId);
            
            const result = await window.AppState.supabase
                .from(window.AppConfig.TABLES.LICENCES)
                .delete()
                .eq('id', licenceId);
            
            if (result.error) throw result.error;
            
            window.UIManager.showNotification(window.AppConfig.MESSAGES.LICENCE_DELETED, 'success');
            await this.loadLicences();
            return true;
            
        } catch (error) {
            console.error('❌ Erreur suppression licence:', error);
            window.UIManager.showNotification(`Erreur: ${error.message}`, 'danger');
            return false;
        }
    },

    // Obtient une licence par ID
    getLicenceById(licenceId) {
        return window.AppState.licences.find(licence => licence.id === licenceId);
    },

    // Recherche des licences par terme
    searchLicences(searchTerm) {
        if (!searchTerm) return window.AppState.licences;
        
        const term = searchTerm.toLowerCase();
        return window.AppState.licences.filter(licence => {
            return Object.values(licence).some(value => {
                if (value === null || value === undefined) return false;
                return value.toString().toLowerCase().includes(term);
            });
        });
    },

    // Trie les licences par colonne
    sortLicences(column, direction = 'asc') {
        const sortedLicences = [...window.AppState.licences].sort((a, b) => {
            let aVal = a[column] || '';
            let bVal = b[column] || '';
            
            // Traitement spécial pour les colonnes numériques et dates
            if (column === 'initial_cost' || column === 'seats') { 
                aVal = parseFloat(aVal) || 0; 
                bVal = parseFloat(bVal) || 0; 
            } else if (column === 'expiration_date' || column === 'created_at') { 
                aVal = new Date(aVal); 
                bVal = new Date(bVal); 
            } else { 
                aVal = aVal.toString().toLowerCase(); 
                bVal = bVal.toString().toLowerCase(); 
            }
            
            return direction === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
        });
        
        window.AppState.licences = sortedLicences;
        window.LicenceManager.renderLicences();
    },

    // Actualise les données
    async refreshData() {
        await this.loadLicences();
        window.UIManager.showNotification(window.AppConfig.MESSAGES.DATA_UPDATED, 'success');
    }
};