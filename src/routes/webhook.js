/**
 * Rutas de Webhook — Endpoints para YCloud
 */

const express = require('express');
const { handleIncomingMessage } = require('../controllers/chatController');
const env = require('../config/env');
const botConfig = require('../config/bot.config');

const router = express.Router();

/**
 * POST /webhook/whatsapp
 * Recibe webhooks de YCloud cuando llega un mensaje o cambio de estado.
 */
router.post('/whatsapp', async (req, res) => {
    const data = req.body;

    // Responder inmediatamente a YCloud para evitar reintentos
    res.sendStatus(200);

    // Procesar solo mensajes recibidos
    if (data.type === 'whatsapp.inbound_message.received') {
        const message = data.whatsappInboundMessage;
        const from = message.from;

        // --- FILTRO DE LISTA BLANCA ---
        if (env.whitelist.length > 0 && !env.whitelist.some(num => from.includes(num))) {
            console.log(`⚠️ Mensaje de ${from} IGNORADO (No está en la lista blanca)`);
            return;
        }

        try {
            await handleIncomingMessage(message);
        } catch (error) {
            console.error('❌ Error procesando webhook:', error.message);
        }
    } else {
        console.log(`📋 Evento de YCloud ignorado: ${data.type || 'desconocido'}`);
    }
});

/**
 * GET /webhook/whatsapp
 * Health check / verificación del endpoint de webhook.
 */
router.get('/whatsapp', (req, res) => {
    res.json({ status: 'ok', service: `${botConfig.botName} — Webhook activo` });
});

module.exports = router;
