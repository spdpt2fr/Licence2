/**
 * Notifications - Système de notifications toast
 * Affiche des messages temporaires à l'utilisateur
 */

import { ALERT_LEVELS } from '../config/constants.js';

export class NotificationSystem {
  constructor() {
    this.container = null;
    this.notifications = [];
    this.maxNotifications = 5;
    this.defaultDuration = 3000;
    
    this.init();
  }

  /**
   * Initialise le système de notifications
   */
  init() {
    // Créer le conteneur de notifications s'il n'existe pas
    this.container = document.getElementById('notifications-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notifications-container';
      this.container.className = 'notifications-container';
      document.body.appendChild(this.container);
    }
  }

  /**
   * Affiche une notification de succès
   * @param {string} message - Message à afficher
   * @param {number} duration - Durée d'affichage en ms
   */
  success(message, duration = this.defaultDuration) {
    this.show(message, ALERT_LEVELS.SUCCESS, duration);
  }

  /**
   * Affiche une notification d'avertissement
   * @param {string} message - Message à afficher
   * @param {number} duration - Durée d'affichage en ms
   */
  warning(message, duration = this.defaultDuration) {
    this.show(message, ALERT_LEVELS.WARNING, duration);
  }

  /**
   * Affiche une notification d'erreur
   * @param {string} message - Message à afficher
   * @param {number} duration - Durée d'affichage en ms
   */
  error(message, duration = this.defaultDuration) {
    this.show(message, ALERT_LEVELS.DANGER, duration);
  }

  /**
   * Affiche une notification d'information
   * @param {string} message - Message à afficher
   * @param {number} duration - Durée d'affichage en ms
   */
  info(message, duration = this.defaultDuration) {
    this.show(message, ALERT_LEVELS.INFO, duration);
  }

  /**
   * Affiche une notification
   * @param {string} message - Message à afficher
   * @param {string} type - Type de notification
   * @param {number} duration - Durée d'affichage en ms
   */
  show(message, type = ALERT_LEVELS.INFO, duration = this.defaultDuration) {
    const notification = this.createNotification(message, type);
    
    // Ajouter au conteneur
    this.container.appendChild(notification);
    this.notifications.push(notification);

    // Limiter le nombre de notifications
    this.limitNotifications();

    // Animation d'entrée
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    // Suppression automatique
    if (duration > 0) {
      setTimeout(() => {
        this.remove(notification);
      }, duration);
    }

    return notification;
  }

  /**
   * Crée un élément de notification
   * @param {string} message - Message
   * @param {string} type - Type
   * @returns {HTMLElement} Élément de notification
   */
  createNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `toast toast-${type}`;
    
    notification.innerHTML = `
      <div class="toast-content">
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Fermer">×</button>
      </div>
    `;

    // Event listener pour fermeture manuelle
    const closeBtn = notification.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      this.remove(notification);
    });

    return notification;
  }

  /**
   * Supprime une notification
   * @param {HTMLElement} notification - Notification à supprimer
   */
  remove(notification) {
    if (!notification || !notification.parentNode) return;

    // Animation de sortie
    notification.classList.add('removing');
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      
      // Retirer de la liste
      const index = this.notifications.indexOf(notification);
      if (index > -1) {
        this.notifications.splice(index, 1);
      }
    }, 300);
  }

  /**
   * Limite le nombre de notifications affichées
   */
  limitNotifications() {
    while (this.notifications.length > this.maxNotifications) {
      const oldest = this.notifications[0];
      this.remove(oldest);
    }
  }

  /**
   * Supprime toutes les notifications
   */
  clear() {
    this.notifications.forEach(notification => {
      this.remove(notification);
    });
  }
}

// Instance globale
export const notifications = new NotificationSystem();

export default notifications;