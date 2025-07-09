# 📋 Licence2 - Gestionnaire de Licences Logicielles

**Application web complète pour la gestion des licences logicielles avec authentification multi-utilisateurs**

[![Version](https://img.shields.io/badge/version-2.0-blue.svg)](https://github.com/spdpt2fr/Licence2)
[![Demo](https://img.shields.io/badge/demo-licenceskay.netlify.app-orange.svg)](https://licenceskay.netlify.app)
[![Supabase](https://img.shields.io/badge/database-Supabase-green.svg)](https://supabase.com)

---

## ✨ **Fonctionnalités Principales**

### 🔐 **Authentification Multi-utilisateurs**
- **Système de rôles** : Admin, Écriture, Lecture
- **Connexion sécurisée** avec gestion des sessions
- **Permissions granulaires** par utilisateur
- **Interface d'administration** complète

### 📊 **Gestion des Licences**
- **CRUD complet** : Créer, lire, modifier, supprimer
- **Suivi des expirations** avec alertes automatiques
- **Types de licences** : Perpétuelle, Abonnement, Essai, Éducation
- **Gestion des postes** et assignations

### 🎯 **Interface Utilisateur**
- **Interface responsive** adaptée mobile/desktop
- **Tableau interactif** avec tri et filtres
- **Recherche en temps réel** dans les licences
- **Notifications toast** pour les actions utilisateur

### 💾 **Gestion des Données**
- **Base de données Supabase** PostgreSQL
- **Synchronisation temps réel** des modifications
- **Gestion des erreurs** et récupération automatique
- **Sauvegarde et export** des données

---

## 🏗️ **Architecture Technique**

### **Structure du Projet**
```
Licence2/
├── 📄 index.html              # Interface principale
├── 📄 users-management.html   # Module administration utilisateurs
├── 📄 style.css               # Styles principaux
├── 📄 config.js               # Configuration Supabase
├── 📄 package.json            # Métadonnées projet
├── 📄 .gitignore              # Configuration Git
├── 📄 README.md               # Documentation
│
├── 📁 js/                     # Scripts JavaScript
│   ├── app.js                 # Application principale
│   ├── auth.js                # Authentification
│   ├── database.js            # Gestion base de données
│   ├── licences.js            # Logique métier licences
│   ├── ui.js                  # Interface utilisateur
│   └── config.js              # Configuration JavaScript
│
└── 📁 sql/                    # Scripts base de données
    └── create_users_table.sql # Structure table utilisateurs
```

### **Technologies Utilisées**
- **Frontend** : HTML5, CSS3, JavaScript ES6
- **Backend** : Supabase (PostgreSQL + Auth + Real-time)
- **Déploiement** : Netlify
- **Authentification** : Supabase Auth
- **Base de données** : PostgreSQL via Supabase

---

## 🚀 **Installation et Déploiement**

### **Prérequis**
- Compte Supabase (gratuit)
- Compte Netlify (gratuit) ou serveur web

### **Configuration Supabase**

1. **Créer un projet Supabase** :
   ```bash
   # Aller sur https://supabase.com
   # Créer un nouveau projet
   # Noter l'URL et la clé API
   ```

2. **Configurer la base de données** :
   ```sql
   -- Exécuter le script sql/create_users_table.sql
   -- dans l'éditeur SQL de Supabase
   ```

3. **Mettre à jour la configuration** :
   ```javascript
   // Dans config.js
   const SUPABASE_URL = 'votre_url_supabase';
   const SUPABASE_KEY = 'votre_cle_api';
   ```

### **Déploiement Netlify**

1. **Fork le repository** sur GitHub
2. **Connecter à Netlify** :
   - Aller sur [netlify.com](https://netlify.com)
   - "New site from Git"
   - Sélectionner le repository forké
   - Déployer automatiquement

3. **Configuration** :
   - Build command : (vide)
   - Publish directory : `/`
   - Déploiement automatique à chaque push

---

## 👥 **Utilisation**

### **Première Connexion**
- **URL** : https://votre-app.netlify.app
- **Identifiants par défaut** : `admin / admin`
- **Première étape** : Changer le mot de passe admin

### **Gestion des Utilisateurs**
1. **Accès** : Menu "Administration" → "Utilisateurs"
2. **Créer un utilisateur** : Bouton "Nouvel utilisateur"
3. **Rôles disponibles** :
   - **Admin** : Toutes les permissions
   - **Écriture** : Créer/modifier/supprimer les licences
   - **Lecture** : Consulter uniquement

### **Gestion des Licences**
1. **Ajouter une licence** : Bouton "Nouvelle licence"
2. **Modifier** : Cliquer sur l'icône ✏️
3. **Supprimer** : Cliquer sur l'icône 🗑️
4. **Rechercher** : Utiliser la barre de recherche
5. **Filtrer** : Cliquer sur les en-têtes de colonnes

---

## 📊 **Fonctionnalités Avancées**

### **Système d'Alertes**
- **Alertes automatiques** pour les licences expirant sous 30 jours
- **Notifications visuelles** dans l'interface
- **Codes couleur** par niveau d'urgence

### **Import/Export**
- **Export CSV** de toutes les données
- **Sauvegarde automatique** en base de données
- **Historique des modifications**

### **Permissions et Sécurité**
- **Authentification obligatoire** pour l'accès
- **Sessions sécurisées** avec timeout automatique
- **Permissions granulaires** par rôle utilisateur
- **Logs d'activité** pour audit

---

## 🔧 **Développement**

### **Structure du Code**
- **index.html** : Interface principale avec chargement des modules JS
- **users-management.html** : Module administration avec code intégré
- **js/** : Scripts JavaScript organisés par fonctionnalité

### **Modules JavaScript Principaux**
```javascript
// Ordre de chargement dans index.html
1. js/config.js     // Configuration Supabase
2. js/auth.js       // Authentification
3. js/database.js   // Gestion base de données
4. js/ui.js         // Interface utilisateur
5. js/licences.js   // Logique métier
6. js/app.js        // Application principale
```

### **Contribution**
1. **Fork** le repository
2. **Créer une branche** pour vos modifications
3. **Tester** vos changements localement
4. **Créer une Pull Request** avec description détaillée

---

## 📝 **Versions**

### **Version 2.0 (Actuelle)**
- ✅ Architecture JavaScript modulaire
- ✅ Interface utilisateur complète
- ✅ Authentification multi-utilisateurs
- ✅ Gestion complète des licences
- ✅ Module administration utilisateurs
- ✅ Déploiement Netlify optimisé

### **Version 1.0**
- ✅ Interface de base
- ✅ Gestion simple des licences
- ✅ Connexion Supabase

---

## 🆘 **Support**

### **Problèmes Courants**
- **Erreur de connexion** : Vérifier la configuration Supabase
- **Permissions insuffisantes** : Vérifier le rôle utilisateur
- **Données non sauvegardées** : Vérifier la connexion réseau

### **Contact**
- **Issues GitHub** : [github.com/spdpt2fr/Licence2/issues](https://github.com/spdpt2fr/Licence2/issues)
- **Documentation** : Ce README.md
- **Demo live** : [licenceskay.netlify.app](https://licenceskay.netlify.app)

---

## 📄 **Licence**

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**Développé avec ❤️ pour simplifier la gestion des licences logicielles**