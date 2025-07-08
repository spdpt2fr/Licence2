/**
 * Alerts Component - Système d'alertes d'expiration
 * Affiche les licences expirées et bientôt expirées
 */

import { formatExpirationStatus } from '../utils/formatters.js';
import { EVENTS, ALERT_LEVELS } from '../config/constants.js';

export class AlertsComponent {
  constructor(container) {
    this.container = container;
    this.licences = [];
    
    this.render();
    this.setupEventListeners();
  }

  /**
   * Met à jour les licences et recalcule les alertes
   * @param {Array} licences - Liste des licences
   */
  updateLicences(licences) {
    this.licences = licences;
    this.refreshAlerts();
  }

  /**
   * Rendu initial du conteneur d'alertes
   */
  render() {
    this.container.innerHTML = `
      <section id="alerts" class="alerts-container">
        <!-- Les alertes seront injectées ici -->
      </section>
    `;
  }

  /**
   * Configure les event listeners
   */
  setupEventListeners() {
    // Écouter les événements de données chargées
    window.addEventListener(EVENTS.DATA_LOADED, () => {
      // Les données seront mises à jour via updateLicences()
    });

    window.addEventListener(EVENTS.LICENCE_CREATED, () => {
      // Rafraîchir après création
    });

    window.addEventListener(EVENTS.LICENCE_UPDATED, () => {
      // Rafraîchir après mise à jour
    });

    window.addEventListener(EVENTS.LICENCE_DELETED, () => {
      // Rafraîchir après suppression
    });
  }

  /**
   * Rafraîchit l'affichage des alertes
   */
  refreshAlerts() {
    const alertsContainer = this.container.querySelector('#alerts');
    if (!alertsContainer) return;

    // Effacer les alertes existantes
    alertsContainer.innerHTML = '';

    if (!this.licences.length) return;

    const alerts = this.generateAlerts();
    
    alerts.forEach(alert => {
      const alertElement = this.createAlertElement(alert);
      alertsContainer.appendChild(alertElement);
    });
  }

  /**
   * Génère les alertes à partir des licences
   * @returns {Array} Liste des alertes
   */
  generateAlerts() {
    const alerts = [];

    this.licences.forEach(licence => {
      const expStatus = formatExpirationStatus(licence.expirationDate);
      
      if (expStatus.status === 'expired') {
        alerts.push({
          level: ALERT_LEVELS.DANGER,
          message: `${licence.softwareName} a expiré il y a ${expStatus.days} jour(s)`,
          licence: licence,
          priority: 3
        });
      } else if (expStatus.status === 'warning') {
        alerts.push({
          level: ALERT_LEVELS.WARNING,
          message: `${licence.softwareName} expire dans ${expStatus.days} jour(s)`,
          licence: licence,
          priority: 2
        });
      }
    });

    // Trier par priorité (danger > warning)
    alerts.sort((a, b) => b.priority - a.priority);

    return alerts;
  }

  /**
   * Crée un élément d'alerte
   * @param {Object} alert - Données de l'alerte
   * @returns {HTMLElement} Élément DOM
   */
  createAlertElement(alert) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${alert.level}`;
    
    alertDiv.innerHTML = `
      <div class="alert-content">
        <span class="alert-message">${alert.message}</span>
        <button class="alert-action" data-licence-id="${alert.licence.id}">
          Voir
        </button>
      </div>
    `;

    // Ajouter l'event listener pour l'action
    const actionBtn = alertDiv.querySelector('.alert-action');
    actionBtn.addEventListener('click', () => {
      this.emitEvent('alert:action', {
        type: 'view_licence',
        licenceId: alert.licence.id
      });
    });

    return alertDiv;
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

export default AlertsComponent;