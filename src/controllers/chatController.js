/**
 * Controlador del Chat — Dulce Ruth Bot
 * Gestiona IA, Comandos (Catalogo, Promos, Cooler) y Reportes.
 */

const { sendMessage, sendImage, sendDocument } = require('../services/whatsappService');
const { pool } = require('../config/database');
const botConfig = require('../config/bot.config');
const logger = require('../utils/logger');

/**
 * Procesa los comandos incrustados en la respuesta de la IA.
 */
const processBotCommands = async (text, phone) => {
    let cleanText = text;

    // 1. [SHOW_CATALOG_PASCUA]
    if (cleanText.includes('[SHOW_CATALOG_PASCUA]')) {
        const catalogUrl = `${botConfig.assets.baseUrl}${botConfig.assets.map.catalogo_pascua}`;
        await sendDocument(phone, catalogUrl, "Catalogo_Pascua_Dulce_Ruth.pdf");
        cleanText = cleanText.replace(/\[SHOW_CATALOG_PASCUA\]/g, '');
    }

    // 1b. [SHOW_CATALOG_MADRE]
    if (cleanText.includes('[SHOW_CATALOG_MADRE]')) {
        const catalogUrl = `${botConfig.assets.baseUrl}${botConfig.assets.map.catalogo_madre}`;
        await sendDocument(phone, catalogUrl, "Catalogo_Dia_de_la_Madre_Dulce_Ruth.pdf");
        cleanText = cleanText.replace(/\[SHOW_CATALOG_MADRE\]/g, '');
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
        cleanText = cleanText.replace(/\[CALC_COOLER\]/g, '');
    }

    // 4. Alerta Humana (Emoji)
    if (cleanText.includes('🚨🧑💼')) {
        console.log(`🚨 ALERTA: Pedido detectado para ${phone}`);
        // No removemos los emojis porque el usuario quiere que se vean para el cliente
    }


    // 5. [SHOW_SHIPPING_STEPS]
    if (cleanText.includes('[SHOW_SHIPPING_STEPS]')) {
        const url = `${botConfig.assets.baseUrl}${botConfig.assets.map.pasos_envio}`;
        await sendImage(phone, url, "Pasos para enviar tu pedido 📦");
        cleanText = cleanText.replace(/\[SHOW_SHIPPING_STEPS\]/g, '');
    }

    // 6. [SHOW_IMPORTANTE]
    if (cleanText.includes('[SHOW_IMPORTANTE]')) {
        const url = `${botConfig.assets.baseUrl}${botConfig.assets.map.importante_envio}`;
        await sendImage(phone, url, "Información importante para envíos");
        cleanText = cleanText.replace(/\[SHOW_IMPORTANTE\]/g, '');
    }

    // 7. JSON Report (READY_FOR_HUMAN)
    const jsonMatch = cleanText.match(/\{[\s\S]*?"status":\s*"READY_FOR_HUMAN"[\s\S]*?\}/);
    if (jsonMatch) {
        try {
            const reportData = JSON.parse(jsonMatch[0]);
            reportData.phone = phone;
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
        const { stage, name, client_type, location, is_bot_active, metadata } = data;
        await pool.query(
            `UPDATE clients SET 
             name = COALESCE($2, name), 
             client_type = COALESCE($3, client_type), 
             location = COALESCE($4, location), 
             is_bot_active = COALESCE($5, is_bot_active),
             metadata = $6,
             last_contact = NOW() 
             WHERE phone = $1`,
            [phone, name, client_type, location, is_bot_active, metadata]
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
        const isBotActive = client.is_bot_active !== false; // Default true
        let stage = client.metadata?.stage || 'WELCOME';
        let responseText = '';
        let nextStage = stage;
        let updateData = { metadata: client.metadata || {} };

        // --- REACTIVATION COMMAND ---
        if (bodyLower === botConfig.flow.reactivationCommand) {
            await updateClientState(from, { is_bot_active: true });
            await sendMessage(from, '🤖 *Bot reactivado.* Volveré a responder tus consultas de forma automática. ✨');
            return;
        }

        // --- HANDOFF CHECK ---
        if (!isBotActive) {
            console.log(`ℹ️ Bot desactivado para ${from}. Ignorando mensaje.`);
            return;
        }

        // --- GLOBAL OVERRIDE: ASESOR / HANDOFF KEYWORDS ---
        const isHandoffRequest = botConfig.flow.handoffKeywords.some(kw => bodyLower.includes(kw));
        if (isHandoffRequest) {
            responseText = 'Entendido. He desactivado mis respuestas automáticas y he avisado a un asesor humano para que te ayude de inmediato. ¡Muchas gracias por tu paciencia! 🙏 🚨🧑💼';

            nextStage = 'WELCOME';
            updateData.metadata.stage = nextStage;
            updateData.is_bot_active = false;
            await updateClientState(from, updateData);
            await sendMessage(from, responseText);
            await processBotCommands('🚨🧑💼', from); // Alerta interna
            return;
        }

        // --- MANEJO DE ESTADOS ---
        switch (stage) {
            case 'AWAITING_NAME':
                // Validación de nombre
                const isInvalidName = botConfig.flow.invalidNameKeywords.some(kw => bodyLower.includes(kw));
                const retries = (updateData.metadata.name_retries || 0);

                if (isInvalidName && retries < botConfig.flow.maxNameRetries) {
                    updateData.metadata.name_retries = retries + 1;
                    responseText = `Lo siento, eso no parece un nombre. 😅 Por favor, indícame tu nombre real para continuar con la cotización. (Intento ${updateData.metadata.name_retries}/${botConfig.flow.maxNameRetries})`;
                    nextStage = 'AWAITING_NAME';
                } else if (isInvalidName && retries >= botConfig.flow.maxNameRetries) {
                    responseText = 'Veo que tenemos problemas con el nombre. No te preocupes, te derivaré con un asesor para que te ayude personalmente. 🙏 🚨🧑💼';

                    nextStage = 'WELCOME';
                    updateData.metadata.name_retries = 0;
                } else {
                    updateData.name = bodyText;
                    updateData.metadata.name_retries = 0;
                    responseText = `¡Un gusto saludarte, ${bodyText}! ✨ ¿Desde qué ciudad nos escribes? (Ej: Lima, Arequipa, Trujillo...)`;
                    nextStage = 'AWAITING_CITY';
                }
                break;

            case 'AWAITING_CITY':
                updateData.location = bodyText;
                if (bodyLower !== 'lima') {
                    responseText = 'Para envíos a provincia, necesito que me envíes los siguientes datos:\n\n' +
                        '✅ Nombre completo\n' +
                        '✅ DNI\n' +
                        '✅ Celular\n' +
                        '✅ Ciudad\n' +
                        '✅ Agencia (Shalom o Marvisur)\n\n' +
                        'Puedes enviarlos en un solo mensaje o por separado. Cuando termines, escribe *"Listo"*.';
                    nextStage = 'AWAITING_SHIPPING_DATA';
                    updateData.metadata.shipping_info = '';
                } else {
                    responseText = `Entendido. ¿Qué tipo de cliente eres? Elije una opción:\n1. Emprendedor\n2. Pastelería grande\n3. Revendedor`;
                    nextStage = 'AWAITING_CLIENT_TYPE';
                }
                break;

            case 'AWAITING_SHIPPING_DATA':
                const isDataDone = botConfig.flow.orderEndKeywords.some(kw => bodyLower.includes(kw));
                if (isDataDone) {
                    responseText = '*IMPORTANTE PARA TU ENVÍO:* 📦\n\n' +
                        '• El despacho es al día siguiente del pago.\n' +
                        '• El envío se paga directamente a la agencia al recibir/enviar.\n' +
                        '• *Lácteos/Cremas:* Es obligatorio usar Cooler de Tecnopor (S/ 26).\n' +
                        '• *Garantía:* Ofrecemos Embalaje Reforzado por S/ 10 para que todo llegue perfecto.\n\n' +
                        '[SHOW_SHIPPING_STEPS] [SHOW_IMPORTANTE]\n\n' +
                        '¿Qué tipo de cliente eres? Elije una opción:\n1. Emprendedor\n2. Pastelería grande\n3. Revendedor';
                    nextStage = 'AWAITING_CLIENT_TYPE';
                } else {
                    const currentInfo = updateData.metadata.shipping_info || '';
                    updateData.metadata.shipping_info = `${currentInfo}\n${bodyText}`.trim();
                    responseText = ''; // SILENCIO
                    nextStage = 'AWAITING_SHIPPING_DATA';
                }
                break;

            case 'AWAITING_CLIENT_TYPE':
                const types = { '1': 'Emprendedor', '2': 'Pastelería grande', '3': 'Revendedor' };
                updateData.client_type = types[bodyText] || bodyText;
                responseText = 'Excelente. Ahora, envíame tu lista de productos. Puedes enviar varios mensajes si es necesario. Cuando termines, escribe *"Listo"* o *"Eso es todo"*.';
                nextStage = 'AWAITING_ORDER_LIST';
                updateData.metadata.temp_order = ''; // Inicializar lista
                break;

            case 'AWAITING_ORDER_LIST':
                const isFinishing = botConfig.flow.orderEndKeywords.some(kw => bodyLower.includes(kw));

                if (isFinishing) {
                    const finalOrder = (updateData.metadata.temp_order || 'Sin detalles').trim();
                    responseText = `¡Cotización cerrada! He recibido estos productos:\n${finalOrder}\n\nTe estoy derivando con un asesor para finalizar. ¡Muchas gracias! 🙏 🚨🧑💼`;

                    nextStage = 'WELCOME';
                    updateData.metadata.temp_order = '';
                } else {
                    // Acumular
                    const currentOrder = updateData.metadata.temp_order || '';
                    updateData.metadata.temp_order = `${currentOrder}\n- ${bodyText}`.trim();
                    responseText = ''; // SILENCIO
                    nextStage = 'AWAITING_ORDER_LIST';
                }
                break;

            case 'WELCOME':
            default:
                const isGreeting = botConfig.flow.welcomeKeywords.some(kw => bodyLower.includes(kw));

                if (bodyText === '1' || bodyLower.includes('todos los productos')) {
                    responseText = '¡Claro que sí! 🍰 Aquí puedes ver toda nuestra variedad y hacer tu pedido: https://dulceruth.pe/';
                } else if (bodyText === '2' || bodyLower.includes('catálogo de pascua') || bodyLower.includes('pascua')) {
                    responseText = `¡Claro! 🐰 Aquí tienes nuestro *Catálogo de Pascua* con las mejores promociones:\n[SHOW_CATALOG_PASCUA]`;
                } else if (bodyText === '3' || bodyLower.includes('madre') || bodyLower.includes('mamá')) {
                    responseText = `¡Qué lindo detalle! 🌸 Aquí tienes nuestro *Catálogo Día de la Madre* para que sorprendas a mamá:\n[SHOW_CATALOG_MADRE]`;
                } else if (bodyText === '4' || bodyLower.includes('promo')) {
                    await sendImage(from, `${botConfig.assets.baseUrl}${botConfig.assets.map.promo_pascua_1}`, botConfig.assets.captions[botConfig.assets.map.promo_pascua_1] || '');
                    await sendImage(from, `${botConfig.assets.baseUrl}${botConfig.assets.map.promo_pascua_2}`, botConfig.assets.captions[botConfig.assets.map.promo_pascua_2] || '');
                    responseText = '¡Aprovecha estas ofertas de temporada! 🔥 ¿Te gustaría que te ayudemos con una cotización?';
                } else if (bodyText === '5' || bodyLower.includes('cotizar') || bodyLower.includes('cotizacion')) {
                    responseText = '¡Genial! Me encantaría ayudarte con tu cotización. 👨‍🍳 Para agilizar todo con un asesor, ¿podrías decirme tu nombre?';
                    nextStage = 'AWAITING_NAME';
                } else if (bodyText === '6' || bodyLower.includes('duda')) {
                    responseText = '¡Con gusto resuelvo tus dudas! ✨ Pregúntame lo que necesites sobre nuestros productos (Harina, Chocolate, Aceite o Crema de Leche).';
                } else if (isGreeting) {
                    responseText = `*¡Hola! ✨ Te damos la bienvenida a ${botConfig.businessName}!* 🍰\n\n` +
                        `¿Cómo podemos ayudarte hoy? Elige una opción enviando el número:\n\n` +
                        `1️⃣ Ver todos los productos\n` +
                        `2️⃣ Catálogo de Pascua 🐰\n` +
                        `3️⃣ Catálogo Día de la Madre 🌸\n` +
                        `4️⃣ Ver promos de la semana 🔥\n` +
                        `5️⃣ Cotizar con un asesor 👨‍🍳\n` +
                        `6️⃣ ¿Tienes dudas? (Harina, Chocolate, etc) ❓\n\n` +
                        `*Nota:* Si en algún momento necesitas hablar con una persona, escribe *"asesor"* y te conectaremos de inmediato. 😊`;
                } else {
                    responseText = ''; // SILENCIO
                }
                break;
        }

        // Guardar nuevo estado
        updateData.metadata.stage = nextStage;
        await updateClientState(from, updateData);

        // Procesar comandos y enviar
        const finalMessage = await processBotCommands(responseText, from);
        if (finalMessage) {
            await sendMessage(from, finalMessage);
        }

        // Log
        await pool.query(
            'INSERT INTO conversations (phone, message, response, model) VALUES ($1, $2, $3, $4)',
            [from, bodyText, finalMessage, 'state-machine']
        );

    } catch (error) {
        logger.error(`Error procesando mensaje de ${from}`, 'ChatController', error);
    }
};

module.exports = { handleIncomingMessage };