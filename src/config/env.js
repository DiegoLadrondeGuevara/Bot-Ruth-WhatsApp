/**
 * Configuración centralizada del entorno.
 * Carga .env una sola vez y exporta todas las variables agrupadas por servicio.
 */

const path = require('path');
// Ajustamos la ruta para asegurar que encuentre el .env correctamente
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const REQUIRED_VARS = [
    'YCLOUD_API_KEY',
    'YCLOUD_WHATSAPP_NUMBER',
    'DATABASE_URL',
    'ASSETS_BASE_URL'
];

// Validar variables requeridas
REQUIRED_VARS.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`❌ Variable de entorno faltante: ${varName}`);
        console.error(`   Asegúrate de haberla añadido a tu archivo .env local`);
        process.exit(1);
    }
});

const parseWhitelist = () => {
    const raw = process.env.WHITELIST_NUMBERS || '';
    return raw
        .split(',')
        .map((n) => n.trim())
        .filter((n) => n.length > 0);
};

const env = {
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    isDev: (process.env.NODE_ENV || 'development') === 'development',

    ycloud: {
        apiKey: process.env.YCLOUD_API_KEY,
        apiUrl: process.env.YCLOUD_API_URL || 'https://api.ycloud.com/v2',
        whatsappNumber: process.env.YCLOUD_WHATSAPP_NUMBER,
        phoneNumberId: process.env.YCLOUD_PHONE_NUMBER_ID || '',
    },

    whitelist: parseWhitelist(),

    database: {
        url: process.env.DATABASE_URL,
    },

    google: {
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        credentialsPath: process.env.GOOGLE_CREDENTIALS_PATH || 'credentials/google-sheets-key.json',
    },

    assetsBaseUrl: process.env.ASSETS_BASE_URL,
    
    // Fallback if needed
    assets: {
        baseUrl: process.env.ASSETS_BASE_URL || `http://localhost:${process.env.PORT || 3000}/assets/`,
    },
};

module.exports = env;