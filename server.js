const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_4CZjFw7LgDfm@ep-wandering-water-ae65l2a7-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function init() {
  await pool.query(`CREATE TABLE IF NOT EXISTS licences (
    id TEXT PRIMARY KEY,
    softwareName TEXT,
    vendor TEXT,
    version TEXT,
    type TEXT,
    seats INTEGER,
    purchaseDate DATE,
    expirationDate DATE,
    initialCost REAL,
    assignedTo TEXT
  )`);
}

init().catch(err => console.error('DB init error', err));

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/api/licences', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM licences ORDER BY softwareName');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

app.post('/api/licences', async (req, res) => {
  const l = req.body;
  try {
    await pool.query(
      'INSERT INTO licences (id, softwareName, vendor, version, type, seats, purchaseDate, expirationDate, initialCost, assignedTo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [l.id, l.softwareName, l.vendor, l.version, l.type, l.seats, l.purchaseDate, l.expirationDate, l.initialCost, l.assignedTo]
    );
    res.status(201).json({ id: l.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

app.put('/api/licences/:id', async (req, res) => {
  const l = req.body;
  const id = req.params.id;
  try {
    await pool.query(
      'UPDATE licences SET softwareName=$2, vendor=$3, version=$4, type=$5, seats=$6, purchaseDate=$7, expirationDate=$8, initialCost=$9, assignedTo=$10 WHERE id=$1',
      [id, l.softwareName, l.vendor, l.version, l.type, l.seats, l.purchaseDate, l.expirationDate, l.initialCost, l.assignedTo]
    );
    res.json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

app.delete('/api/licences/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM licences WHERE id=$1', [id]);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

app.listen(port, () => console.log(`Server listening on port ${port}`));
