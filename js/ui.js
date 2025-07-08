// Gestion de l'interface utilisateur et des événements
window.UIManager = {
    
    // Initialise l'interface utilisateur
    init() {
        this.createNotificationsContainer();
        this.setupEventListeners();
    },

    // Configure tous les event listeners
    setupEventListeners() {
        // Bouton déconnexion
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => window.AuthManager.logout());
        }

        // Champ de recherche
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterLicences(e.target.value));
        }

        // Bouton nouvelle licence
        const addLicenceBtn = document.getElementById('addLicenceBtn');
        if (addLicenceBtn) {
            addLicenceBtn.addEventListener('click', () => window.LicenceManager.openModal());
        }

        // Bouton actualiser
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => window.DatabaseManager.refreshData());
        }

        // Event listeners de la modal
        this.setupModalEvents();
    },

    // Configure les événements de la modal
    setupModalEvents() {
        // Boutons fermeture modal
        const closeModalBtn = document.getElementById('closeModalBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => window.LicenceManager.closeModal());
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => window.LicenceManager.closeModal());
        }

        // Formulaire de licence
        const licenceForm = document.getElementById('licenceForm');
        if (licenceForm) {
            licenceForm.addEventListener('submit', (e) => {
                e.preventDefault();
                window.LicenceManager.saveLicence();
            });
        }

        // Fermer modal en cliquant en dehors
        const licenceModal = document.getElementById('licenceModal');
        if (licenceModal) {
            licenceModal.addEventListener('click', (e) => {
                if (e.target.id === 'licenceModal') {
                    window.LicenceManager.closeModal();
                }
            });
        }

        // Gestion de la touche Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                window.LicenceManager.closeModal();
            }
        });
    },

    // Affiche l'application principale
    showApp() {
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        
        // Afficher le menu admin si l'utilisateur est administrateur
        if (window.AuthManager.isAdmin()) {
            document.getElementById('adminMenu').classList.add('visible');
            console.log('✅ Menu administration activé');
        }
        
        window.AuthManager.updateUserDisplay();
        this.setupEventListeners();
    },

    // Cache l'application et affiche la page de connexion
    hideApp() {
        document.getElementById('loginPage').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
        document.getElementById('adminMenu').classList.remove('visible');
        document.getElementById('loginForm').reset();
    },

    // Met à jour le statut de connexion
    updateStatus(text, online) {
        const statusText = document.getElementById('statusText');
        const statusIndicator = document.getElementById('statusIndicator');
        
        if (statusText) {
            statusText.textContent = text;
        }
        
        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${online ? 'online' : 'offline'}`;
        }
    },

    // Met à jour le compteur de licences
    updateLicenceCount() {
        const licenceCount = document.getElementById('licenceCount');
        if (licenceCount) {
            licenceCount.textContent = `${window.AppState.licences.length} licence(s)`;
        }
    },

    // Filtre les licences affichées
    filterLicences(searchTerm) {
        const rows = document.querySelectorAll('#licenceTableBody tr');
        const term = searchTerm.toLowerCase();
        
        rows.forEach(row => {
            const isVisible = row.textContent.toLowerCase().includes(term);
            row.style.display = isVisible ? '' : 'none';
        });
    },

    // Affiche une notification toast
    showNotification(message, type = 'info') {
        const container = this.getNotificationsContainer();
        const toast = this.createToast(message, type);
        
        container.appendChild(toast);
        
        // Animation d'apparition
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Suppression automatique après 5 secondes
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    },

    // Crée un élément toast
    createToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span>${window.AppUtils.escapeHtml(message)}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
        `;
        return toast;
    },

    // Obtient ou crée le conteneur de notifications
    getNotificationsContainer() {
        let container = document.getElementById('notificationsContainer');
        if (!container) {
            container = this.createNotificationsContainer();
        }
        return container;
    },

    // Crée le conteneur de notifications
    createNotificationsContainer() {
        const container = document.createElement('div');
        container.id = 'notificationsContainer';
        container.className = 'notifications-container';
        document.body.appendChild(container);
        return container;
    },

    // Affiche une alerte d'expiration
    showAlert(message, type) {
        const alertsContainer = document.getElementById('alertsContainer');
        if (!alertsContainer) return;
        
        const alert = document.createElement('div');
        alert.className = `alert ${type}`;
        alert.innerHTML = `
            <span>${window.AppUtils.escapeHtml(message)}</span>
            <button onclick="this.parentElement.remove()">✕</button>
        `;
        alertsContainer.appendChild(alert);
    },

    // Efface toutes les alertes
    clearAlerts() {
        const alertsContainer = document.getElementById('alertsContainer');
        if (alertsContainer) {
            alertsContainer.innerHTML = '';
        }
    },

    // Affiche une modal de confirmation
    confirm(message) {
        return confirm(message);
    },

    // Affiche une alerte simple
    alert(message) {
        alert(message);
    },

    // Fonctionnalité à venir
    showComingSoon() {
        this.showNotification(window.AppConfig.MESSAGES.COMING_SOON, 'info');
    },

    // Met à jour l'affichage après tri
    updateTableSort(column, direction) {
        // Ajouter des indicateurs visuels de tri si nécessaire
        const headers = document.querySelectorAll('th[onclick]');
        headers.forEach(header => {
            header.classList.remove('sorted-asc', 'sorted-desc');
        });
        
        const targetHeader = document.querySelector(`th[onclick*="${column}"]`);
        if (targetHeader) {
            targetHeader.classList.add(`sorted-${direction}`);
        }
    },

    // Gère l'état de chargement
    setLoading(isLoading) {
        const loadingElements = document.querySelectorAll('.loading');
        loadingElements.forEach(element => {
            element.style.display = isLoading ? 'block' : 'none';
        });
    },

    // Focus sur un élément
    focusElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.focus();
        }
    },

    // Réinitialise un formulaire
    resetForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
    }
};