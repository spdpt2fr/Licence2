# Gestionnaire de Licences - Clean Version

## 🎯 Application de Gestion des Licences Logicielles

Application web simple et fonctionnelle pour gérer les licences logicielles d'entreprise.

## ✨ Fonctionnalités

- **Gestion des licences** : Créer, modifier, supprimer les licences
- **Alertes d'expiration** : Notification automatique des licences qui expirent
- **Authentification** : Système de connexion avec rôles (lecture/écriture/admin)
- **Import/Export CSV** : Sauvegarde et import de données
- **Mode hors ligne** : Fonctionnement en cas de perte de connexion
- **Interface responsive** : Compatible mobile et desktop

## 🚀 Déploiement

**URL de production** : https://licenceskay.netlify.app

### Connexion par défaut
- **Login** : `Admin`
- **Mot de passe** : `Admin`

## 🏗️ Architecture Technique

### Stack
- **Frontend** : HTML5, CSS3, JavaScript ES6+
- **Base de données** : Supabase
- **Hébergement** : Netlify
- **Authentification** : Cookie-based sessions

### Structure des fichiers
```
📁 Licence2/
├── index.html          # Page principale
├── style.css           # Styles CSS
├── config.js           # Configuration Supabase
├── api.js              # API Licences
├── auth.js             # Authentification
├── app.js              # Interface utilisateur
├── package.json        # Métadonnées projet
└── README.md           # Documentation
```

## 🛠️ Développement Local

```bash
# Cloner le repository
git clone https://github.com/spdpt2fr/Licence2.git
cd Licence2

# Servir localement (optionnel)
python -m http.server 8000
# ou
npx serve .

# Ouvrir http://localhost:8000
```

## 📊 Base de Données

### Table `licences`
```sql
CREATE TABLE licences (
  id SERIAL PRIMARY KEY,
  software_name VARCHAR(255) NOT NULL,
  vendor VARCHAR(255) NOT NULL,
  version VARCHAR(100),
  type VARCHAR(50),
  seats INTEGER DEFAULT 1,
  purchase_date DATE,
  expiration_date DATE,
  initial_cost DECIMAL(10,2),
  assigned_to VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table `users`
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  login VARCHAR(50) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'read',
  must_change BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Système d'Authentification

### Rôles utilisateur
- **read** : Consultation uniquement
- **write** : Lecture + création/modification des licences
- **admin** : Toutes permissions + gestion des utilisateurs

### Sécurité
- Mots de passe encodés en Base64
- Sessions basées sur cookies HTTPOnly
- Validation côté client et serveur

## 📈 Fonctionnalités Avancées

### Alertes d'Expiration
- **Rouge** : Licences expirées
- **Jaune** : Licences expirant dans les 30 jours
- Tri automatique par priorité

### Import/Export CSV
- Format CSV standard avec headers
- Gestion des caractères spéciaux
- Validation des données à l'import

### Mode Offline
- Sauvegarde automatique en localStorage
- Synchronisation au retour de connexion
- Interface dégradée gracieuse

## 🐛 Résolution de Problèmes

### Cache Browser
Si l'application ne se charge pas correctement :
```bash
# Vider le cache navigateur
Ctrl+F5 (Windows) / Cmd+Shift+R (Mac)

# Ou ouvrir en mode privé
Ctrl+Shift+N (Chrome) / Ctrl+Shift+P (Firefox)
```

### Erreurs Supabase
Vérifier la configuration dans `config.js` :
- URL Supabase correcte
- Clé API valide
- Tables créées

## 📋 Roadmap

- [ ] Interface d'administration avancée
- [ ] Notifications par email
- [ ] API REST publique
- [ ] Dashboard analytique
- [ ] Support multi-tenant

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

**Fait avec ❤️ pour la gestion d'entreprise**