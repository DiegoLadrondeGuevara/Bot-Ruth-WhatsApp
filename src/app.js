/**
 * Dulce Ruth Bot — Entrada principal
 * Servidor Express que recibe webhooks de YCloud y sirve imágenes desde Hostinger.
 */

const express = require('express');
const path = require('path'); // Importante para las rutas de archivos
const env = require('./config/env');
const { initDatabase } = require('./config/database');
const webhookRoutes = require('./routes/webhook');
const { initializeSheet } = require('./services/googleSheetsService');
const botConfig = require('./config/bot.config');

const app = express();

// --- Middleware ---
app.use(express.json());

/**
 * 🖼️ SERVIDOR DE IMÁGENES (HOSTINGER)
 * Esta línea permite que si subes una imagen a la carpeta /public/assets,
 * sea accesible vía URL: https://tu-dominio.com/assets/imagen.jpg
 */
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// Logging básico de requests (solo en desarrollo)
if (env.isDev) {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// --- Rutas ---
app.use('/webhook', webhookRoutes);

// Health check raíz
app.get('/', (req, res) => {
    res.json({
        service: botConfig.serviceName,
        status: 'running',
        environment: env.nodeEnv,
    });

});

const logger = require('./utils/logger');

// --- Manejo de errores global ---
app.use((err, req, res, next) => {
    logger.error('Error no manejado en la aplicación', `Express:${req.method}${req.path}`, err);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        message: env.isDev ? err.message : undefined 
    });
});


// --- Arranque ---
const start = async () => {
    try {
        // Inicializar base de datos (crear tablas si no existen)
        await initDatabase();

        // Verificar conexión a Google Sheets
        await initializeSheet();

        app.listen(env.port, () => {
            console.log(`\n🚀 ${botConfig.serviceName} operando en puerto ${env.port}`);
            console.log(`   Entorno: ${env.nodeEnv}`);
            console.log(`   Imágenes activas en: http://localhost:${env.port}/assets/`);
            console.log(`   Webhook: http://localhost:${env.port}/webhook/whatsapp\n`);
        });

    } catch (error) {
        console.error('❌ Error al arrancar el servidor:', error.message);
        process.exit(1);
    }
};

start();