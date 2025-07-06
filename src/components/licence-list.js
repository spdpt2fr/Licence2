/**
 * Composant de liste des licences pour l'application Licence2
 * Taille: ~4KB - Responsabilité unique: affichage tableau licences avec filtres et actions
 */

class LicenceListComponent {
  
  constructor() {
    this.licenceService = null;
    this.authService = null;
    this.container = null;
    this.tableElement = null;
    this.tbody = null;
    this.searchInput = null;
    this.countElement = null;
    this.currentFilter = '';
    this.currentSort = { field: 'softwareName', direction: 'asc' };
    this.licences = [];
    this.onEditCallback = null;
    this.onDeleteCallback = null;
    this.isInitialized = false;
  }

  /**
   * Initialiser le composant
   * @param {LicenceService} licenceService - Service de gestion des licences
   * @param {AuthService} authService - Service d'authentification
   */
  init(licenceService, authService) {
    this.licenceService = licenceService;
    this.authService = authService;
    
    // Créer les éléments DOM
    this.createTable();
    this.createToolbar();
    this.setupEventListeners();
    
    this.isInitialized = true;
    Helpers.log.success('LicenceListComponent initialisé');
  }

  /**
   * Créer le tableau des licences
   */
  createTable() {
    // Récupérer ou créer le conteneur
    this.container = Helpers.dom.get('.table-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'table-container';
      document.body.appendChild(this.container);
    }

    // HTML du tableau
    this.container.innerHTML = `
      <div class="table-wrapper">
        <table id="licenceTable" class="licences-table">
          <thead>
            <tr>
              <th data-sort="softwareName" class="sortable">
                Logiciel
                <span class="sort-indicator"></span>
              </th>
              <th data-sort="vendor" class="sortable">
                Éditeur
                <span class="sort-indicator"></span>
              </th>
              <th data-sort="version" class="sortable">
                Version
                <span class="sort-indicator"></span>
              </th>
              <th data-sort="type" class="sortable">
                Type
                <span class="sort-indicator"></span>
              </th>
              <th data-sort="seats" class="sortable">
                Sièges
                <span class="sort-indicator"></span>
              </th>
              <th data-sort="expirationDate" class="sortable">
                Expiration
                <span class="sort-indicator"></span>
              </th>
              <th data-sort="initialCost" class="sortable">
                Coût
                <span class="sort-indicator"></span>
              </th>
              <th data-sort="assignedTo" class="sortable">
                Assigné à
                <span class="sort-indicator"></span>
              </th>
              <th class="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            <!-- Les données seront chargées dynamiquement -->
          </tbody>
        </table>
      </div>
      
      <div class="table-footer">
        <div class="table-info">
          <span id="licencesCount" class="count">0 licence(s)</span>
          <span id="tableStatus" class="status"></span>
        </div>
        <div class="table-actions">
          <button id="refreshTable" class="btn btn-secondary btn-sm">
            🔄 Actualiser
          </button>
        </div>
      </div>
    `;

    this.tableElement = this.container.querySelector('#licenceTable');
    this.tbody = this.tableElement.querySelector('tbody');
    this.countElement = this.container.querySelector('#licencesCount');
  }

  /**
   * Créer la barre d'outils
   */
  createToolbar() {
    // Récupérer ou créer la toolbar
    let toolbar = Helpers.dom.get('.toolbar');
    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.className = 'toolbar';
      
      // Insérer avant le tableau
      this.container.parentNode.insertBefore(toolbar, this.container);
    }

