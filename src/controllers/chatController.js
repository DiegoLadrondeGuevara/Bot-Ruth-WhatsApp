/**
 * Controlador del Chat — Dulce Ruth Bot
 * Gestiona IA, Comandos (Catalogo, Promos, Cooler) y Reportes.
 */

const { sendMessage, sendImage, sendDocument } = require('../services/whatsappService');
const { getChatResponse } = require('../services/aiService');
const { saveAppointment } = require('../services/googleSheetsService');
const { pool } = require('../config/database');
const botConfig = require('../config/bot.config');

/**
 * Procesa los comandos incrustados en la respuesta de la IA.
 */
const processBotCommands = async (text, phone) => {
    let cleanText = text;

    // 1. [SHOW_CATALOG]
    if (cleanText.includes('[SHOW_CATALOG]')) {
        const catalogUrl = `${botConfig.assets.baseUrl}${botConfig.assets.map.catalogo}`;
        await sendDocument(phone, catalogUrl, "Catalogo_Dulce_Ruth.pdf");
        cleanText = cleanText.replace(/\[SHOW_CATALOG\]/g, '');
    }

    // 2. [SHOW_PROMO]
    if (cleanText.includes('[SHOW_PROMO]')) {
        const promoUrl = `${botConfig.assets.baseUrl}${botConfig.assets.map.promo}`;
        const caption = botConfig.assets.captions["promo_semana.jpg"];
        await sendImage(phone, promoUrl, caption);
        cleanText = cleanText.replace(/\[SHOW_PROMO\]/g, '');
    }

    // 3. [CALC_COOLER]
    if (cleanText.includes('[CALC_COOLER]')) {
        // En este bot, el cálculo lo hace la IA en texto, pero el comando 
        // podría disparar una lógica interna si fuera necesario.
        // Por ahora lo removemos del texto que ve el usuario.
        cleanText = cleanText.replace(/\[CALC_COOLER\]/g, '');
    }

    // 4. [ALERT_HUMAN]
    if (cleanText.includes('[ALERT_HUMAN]')) {
        console.log(`🚨 ALERTA: Pedido mayorista detectado para ${phone}`);
        // Aquí se podría enviar un mensaje al admin
        cleanText = cleanText.replace(/\[ALERT_HUMAN\]/g, '');
    }

    // 5. JSON Report (READY_FOR_HUMAN)
    const jsonMatch = cleanText.match(/\{[\s\S]*?"status":\s*"READY_FOR_HUMAN"[\s\S]*?\}/);
    if (jsonMatch) {
        try {
            const reportData = JSON.parse(jsonMatch[0]);
            reportData.phone = phone;
            // await saveAppointment(reportData); // Deshabilitado para pruebas iniciales
            cleanText = cleanText.replace(jsonMatch[0], '').trim();
        } catch (e) {
            console.error('❌ Error al procesar JSON de reporte:', e.message);
        }
    }

    return cleanText.trim();
};

/**
 * Lógica principal del Bot
 */
const handleIncomingMessage = async (messageData) => {
    const from = messageData.from;
    const body = messageData.text?.body || '';

    if (!from || !body) return;

    try {
        // 1. Obtener respuesta de la IA
        const aiResponse = await getChatResponse(from, body);

        // 2. Procesar Comandos y Limpiar Texto
        const finalMessage = await processBotCommands(aiResponse, from);

        // 3. Enviar mensaje de texto final (si quedó algo después de los comandos)
        if (finalMessage) {
            await sendMessage(from, finalMessage);
        }

        // 4. Guardar en DB para memoria
        await pool.query(
            'INSERT INTO conversations (phone, message, response, model) VALUES ($1, $2, $3, $4)',
            [from, body, finalMessage, 'gemini-2.0-flash']
        );

    } catch (error) {
        console.error(`❌ Error procesando mensaje de ${from}:`, error.message);
    }
};

module.exports = { handleIncomingMessage };

module.exports = { handleIncomingMessage };