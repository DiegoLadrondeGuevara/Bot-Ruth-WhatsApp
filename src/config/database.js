/**
 * Configuración de Base de Datos — PostgreSQL
 */

const { Pool } = require('pg');
const env = require('./env');
const botConfig = require('./bot.config');

const pool = new Pool({
  connectionString: env.database.url,
  max: botConfig.database.poolMax,
  idleTimeoutMillis: botConfig.database.idleTimeoutMillis,
  connectionTimeoutMillis: botConfig.database.connectionTimeoutMillis,
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en pool de PostgreSQL:', err.message);
});

const initDatabase = async () => {
  const client = await pool.connect();
  try {
    // 1. Tabla de Clientes (Genérica para Dulce Ruth)
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255),
        client_type VARCHAR(50), -- (Emprendedor, Pastelería, Revendedor)
        location VARCHAR(100),   -- (Lima, Provincia)
        first_contact TIMESTAMPTZ DEFAULT NOW(),
        last_contact TIMESTAMPTZ DEFAULT NOW(),
        message_count INTEGER DEFAULT 1,
        metadata JSONB DEFAULT '{}'
      );
    `);

    // 2. Tabla de Conversaciones (Igual, pero agregamos índice de rendimiento)
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        response TEXT,
        model VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations(phone);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at DESC);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);`);

    console.log('✅ Base de datos inicializada (Estructura de 3 escenarios lista)');
  } catch (error) {
    console.error('❌ Error al inicializar base de datos:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { pool, initDatabase };