    // HTML de la toolbar
    toolbar.innerHTML = `
      <div class="toolbar-left">
        <button id="newLicence" class="btn btn-primary">
          ➕ Ajouter une licence
        </button>
        <button id="newUser" class="btn btn-secondary hidden">
          👤 Nouvel utilisateur
        </button>
      </div>
      
      <div class="toolbar-center">
        <div class="search-container">
          <input
            type="text"
            id="search"
            placeholder="🔍 Rechercher par nom ou éditeur..."
            aria-label="Rechercher des licences"
          />
          <button id="clearSearch" class="search-clear hidden" title="Effacer la recherche">✕</button>
        </div>
        <div class="filter-container">
          <select id="typeFilter" aria-label="Filtrer par type">
            <option value="">Tous les types</option>
            <option value="perpetuelle">Perpétuelle</option>
            <option value="abonnement">Abonnement</option>
            <option value="utilisateur">Par utilisateur</option>
            <option value="concurrent">Concurrent</option>
          </select>
          <select id="statusFilter" aria-label="Filtrer par statut">
            <option value="">Tous les statuts</option>
            <option value="valid">Valides</option>
            <option value="expiring">Expire bientôt</option>
            <option value="expired">Expirées</option>
          </select>
        </div>
      </div>
      
      <div class="toolbar-right">
        <button id="exportCsv" class="btn btn-secondary">📤 Export CSV</button>
        <button id="importCsv" class="btn btn-secondary">📥 Import CSV</button>
        <input type="file" id="importFile" accept=".csv" class="hidden" />
      </div>
    `;

