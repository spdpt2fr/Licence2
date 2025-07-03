require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Configuration de la base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialisation de la base de données
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS licences (
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
      )
    `);
    console.log('✅ Base de données initialisée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
  }
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Routes API
app.get('/api/licences', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM licences ORDER BY softwareName');
    res.json(rows);
  } catch (error) {
    console.error('Erreur GET /api/licences:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des licences' });
  }
});

app.post('/api/licences', async (req, res) => {
  const licence = req.body;
  
  // Validation des données
  if (!licence.softwareName || !licence.vendor || !licence.version || !licence.type || 
      !licence.purchaseDate || !licence.expirationDate || licence.initialCost === undefined) {
    return res.status(400).json({ error: 'Données manquantes ou invalides' });
  }
  
  try {
    await pool.query(
      `INSERT INTO licences (id, softwareName, vendor, version, type, seats, purchaseDate, expirationDate, initialCost, assignedTo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        licence.id, 
        licence.softwareName, 
        licence.vendor, 
        licence.version, 
        licence.type, 
        licence.seats || 1, 
        licence.purchaseDate, 
        licence.expirationDate, 
        licence.initialCost, 
        licence.assignedTo || null
      ]
    );
    res.status(201).json({ id: licence.id, message: 'Licence créée avec succès' });
  } catch (error) {
    console.error('Erreur POST /api/licences:', error);
    if (error.code === '23505') { // Violation de contrainte unique
      res.status(409).json({ error: 'Cette licence existe déjà' });
    } else {
      res.status(500).json({ error: 'Erreur lors de la création de la licence' });
    }
  }
});

app.put('/api/licences/:id', async (req, res) => {
  const licence = req.body;
  const id = req.params.id;
  
  // Validation des données
  if (!licence.softwareName || !licence.vendor || !licence.version || !licence.type || 
      !licence.purchaseDate || !licence.expirationDate || licence.initialCost === undefined) {
    return res.status(400).json({ error: 'Données manquantes ou invalides' });
  }
  
  try {
    const result = await pool.query(
      `UPDATE licences 
       SET softwareName=$2, vendor=$3, version=$4, type=$5, seats=$6, purchaseDate=$7, expirationDate=$8, initialCost=$9, assignedTo=$10, updatedAt=CURRENT_TIMESTAMP 
       WHERE id=$1`,
      [
        id, 
        licence.softwareName, 
        licence.vendor, 
        licence.version, 
        licence.type, 
        licence.seats || 1, 
        licence.purchaseDate, 
        licence.expirationDate, 
        licence.initialCost, 
        licence.assignedTo || null
      ]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Licence non trouvée' });
    }
    
    res.json({ id, message: 'Licence mise à jour avec succès' });
  } catch (error) {
    console.error('Erreur PUT /api/licences/:id:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la licence' });
  }
});

app.delete('/api/licences/:id', async (req, res) => {
  const id = req.params.id;
  
  try {
    const result = await pool.query('DELETE FROM licences WHERE id=$1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Licence non trouvée' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Erreur DELETE /api/licences/:id:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la licence' });
  }
});

// Route pour servir l'application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Gestion des erreurs globales
process.on('uncaughtException', (error) => {
  console.error('Erreur non gérée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesse rejetée non gérée:', reason);
});

// Démarrage du serveur
async function startServer() {
  await initDatabase();
  app.listen(port, () => {
    console.log(`🚀 Serveur démarré sur le port ${port}`);
    console.log(`📱 Application accessible sur: http://localhost:${port}`);
  });
}

startServer().catch(error => {
  console.error('❌ Erreur lors du démarrage du serveur:', error);
  process.exit(1);
});
