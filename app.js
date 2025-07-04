// Application principale - Interface utilisateur
class LicenceApp {
  constructor() {
    this.api = new LicencesAPI();
    this.licences = [];
    this.currentFilter = '';
    this.initialized = false;
  }

  // Initialisation de l'application
  async init() {
    try {
      console.log('🚀 Initialisation de l\'application Licence...');
      
      // Initialiser l'API
      await this.api.init();
      
      // Charger les licences
      await this.loadLicences();
      
      // Configurer les event listeners
      this.setupEventListeners();
      
      // Afficher l'interface
      this.render();
      this.showAlerts();
      
      // Afficher le statut
      this.updateStatus();
      
      this.initialized = true;
      console.log('✅ Application initialisée avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      this.showError('Erreur lors de l\'initialisation de l\'application');
    }
  }

  // Charger toutes les licences
  async loadLicences() {
    try {
      const result = await this.api.getAll();
      
      if (result.success) {
        // Adapter les données Supabase vers format UI
        this.licences = result.data.map(l => ({
          id: l.id,
          softwareName: l.software_name,
          vendor: l.vendor,
          version: l.version,
          type: l.type,
          seats: l.seats,
          purchaseDate: l.purchase_date,
          expirationDate: l.expiration_date,
          initialCost: l.initial_cost,
          assignedTo: l.assigned_to,
          createdAt: l.created_at,
          updatedAt: l.updated_at
        }));
        
        if (result.fallback) {
          this.showWarning('Données chargées en mode hors ligne');
        }
      } else {
        throw new Error('Erreur lors du chargement des licences');
      }
    } catch (error) {
      console.error('❌ Erreur chargement licences:', error);
      this.licences = [];
      this.showError('Impossible de charger les licences');
    }
  }

  // Afficher les licences dans le tableau
  render() {
    const tbody = document.querySelector('#licenceTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const today = new Date();
    
    const filteredLicences = this.licences.filter(l => 
      l.softwareName.toLowerCase().includes(this.currentFilter.toLowerCase()) ||
      l.vendor.toLowerCase().includes(this.currentFilter.toLowerCase())
    );
    
    filteredLicences.forEach(licence => {
      const tr = document.createElement('tr');
      const expDate = new Date(licence.expirationDate);
      const diff = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
      
      // Appliquer les classes de statut
      if (diff < 0) {
        tr.classList.add('status-expired');
      } else if (diff <= 30) {
        tr.classList.add('status-warning');
      }
      
      tr.innerHTML = `
        <td>${licence.softwareName}</td>
        <td>${licence.vendor}</td>
        <td>${licence.version}</td>
        <td>${licence.type}</td>
        <td>${licence.seats}</td>
        <td>${licence.expirationDate}</td>
        <td>${licence.initialCost}€</td>
        <td>${licence.assignedTo || '-'}</td>
        <td class="actions"></td>
      `;

      const actionsTd = tr.querySelector('.actions');
      const editBtn = document.createElement('button');
      editBtn.className = 'btn-edit';
      editBtn.textContent = 'Éditer';
      editBtn.addEventListener('click', () => this.editLicence(licence.id));

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.textContent = 'Supprimer';
      deleteBtn.addEventListener('click', () => this.deleteLicence(licence.id));

      actionsTd.appendChild(editBtn);
      actionsTd.appendChild(deleteBtn);
      
      tbody.appendChild(tr);
    });
    
    // Mettre à jour le compteur
    const count = document.getElementById('licencesCount');
    if (count) {
      count.textContent = `${filteredLicences.length} licence(s)`;
    }
  }

  // Afficher les alertes d'expiration
  showAlerts() {
    const alertsDiv = document.getElementById('alerts');
    if (!alertsDiv) return;
    
    alertsDiv.innerHTML = '';
    const today = new Date();
    
    const alerts = [];
    
    this.licences.forEach(licence => {
      const expDate = new Date(licence.expirationDate);
      const diff = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
      
      let level = null;
      let message = '';
      
      if (diff < 0) {
        // Licences expirées -> ROUGE
        level = 'danger';
        message = `${licence.softwareName} a expiré il y a ${Math.abs(diff)} jour(s)`;
      } else if (diff <= 30) {
        // Licences qui vont expirer -> JAUNE
        level = 'warn';
        message = `${licence.softwareName} expire dans ${diff} jour(s)`;
      }
      
      if (level) {
        alerts.push({ level, message });
      }
    });
    
    // Trier par priorité (danger > warn)
    alerts.sort((a, b) => {
      const priority = { danger: 2, warn: 1 };
      return priority[b.level] - priority[a.level];
    });
    
    alerts.forEach(alert => {
      const alertDiv = document.createElement('div');
      alertDiv.className = `alert ${alert.level}`;
      alertDiv.textContent = alert.message;
      alertsDiv.appendChild(alertDiv);
    });
  }

  // Configuration des event listeners
  setupEventListeners() {
    // Bouton nouvelle licence
    const newBtn = document.getElementById('newLicence');
    if (newBtn) {
      newBtn.addEventListener('click', () => this.openForm());
    }
    
    // Recherche
    const searchInput = document.getElementById('search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentFilter = e.target.value;
        this.render();
      });
    }
    