    this.searchInput = toolbar.querySelector('#search');
  }

  /**
   * Configurer les événements
   */
  setupEventListeners() {
    // Recherche en temps réel
    if (this.searchInput) {
      this.searchInput.addEventListener('input', 
        Helpers.debounce((e) => this.handleSearch(e.target.value), 300)
      );
    }

    // Bouton effacer recherche
    const clearBtn = Helpers.dom.get('#clearSearch');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearSearch());
    }

    // Filtres
    const typeFilter = Helpers.dom.get('#typeFilter');
    const statusFilter = Helpers.dom.get('#statusFilter');
    
    if (typeFilter) {
      typeFilter.addEventListener('change', () => this.applyFilters());
    }
    
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.applyFilters());
    }

    // Tri des colonnes
    const sortableHeaders = this.tableElement.querySelectorAll('.sortable');
    sortableHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const field = header.dataset.sort;
        this.handleSort(field);
      });
    });

    // Bouton actualiser
    const refreshBtn = Helpers.dom.get('#refreshTable');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refresh());
    }

    // Export/Import
    const exportBtn = Helpers.dom.get('#exportCsv');
    const importBtn = Helpers.dom.get('#importCsv');
    const importFile = Helpers.dom.get('#importFile');
    
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportToCSV());
    }
    
    if (importBtn && importFile) {
      importBtn.addEventListener('click', () => importFile.click());
      importFile.addEventListener('change', (e) => this.handleImport(e));
    }

    // Bouton nouvelle licence
    const newBtn = Helpers.dom.get('#newLicence');
    if (newBtn) {
      newBtn.addEventListener('click', () => this.triggerNewLicence());
    }

    // Événements personnalisés
    window.addEventListener('licence:saved', () => this.refresh());
    window.addEventListener('auth:loginSuccess', () => this.updatePermissions());
  }

  /**
   * Charger et afficher les licences
   * @param {Array} licences - Liste des licences (optionnel)
   */
  async loadLicences(licences = null) {
    try {
      if (licences) {
        this.licences = licences;
      } else {
        const result = await this.licenceService.getAll();
        if (result.success) {
          this.licences = this.normalizeData(result.data);
          
          if (result.fallback) {
            this.showStatus('Mode hors ligne', 'warning');
          } else {
            this.showStatus('');
          }
        } else {
          throw new Error('Erreur lors du chargement des licences');
        }
      }
      
      this.render();
      
    } catch (error) {
      Helpers.log.error('Erreur chargement licences:', error);
      this.licences = [];
      this.render();
      NotificationService.error('Impossible de charger les licences');
    }
  }

  /**
   * Normaliser les données (adapter format Supabase)
   * @param {Array} data - Données brutes
   * @returns {Array} - Données normalisées
   */
  normalizeData(data) {
    return data.map(licence => ({
      id: licence.id,
      softwareName: licence.software_name || licence.softwareName,
      vendor: licence.vendor,
      version: licence.version,
      type: licence.type,
      seats: licence.seats,
      purchaseDate: licence.purchase_date || licence.purchaseDate,
      expirationDate: licence.expiration_date || licence.expirationDate,
      initialCost: licence.initial_cost || licence.initialCost,
      assignedTo: licence.assigned_to || licence.assignedTo,
      createdAt: licence.created_at || licence.createdAt,
      updatedAt: licence.updated_at || licence.updatedAt
    }));
  }

  /**
   * Afficher les licences dans le tableau
   */
  render() {
    if (!this.tbody) return;
    
    // Filtrer et trier les licences
    const filteredLicences = this.getFilteredLicences();
    const sortedLicences = this.getSortedLicences(filteredLicences);
    
    // Vider le tableau
    this.tbody.innerHTML = '';
    
    if (sortedLicences.length === 0) {
      this.renderEmptyState();
      return;
    }
    
    // Afficher les licences
    sortedLicences.forEach(licence => {
      const row = this.createLicenceRow(licence);
      this.tbody.appendChild(row);
    });
    
    // Mettre à jour le compteur
    this.updateCount(sortedLicences.length, this.licences.length);
    
    // Mettre à jour l'indicateur de tri
    this.updateSortIndicator();
  }

  /**
   * Créer une ligne de licence
   * @param {Object} licence - Données de la licence
   * @returns {HTMLElement} - Élément tr
   */
  createLicenceRow(licence) {
    const tr = document.createElement('tr');
    
    // Statut d'expiration
    const expirationStatus = Formatters.formatExpirationStatus(licence.expirationDate);
    tr.className = `licence-row status-${expirationStatus.level}`;
    tr.dataset.licenceId = licence.id;
    
    // Contenu de la ligne
    tr.innerHTML = `
      <td class="software-name" title="${licence.softwareName}">
        ${Formatters.formatSoftwareName(licence.softwareName)}
      </td>
      <td class="vendor">${licence.vendor}</td>
      <td class="version">${licence.version}</td>
      <td class="type">${Formatters.formatLicenceType(licence.type)}</td>
      <td class="seats">${Formatters.formatSeats(licence.seats)}</td>
      <td class="expiration" title="${expirationStatus.text}">
        <span class="date">${Formatters.formatDate(licence.expirationDate)}</span>
        <span class="status-badge status-${expirationStatus.level}">
          ${expirationStatus.level === 'danger' ? '🔴' : expirationStatus.level === 'warning' ? '🟡' : '🟢'}
        </span>
      </td>
      <td class="cost">${Formatters.formatPrice(licence.initialCost)}</td>
      <td class="assigned">${licence.assignedTo || '-'}</td>
      <td class="actions"></td>
    `;
    
    // Ajouter les boutons d'action
    this.addActionButtons(tr, licence);
    
    return tr;
  }

  /**
   * Ajouter les boutons d'action à une ligne
   * @param {HTMLElement} row - Ligne du tableau
   * @param {Object} licence - Données de la licence
   */
  addActionButtons(row, licence) {
    const actionsCell = row.querySelector('.actions');
    if (!actionsCell) return;
    
    // Vérifier les permissions
    const canEdit = this.authService.hasPermission('manage_licences');
    const canDelete = this.authService.hasPermission('admin');
    
    // Bouton éditer
    if (canEdit) {
      const editBtn = document.createElement('button');
      editBtn.className = 'btn-edit';
      editBtn.title = 'Modifier cette licence';
      editBtn.innerHTML = '✏️';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editLicence(licence);
      });
      actionsCell.appendChild(editBtn);
    }
    
    // Bouton supprimer
    if (canDelete) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.title = 'Supprimer cette licence';
      deleteBtn.innerHTML = '🗑️';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteLicence(licence);
      });
      actionsCell.appendChild(deleteBtn);
    }
    
    // Bouton détails (toujours disponible)
    const detailBtn = document.createElement('button');
    detailBtn.className = 'btn-detail';
    detailBtn.title = 'Voir les détails';
    detailBtn.innerHTML = '👁️';
    detailBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showDetails(licence);
    });
    actionsCell.appendChild(detailBtn);
  } = Helpers.dom.get('.toolbar');
    if (toolbar) {
      toolbar.remove();
    }
    
    this.isInitialized = false;
  }
}

// Export global pour compatibilité navigateur
window.LicenceListComponent = LicenceListComponent;