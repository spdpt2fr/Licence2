# 📋 Licence2 - Gestionnaire de Licences Logicielles

Application web moderne pour gérer les licences logicielles de votre entreprise avec alertes automatiques d'expiration.

## 🚀 Fonctionnalités

- ✅ **Gestion complète des licences** (CRUD)
- 🔔 **Alertes d'expiration** automatiques
- 🔍 **Recherche et filtrage** des licences
- 📊 **Tableau de bord** avec statuts visuels
- 🎨 **Interface responsive** et moderne
- 🔐 **Base de données PostgreSQL** sécurisée

## 🛠️ Technologies utilisées

- **Backend**: Node.js, Express.js
- **Base de données**: PostgreSQL (Neon)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Hébergement**: Compatible avec Heroku, Vercel, Railway, etc.

## 📦 Installation

### 1. Cloner le projet
```bash
git clone https://github.com/spdpt2fr/Licence2.git
cd Licence2
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration de l'environnement
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env avec vos propres valeurs
nano .env
```

### 4. Configurer la base de données
Modifiez le fichier `.env` avec votre propre chaîne de connexion PostgreSQL :
```env
DATABASE_URL=postgresql://username:password@host:port/database
PORT=3000
```

### 5. Démarrer l'application
```bash
# Mode production
npm start

# Mode développement (avec nodemon)
npm run dev
```

### 6. Accéder à l'application
Ouvrez votre navigateur et allez sur : `http://localhost:3000`

## 🔧 Structure du projet

```
Licence2/
├── server.js          # Serveur Express.js
├── index.html         # Interface utilisateur
├── script.js          # Logique frontend
├── style.css          # Styles CSS
├── package.json       # Configuration npm
├── .env.example       # Exemple de configuration
├── .gitignore         # Fichiers ignorés par Git
└── README.md          # Documentation
```

## 📊 Schéma de la base de données

```sql
CREATE TABLE licences (
  id TEXT PRIMARY KEY,
  softwareName TEXT NOT NULL,
  vendor TEXT NOT NULL,
  version TEXT NOT NULL,
  type TEXT NOT NULL,
  seats INTEGER NOT NULL DEFAULT 1,
  purchaseDate DATE NOT NULL,
  expirationDate DATE NOT NULL,
  initialCost REAL NOT NULL DEFAULT 0,
  assignedTo TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔔 Système d'alertes

L'application affiche automatiquement des alertes colorées selon les délais d'expiration :

- 🔴 **Rouge** : Expiré ou expire dans moins de 7 jours
- 🟠 **Orange** : Expire dans 8-15 jours
- 🟡 **Jaune** : Expire dans 16-30 jours
- 🟢 **Vert** : Plus de 30 jours

## 🚀 Déploiement

### Heroku
```bash
# Ajouter Heroku remote
heroku git:remote -a votre-app-name

# Déployer
git push heroku main

# Configurer les variables d'environnement
heroku config:set DATABASE_URL=votre_url_postgresql
```

### Railway
```bash
# Installer Railway CLI
npm install -g @railway/cli

# Déployer
railway deploy
```

## 🔐 Sécurité

- ✅ Variables d'environnement pour la configuration
- ✅ Validation des données côté serveur
- ✅ Gestion des erreurs robuste
- ✅ Connexion SSL à la base de données

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Forkez le projet
2. Créez une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commitez vos changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Poussez vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence ISC.

## 🐛 Résolution des problèmes

### Erreurs communes

1. **Erreur de connexion à la base de données**
   - Vérifiez votre `DATABASE_URL` dans `.env`
   - Assurez-vous que votre base PostgreSQL est accessible

2. **Port déjà utilisé**
   - Changez le port dans `.env` : `PORT=3001`

3. **Modules non trouvés**
   - Réinstallez les dépendances : `npm install`

## 📧 Support

Pour toute question ou problème, ouvrez une issue sur GitHub.

---

**Développé avec ❤️ pour simplifier la gestion des licences logicielles**
