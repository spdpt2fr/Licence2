/**
 * Configuration principale de l'application Licence2
 * Version 3.0 - Architecture modulaire
 */

export const APP_CONFIG = {
  // Application
  name: 'Licence2',
  version: '3.0.0',
  description: 'Gestionnaire de licences logicielles',
  
  // Base de données
  tableName: 'licences',
  usersTable: 'users',
  
  // Fonctionnalités
  enableOfflineMode: true,
  enableUserManagement: true,
  enableCSVImportExport: true,
  enableAlerts: true,
  
  // Performance
  maxLicencesPerPage: 50,
  searchDebounceMs: 300,
  autoSaveDelayMs: 1000,
  
  // Interface
  defaultTheme: 'light',
  dateFormat: 'YYYY-MM-DD',
  currencySymbol: '€',
  
  // Alertes d'expiration (en jours)
  alerts: {
    expired: 0,      // Rouge : expiré
    warning: 30      // Jaune : expire dans 30 jours
  },
  
  // Rôles utilisateurs
  roles: {
    READ: 'read',
    WRITE: 'write', 
    ADMIN: 'admin'
  },
  
  // Debug
  debugMode: process.env.NODE_ENV === 'development'
};

export default APP_CONFIG;
