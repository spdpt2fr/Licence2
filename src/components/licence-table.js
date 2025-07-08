/**
 * LicenceTable Component - Tableau d'affichage des licences
 * Affichage, tri, filtrage, actions CRUD
 */

import { formatDate, formatPrice, formatExpirationStatus } from '../utils/formatters.js';
import { EVENTS } from '../config/constants.js';

export class LicenceTableComponent {
  constructor(container) {
    this.container = container;
    this.licences = [];
    this.filteredLicences = [];
    this.currentFilter = '';
    this.currentUser = null;
    
    this.render();
    this.setupEventListeners();
  }

  /**
   * Définit l'utilisateur actuel pour les permissions
   * @param {Object} user - Utilisateur connecté
   */
  setCurrentUser(user) {
    this.currentUser = user;
    this.refreshTable();
  }

  /**
   * Met à jour les licences affichées
   * @param {Array} licences - Liste des licences
   */
  updateLicences(licences) {
    this.licences = licences;
    this.applyFilter();
  }

  /**
   * Applique le filtre de recherche
   * @param {string} filter - Terme de recherche
   */
  setFilter(filter = '') {
    this.currentFilter = filter.toLowerCase();
    this.applyFilter();
  }

  /**
   * Rendu initial du tableau
   */
  render() {
    this.container.innerHTML = `
      <div class="table-container">
        <div class="table-header">
          <div class="table-actions">
            <button id="newLicenceBtn" class="btn btn-primary">
              ➕ Nouvelle licence
            </button>
            <div class="search-container">
              <input type="text" id="searchInput" 
                     placeholder="🔍 Rechercher..." />
              <span id="licencesCount" class="count">0 licence(s)</span>
            </div>
          </div>
        </div>
        
        <table id="licenceTable" class="licence-table">
          <thead>
            <tr>
              <th data-sort="softwareName">Logiciel</th>
              <th data-sort="vendor">Éditeur</th>
              <th data-sort="version">Version</th>
              <th data-sort="type">Type</th>
              <th data-sort="seats">Sièges</th>
              <th data-sort="expirationDate">Expiration</th>
              <th data-sort="initialCost">Coût</th>
              <th data-sort="assignedTo">Assigné à</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <!-- Les lignes seront injectées ici -->
          </tbody>
        </table>
        
        <div class="table-footer">
          <div class="table-summary">
            <!-- Résumé des données -->
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Configure les event listeners
   */
  setupEventListeners() {
    // Bouton nouvelle licence
    const newBtn = this.container.querySelector('#newLicenceBtn');
    if (newBtn) {
      newBtn.addEventListener('click', () => {
        this.emitEvent('licence:new');
      });
    }

    // Recherche
    const searchInput = this.container.querySelector('#searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.setFilter(e.target.value);
      });
    }

    // Tri par colonnes
    const headers = this.container.querySelectorAll('th[data-sort]');
    headers.forEach(header => {
      header.addEventListener('click', () => {
        const sortField = header.dataset.sort;
        this.sortLicences(sortField);
      });
    });
  }

  /**
   * Applique le filtre et rafraîchit l'affichage
   */
  applyFilter() {
    if (!this.currentFilter) {
      this.filteredLicences = [...this.licences];
    } else {
      this.filteredLicences = this.licences.filter(licence => 
        licence.softwareName.toLowerCase().includes(this.currentFilter) ||
        licence.vendor.toLowerCase().includes(this.currentFilter) ||
        licence.version.toLowerCase().includes(this.currentFilter) ||
        (licence.assignedTo && licence.assignedTo.toLowerCase().includes(this.currentFilter))
      );
    }
    
    this.refreshTable();
    this.updateCount();
  }

  /**
   * Rafraîchit l'affichage du tableau
   */
  refreshTable() {
    const tbody = this.container.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    this.filteredLicences.forEach(licence => {
      const row = this.createLicenceRow(licence);
      tbody.appendChild(row);
    });
  }

  /**
   * Crée une ligne de licence
   * @param {Object} licence - Données de licence
   * @returns {HTMLElement} Ligne du tableau
   */
  createLicenceRow(licence) {
    const tr = document.createElement('tr');
    
    // Ajouter classe de statut d'expiration
    const expStatus = formatExpirationStatus(licence.expirationDate);
    if (expStatus.status === 'expired') {
      tr.classList.add('status-expired');
    } else if (expStatus.status === 'warning') {
      tr.classList.add('status-warning');
    }

    tr.innerHTML = `
      <td>${licence.softwareName}</td>
      <td>${licence.vendor}</td>
      <td>${licence.version}</td>
      <td>${licence.type}</td>
      <td>${licence.seats}</td>
      <td>
        <span class="expiration-date" data-status="${expStatus.status}">
          ${formatDate(licence.expirationDate)}
        </span>
      </td>
      <td>${formatPrice(licence.initialCost)}</td>
      <td>${licence.assignedTo || '-'}</td>
      <td class="actions">
        ${this.createActionButtons(licence)}
      </td>
    `;

    // Ajouter les event listeners pour les actions
    this.setupRowActions(tr, licence);
    
    return tr;
  }

  /**
   * Crée les boutons d'action selon les permissions
   * @param {Object} licence - Données de licence
   * @returns {string} HTML des boutons
   */
  createActionButtons(licence) {
    if (!this.currentUser) return '';

    const canEdit = this.currentUser.permissions.includes('edit_licence');
    const canDelete = this.currentUser.permissions.includes('delete_licence');

    let buttons = `
      <button class="btn-view" data-action="view" data-licence-id="${licence.id}">
        👁️ Voir
      </button>
    `;

    if (canEdit) {
      buttons += `
        <button class="btn-edit" data-action="edit" data-licence-id="${licence.id}">
          ✏️ Éditer
        </button>
      `;
    }

    if (canDelete) {
      buttons += `
        <button class="btn-delete" data-action="delete" data-licence-id="${licence.id}">
          🗑️ Supprimer
        </button>
      `;
    }

    return buttons;
  }

  /**
   * Configure les actions sur une ligne
   * @param {HTMLElement} row - Ligne du tableau
   * @param {Object} licence - Données de licence
   */
  setupRowActions(row, licence) {
    const actionButtons = row.querySelectorAll('button[data-action]');
    
    actionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = button.dataset.action;
        const licenceId = button.dataset.licenceId;
        
        this.emitEvent(`licence:${action}`, {
          licenceId: licenceId,
          licence: licence
        });
      });
    });
  }

  /**
   * Tri des licences
   * @param {string} field - Champ de tri
   */
  sortLicences(field) {
    this.filteredLicences.sort((a, b) => {
      let valueA = a[field];
      let valueB = b[field];

      // Gestion des dates
      if (field.includes('Date')) {
        valueA = new Date(valueA);
        valueB = new Date(valueB);
      }

      // Gestion des nombres
      if (field === 'seats' || field === 'initialCost') {
        valueA = parseFloat(valueA) || 0;
        valueB = parseFloat(valueB) || 0;
      }

      // Gestion des chaînes
      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      if (valueA < valueB) return -1;
      if (valueA > valueB) return 1;
      return 0;
    });

    this.refreshTable();
  }

  /**
   * Met à jour le compteur de licences
   */
  updateCount() {
    const countElement = this.container.querySelector('#licencesCount');
    if (countElement) {
      const total = this.licences.length;
      const filtered = this.filteredLicences.length;
      
      if (this.currentFilter) {
        countElement.textContent = `${filtered}/${total} licence(s)`;
      } else {
        countElement.textContent = `${total} licence(s)`;
      }
    }
  }

  /**
   * Émet un événement personnalisé
   */
  emitEvent(eventName, data = {}) {
    window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }

  /**
   * Détruit le composant
   */
  destroy() {
    // Cleanup si nécessaire
  }
}

export default LicenceTableComponent;