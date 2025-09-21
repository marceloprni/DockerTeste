const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv')

dotenv.config()

const APP_PORT = process.env.APP_PORT || 3000;
const POSTGRES_HOST = process.env.POSTGRES_HOST || 'db';
const POSTGRES_PORT = process.env.POSTGRES_PORT || 5432;
const POSTGRES_DB = process.env.POSTGRES_DB || 'myapp';
const POSTGRES_USER = process.env.POSTGRES_USER || 'myuser';
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'secret';
const DATABASE_URL = process.env.DATABASE_URL 

const pool = new Pool({ connectionString: DATABASE_URL });

(async () => {
const client = await pool.connect();
try {
await client.query(
'CREATE TABLE IF NOT EXISTS visits (id serial primary key, ts timestamptz default now());'
);
} catch (err) {
console.error('Erro ao criar tabela:', err);
process.exit(1);
} finally {
client.release();
}
})().catch(err => {
console.error('Erro de inicialização da DB:', err);
process.exit(1);
});

const app = express();

app.get('/health', (req, res) => {
res.json({ ok: true, uptime: process.uptime() });
});

app.get('/db-check', async (req, res) => {
try {
const r = await pool.query('SELECT now() as db_time;');
res.json({ ok: true, db_time: r.rows[0].db_time });
} catch (e) {
res.status(500).json({ ok: false, error: e.message });
}
});

app.post('/visit', async (req, res) => {
try {
await pool.query('INSERT INTO visits DEFAULT VALUES;');
const count = await pool.query('SELECT count(*)::int as total FROM visits;');
res.json({ ok: true, visits: count.rows[0].total });
} catch (e) {
res.status(500).json({ ok: false, error: e.message });
}
});

app.get('/', async (req, res) => {
try {
const count = await pool.query('SELECT count(*)::int as total FROM visits;');
res.json({ message: 'Hello from app container', visits: count.rows[0].total });
} catch (e) {
res.status(500).json({ ok: false, error: e.message });
}
});

const server = app.listen(APP_PORT, () => {
console.log(`Server listening on port ${APP_PORT}`);
});

process.on('SIGTERM', () => {
console.log('SIGTERM recebido, encerrando...');
server.close(() => {
pool.end().then(() => process.exit(0));
});
});