    // Formulaire
    const form = document.getElementById('licenceForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    // Export CSV
    const exportBtn = document.getElementById('exportCsv');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportCSV());
    }

    // Import CSV
    const importBtn = document.getElementById('importCsv');
    const importInput = document.getElementById('importFile');
    if (importBtn && importInput) {
      importBtn.addEventListener('click', () => importInput.click());
      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.importCSV(file);
        }
        importInput.value = '';
      });
    }
    
    // Bouton annuler
    const cancelBtn = document.getElementById('cancelForm');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeForm());
    }
  }

  // Ouvrir le formulaire
  openForm(licence = null) {
    const form = document.getElementById('licenceForm');
    const title = document.getElementById('formTitle');
    
    if (form) form.classList.remove('hidden');
    if (title) title.textContent = licence ? 'Modifier licence' : 'Nouvelle licence';
    
    if (licence) {
      // Mode édition
      document.getElementById('licenceId').value = licence.id;
      document.getElementById('softwareName').value = licence.softwareName;
      document.getElementById('vendor').value = licence.vendor;
      document.getElementById('version').value = licence.version;
      document.getElementById('type').value = licence.type;
      document.getElementById('seats').value = licence.seats;
      document.getElementById('purchaseDate').value = licence.purchaseDate;
      document.getElementById('expirationDate').value = licence.expirationDate;
      document.getElementById('initialCost').value = licence.initialCost;
      document.getElementById('assignedTo').value = licence.assignedTo || '';
    } else {
      // Mode création
      this.resetForm();
    }
  }

  // Fermer le formulaire
  closeForm() {
    const form = document.getElementById('licenceForm');
    if (form) form.classList.add('hidden');
    this.resetForm();
  }

  // Réinitialiser le formulaire
  resetForm() {
    const fields = ['licenceId', 'softwareName', 'vendor', 'version', 'seats', 
                   'purchaseDate', 'expirationDate', 'initialCost', 'assignedTo'];
    
    fields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) field.value = '';
    });
    
    const typeField = document.getElementById('type');
    if (typeField) typeField.value = 'perpetuelle';
    
    const seatsField = document.getElementById('seats');
    if (seatsField) seatsField.value = '1';
  }

  // Gérer la soumission du formulaire
  async handleFormSubmit(e) {
    e.preventDefault();
    
    try {
      const id = document.getElementById('licenceId').value;
      const licenceData = {
        softwareName: document.getElementById('softwareName').value.trim(),
        vendor: document.getElementById('vendor').value.trim(),
        version: document.getElementById('version').value.trim(),
        type: document.getElementById('type').value,
        seats: parseInt(document.getElementById('seats').value, 10),
        purchaseDate: document.getElementById('purchaseDate').value,
        expirationDate: document.getElementById('expirationDate').value,
        initialCost: parseFloat(document.getElementById('initialCost').value) || 0,
        assignedTo: document.getElementById('assignedTo').value.trim()
      };
      
      // Validation basique
      if (!licenceData.softwareName || !licenceData.vendor || !licenceData.version) {
        throw new Error('Les champs Logiciel, Éditeur et Version sont obligatoires');
      }
      
      let result;
      if (id) {
        // Modification
        result = await this.api.update(id, licenceData);
      } else {
        // Création - L'ID sera auto-généré par Supabase
        result = await this.api.create(licenceData);
      }
      
      if (result.success) {
        this.showSuccess(id ? 'Licence mise à jour avec succès' : 'Licence créée avec succès');
        this.closeForm();
        await this.loadLicences();
        this.render();
        this.showAlerts();
        this.updateStatus();
      } else {
        throw new Error(result.error || 'Erreur lors de la sauvegarde');
      }
      
    } catch (error) {
      console.error('❌ Erreur soumission formulaire:', error);
      this.showError(error.message);
    }
  }

  // Éditer une licence
  editLicence(id) {
    const licence = this.licences.find(l => String(l.id) === String(id));
    if (licence) {
      this.openForm(licence);
    }
  }

  // Supprimer une licence
  async deleteLicence(id) {
    const licence = this.licences.find(l => String(l.id) === String(id));
    if (!licence) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la licence "${licence.softwareName}" ?`)) {
      return;
    }
    
    try {
      const result = await this.api.delete(id);
      
      if (result.success) {
        this.showSuccess('Licence supprimée avec succès');
        await this.loadLicences();
        this.render();
        this.showAlerts();
        this.updateStatus();
      } else {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }
      
    } catch (error) {
      console.error('❌ Erreur suppression licence:', error);
      this.showError(error.message);
    }
  }

  // Mettre à jour le statut de l'application
  updateStatus() {
    const statusDiv = document.getElementById('appStatus');
    if (!statusDiv) return;

    const status = this.api.getStatus();
    statusDiv.innerHTML = `
      <span class="status-indicator ${status.online ? 'online' : 'offline'}"></span>
      ${status.online ? 'En ligne' : 'Hors ligne'} - ${status.licencesCount} licence(s)
    `;
  }

  // Exporter les licences en CSV
  exportCSV() {
    if (!this.licences.length) {
      this.showWarning('Aucune licence à exporter');
      return;
    }
    const headers = [
      'software_name',
      'vendor',
      'version',
      'type',
      'seats',
      'purchase_date',
      'expiration_date',
      'initial_cost',
      'assigned_to'
    ];
    const rows = this.licences.map(l => [
      l.softwareName,
      l.vendor,
      l.version,
      l.type,
      l.seats,
      l.purchaseDate,
      l.expirationDate,
      l.initialCost,
      l.assignedTo || ''
    ]);
    const csv = [headers.join(','),
      ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'licences.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  // Importer des licences depuis un CSV
  async importCSV(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.trim().split(/\r?\n/);
        if (lines.length <= 1) {
          this.showWarning('Fichier CSV vide');
          return;
        }
        const headers = lines[0].split(',').map(h => h.trim());
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          const obj = {};
          headers.forEach((h, idx) => {
            obj[h] = values[idx] ? values[idx].replace(/^"|"$/g, '') : '';
          });
          const licence = {
            softwareName: obj.software_name || obj.softwareName || '',
            vendor: obj.vendor || '',
            version: obj.version || '',
            type: obj.type || 'perpetuelle',
            seats: parseInt(obj.seats, 10) || 1,
            purchaseDate: obj.purchase_date || '',
            expirationDate: obj.expiration_date || '',
            initialCost: parseFloat(obj.initial_cost) || 0,
            assignedTo: obj.assigned_to || ''
          };
          if (licence.softwareName && licence.vendor && licence.version) {
            await this.api.create(licence);
          }
        }
        await this.loadLicences();
        this.render();
        this.showAlerts();
        this.updateStatus();
        this.showSuccess('Import CSV terminé');
      } catch (err) {
        console.error('Erreur import CSV:', err);
        this.showError('Erreur lors de l\'import CSV');
      }
    };
    reader.readAsText(file);
  }

  // Utilitaires d'affichage des messages
  showSuccess(message) {
    this.showMessage(message, 'success');
  }
  
  showWarning(message) {
    this.showMessage(message, 'warning');
  }
  
  showError(message) {
    this.showMessage(message, 'error');
  }
  
  showMessage(message, type) {
    // Créer un toast message
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Initialisation globale
let app;

window.startLicenceApp = async () => {
  app = new LicenceApp();
  await app.init();
  window.app = app;
};