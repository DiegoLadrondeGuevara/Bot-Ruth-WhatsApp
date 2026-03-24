/**
 * Controlador del Chat — Dulce Ruth Bot
 * Gestiona IA, Comandos (Catalogo, Promos, Cooler) y Reportes.
 */

const { sendMessage, sendImage, sendDocument } = require('../services/whatsappService');
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
            logger.error('Error al procesar JSON de reporte', 'ChatController', e);
        }
    }

    return cleanText.trim();
};

/**
 * Obtiene o crea el estado del cliente en la DB.
 */
const getClientState = async (phone) => {
    try {
        const res = await pool.query('SELECT * FROM clients WHERE phone = $1', [phone]);
        if (res.rows.length > 0) {
            return res.rows[0];
        }
        // Crear cliente si no existe
        const newClient = await pool.query(
            'INSERT INTO clients (phone, metadata) VALUES ($1, $2) RETURNING *',
            [phone, { stage: 'WELCOME' }]
        );
        return newClient.rows[0];
    } catch (e) {
        logger.error('Error al obtener estado del cliente', `DB:${phone}`, e);
        return { phone, metadata: { stage: 'WELCOME' } };
    }
};

/**
 * Actualiza el estado del cliente.
 */
const updateClientState = async (phone, data) => {
    try {
        const { stage, name, client_type, location, metadata } = data;
        await pool.query(
            `UPDATE clients SET 
             name = COALESCE($2, name), 
             client_type = COALESCE($3, client_type), 
             location = COALESCE($4, location), 
             metadata = $5,
             last_contact = NOW() 
             WHERE phone = $1`,
            [phone, name, client_type, location, metadata]
        );
    } catch (e) {
        logger.error('Error al actualizar estado del cliente', `DB:${phone}`, e);
    }
};

/**
 * Lógica principal del Bot (MÁQUINA DE ESTADOS)
 */
const handleIncomingMessage = async (messageData) => {
    const from = messageData.from;
    const bodyText = (messageData.text?.body || '').trim();
    const bodyLower = bodyText.toLowerCase();

    if (!from || !bodyText) return;

    try {
        const client = await getClientState(from);
        let stage = client.metadata?.stage || 'WELCOME';
        let responseText = '';
        let nextStage = stage;
        let updateData = { metadata: client.metadata || {} };

        // --- MANEJO DE ESTADOS ---
        switch (stage) {
            case 'AWAITING_NAME':
                updateData.name = bodyText;
                responseText = `¡Gracias, ${bodyText}! ¿De qué ciudad te contactas? (Ej: Lima, Arequipa, Trujillo...)`;
                nextStage = 'AWAITING_CITY';
                break;

            case 'AWAITING_CITY':
                updateData.location = bodyText;
                let coolerMsg = '';
                if (bodyLower !== 'lima') {
                    coolerMsg = '\n\n*Nota para Provincia:* Recuerde que para productos congelados se le cobrara un monto por un cooler de 26 soles. De necesitar más capacidad, se acordará con el asesor.';
                }
                responseText = `Entendido. ¿Qué tipo de cliente eres? Elije una opción:\n1. Emprendedor\n2. Pastelería grande\n3. Revendedor${coolerMsg}`;
                nextStage = 'AWAITING_CLIENT_TYPE';
                break;

            case 'AWAITING_CLIENT_TYPE':
                const types = { '1': 'Emprendedor', '2': 'Pastelería grande', '3': 'Revendedor' };
                updateData.client_type = types[bodyText] || bodyText;
                responseText = 'Excelente. Finalmente, envíame tu lista de productos o lo que te gustaría cotizar para que el asesor pueda ayudarte rápido.';
                nextStage = 'AWAITING_ORDER_LIST';
                break;

            case 'AWAITING_ORDER_LIST':
                responseText = '¡Perfecto! He recibido tu solicitud. Te estoy derivando ahora mismo con un asesor para cerrar tu cotización. ¡Muchas gracias! 🙏 [ALERT_HUMAN]';
                nextStage = 'WELCOME';
                break;

            case 'WELCOME':
            default:
                // Menú Principal o Preguntas Frecuentes
                if (bodyText === '1' || bodyLower.includes('catalogo web') || bodyLower.includes('catálogo web')) {
                    responseText = '¡Claro! Aquí puedes ver nuestro catálogo completo y realizar tu pedido: https://dulceruth.pe/ 🍰';
                } else if (bodyText === '2' || bodyLower.includes('catalogo pdf') || bodyLower.includes('catálogo pdf')) {
                    responseText = 'Aquí tienes nuestro catálogo en PDF para que lo revises con calma. [SHOW_CATALOG]';
                } else if (bodyText === '3' || bodyLower.includes('promo')) {
                    responseText = '¡Esta es nuestra promoción de la semana! No te la pierdas. 🔥 [SHOW_PROMO]';
                } else if (bodyText === '4' || bodyLower.includes('cotizar') || bodyLower.includes('cotizacion')) {
                    responseText = 'Me gustaría algunos datos para comenzar la cotización con un asesor y agilizar la compra. ¿Cuál es tu nombre?';
                    nextStage = 'AWAITING_NAME';
                } else if (bodyText === '5' || bodyLower.includes('duda')) {
                    responseText = '¿Qué te gustaría saber? Pregúntame sobre Harina, Chocolate, Aceite o Crema de Leche.';
                } else if (bodyLower.includes('harina')) {
                    responseText = 'Contamos con Harina Panadera (ideal para queques, más hinchado) y Pastelera (menos hinchado).';
                } else if (bodyLower.includes('chocolate')) {
                    responseText = 'Para chocotejas sugerimos chocolate económico. Para tortas Premium, usamos chocolate de alta calidad (más costoso).';
                } else if (bodyLower.includes('aceite')) {
                    responseText = 'Tenemos Aceite Pastelero para masas y Aceite para freír de alto rendimiento.';
                } else if (bodyLower.includes('crema')) {
                    responseText = 'La crema de leche con más grasa tiene mejor montado. También tenemos crema vegetal (sin origen animal).';
                } else {
                    responseText = `*¡Hola! Te damos la bienvenida a ${botConfig.businessName}!* 🍰\n\n` +
                                   `Elige una opción enviando el número:\n` +
                                   `1️⃣ Ver catálogo web\n` +
                                   `2️⃣ Ver catálogo PDF\n` +
                                   `3️⃣ Ver promo de la semana\n` +
                                   `4️⃣ Cotizar con un asesor 👨‍🍳\n` +
                                   `5️⃣ ¿Tienes dudas? (Harina, Chocolate, etc)\n\n` +
                                   `Si no entiendo tu pregunta, te derivaré con un asesor.`;
                }
                break;
        }

        // Guardar nuevo estado
        updateData.metadata.stage = nextStage;
        await updateClientState(from, updateData);

        // procesar comandos
        const finalMessage = await processBotCommands(responseText, from);
        if (finalMessage) {
            await sendMessage(from, finalMessage);
        }

        // log de conversación
        await pool.query(
            'INSERT INTO conversations (phone, message, response, model) VALUES ($1, $2, $3, $4)',
            [from, bodyText, finalMessage, 'state-machine']
        );

    } catch (error) {
        logger.error(`Error procesando mensaje de ${from}`, 'ChatController', error);
    }
};

module.exports = { handleIncomingMessage };