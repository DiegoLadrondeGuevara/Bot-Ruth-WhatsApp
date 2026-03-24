/**
 * Bot Config — Identidad y parámetros del negocio
 * Este es el ÚNICO archivo que necesitas editar para replicar el bot
 * en otro negocio.
 */

const path = require('path');
const env = require('./env');

module.exports = {
    // ── Identidad ──
    botName: 'Dulce Ruth Bot',
    businessName: 'Dulce Ruth',
    serviceName: 'Automatización Dulce Ruth',
    websiteUrl: '',

    // ── Localización ──
    locale: 'es-PE',
    timezone: 'America/Lima',
    templateLanguage: 'es',

    // ── Mensajes Estructurados por Escenario ──
    messages: {
        welcome: '¡Hola! Te saluda el asistente virtual de Dulce Ruth. 🍰\n\n¿En qué podemos ayudarte hoy? Si eres de provincia o estás en Lima, cuéntanos para darte la mejor atención.',
    },

    // ── Tarifas (Ejemplo, adaptables) ──
    pricing: {
        cooler: 'S/26', // Costo fijo sugerido para cooler
    },

    // ── Parámetros Técnicos (IA y DB) ──
    ai: {
        maxTokens: 800,
        temperature: 0.5, // Bajamos temp para ser más preciso con comandos
        timeout: 30000,
        historyLimit: 10,
    },

    delays: {
        afterWelcome: 1000,
        afterAction: 800,
    },

    sheets: {
        sheetName: 'Pedidos_Dulce_Ruth',
        headerRange: 'A1:H1',
        dataRange: 'A2:H',
        headers: ['FECHA', 'CLIENTE', 'TIPO', 'DESTINO', 'PEDIDO', 'ESTADO', 'TOTAL', 'JSON_REPORTE'],
        defaultStatus: 'Pendiente',
    },

    timeouts: {
        whatsapp: 15000,
        backend: 10000,
    },

    database: {
        poolMax: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
    },
    // src/config/bot.config.js
    // src/config/bot.config.js
    assets: {
        baseUrl: env.assets.baseUrl,
        map: {
            "catalogo": "catalogo_general.pdf",
            "promo": "promo_semana.jpg",
        },
        captions: {
            "promo_semana.jpg": `🔥 ¡PROMO DE LA SEMANA EN DULCE RUTH! 🔥\n\nAprovecha nuestras ofertas exclusivas para pastelerías y emprendedores.`,
        }
    },

    // ── Ruta al System Prompt ──
    systemPromptPath: path.resolve(__dirname, 'prompts/system-prompt.md'),
};