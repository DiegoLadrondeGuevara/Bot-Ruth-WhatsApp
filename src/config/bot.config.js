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
    // --- Configuración de Flujo y Validación ---
    flow: {
        timeoutMinutes: 10,
        maxNameRetries: 3,
        invalidNameKeywords: ['hola', 'cotizar', 'quiero', 'lista', 'pedido', 'buenas', 'buenos dias', 'ayuda', 'asesor', 'hola buen día'],
        orderEndKeywords: ['listo', 'seria todo', 'con eso', 'nada mas', 'terminar', 'cerrar'],
        welcomeKeywords: ['hola', 'buenas', 'buenos dias', 'buen dia', 'cotizar', 'cotizacion', 'ayuda', 'asesor', 'hola buen día', 'me gustaría cotizar'],
        costs: { cooler: 26, reinforced: 10 },
    },



    // src/config/bot.config.js
    // src/config/bot.config.js
    assets: {
        baseUrl: env.assetsBaseUrl || "https://demo-bot-ruth.s3.us-east-1.amazonaws.com/",
        map: {
            "catalogo": "https://www.canva.com/design/DAHCR5xEBTI/0uzhiEnlvdg59ZdVmCnBVQ/watch?utm_content=DAHCR5xEBTI&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hb49804ff6d",
            "promo": "promo_semana.jpg",
            "pasos_envio": "pasos_para+_enviar_tu_pedido.jpg",
            "importante_envio": "importante_provincia.jpg",
            "promo_pascua_1": "oferta1_obleas_bitter.jpg",
            "promo_pascua_2": "oferta2_obleas_sabor_a_chocolate_blanco.jpg",
        },


        captions: {
            "promo_semana.jpg": `🔥 ¡PROMO DE LA SEMANA EN DULCE RUTH! 🔥\n\nAprovecha nuestras ofertas exclusivas para pastelerías y emprendedores.`,
            "oferta1_obleas_bitter.jpg": `✨ ¡NUEVA OFERTA DE PASCUA! ✨\n\nObleas Bitter de alta calidad para tus preparaciones más exquisitas. 🍫`,
            "oferta2_obleas_sabor_a_chocolate_blanco.jpg": `🐰 DULCE PASCUA CON DULCE RUTH 🐰\n\nObleas sabor a Chocolate Blanco, ¡ideales para esta temporada! 🥚`,
        }

    },

    // ── Ruta al System Prompt ──
    systemPromptPath: path.resolve(__dirname, 'prompts/system-prompt.md'),
};