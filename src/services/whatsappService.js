/**
 * Servicio de WhatsApp — YCloud
 * Envía mensajes a través de la API REST de YCloud.
 */

const axios = require('axios');
const env = require('../config/env');
const botConfig = require('../config/bot.config');

/**
 * Crea una instancia de axios preconfigurada para YCloud.
 */
const ycloud = axios.create({
    baseURL: env.ycloud.apiUrl,
    headers: {
        'X-API-Key': env.ycloud.apiKey,
        'Content-Type': 'application/json',
    },
    timeout: botConfig.timeouts.whatsapp,
});

/**
 * Envía un mensaje de texto por WhatsApp.
 * @param {string} to — Número del destinatario (formato internacional, ej: +5215512345678).
 * @param {string} text — Contenido del mensaje.
 * @returns {Promise<object>} — Respuesta de la API de YCloud.
 */
const sendMessage = async (to, text) => {
    try {
        const response = await ycloud.post('/whatsapp/messages', {
            from: env.ycloud.whatsappNumber,
            to,
            type: 'text',
            text: { body: text },
        });

        console.log(`✅ Mensaje enviado a ${to}`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error al enviar mensaje a ${to}:`, error.response?.data || error.message);
        throw error;
    }
};

/**
 * Envía un template de WhatsApp pre-aprobado.
 * @param {string} to — Número del destinatario.
 * @param {string} templateName — Nombre del template registrado en YCloud.
 * @param {Array} params — Parámetros del template.
 * @returns {Promise<object>} — Respuesta de la API de YCloud.
 */
const sendTemplate = async (to, templateName, params = []) => {
    try {
        const components = params.length > 0
            ? [{
                type: 'body',
                parameters: params.map((value) => ({ type: 'text', text: String(value) })),
            }]
            : [];

        const response = await ycloud.post('/whatsapp/messages', {
            from: env.ycloud.whatsappNumber,
            to,
            type: 'template',
            template: {
                name: templateName,
                language: { code: botConfig.templateLanguage },
                components,
            },
        });

        console.log(`✅ Template "${templateName}" enviado a ${to}`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error al enviar template a ${to}:`, error.response?.data || error.message);
        throw error;
    }
};

/**
 * Envia una imagen por WhatsApp.
 * @param {string} to - Numero del destinatario.
 * @param {string} imageUrl - URL publica de la imagen.
 * @param {string} caption - Texto opcional debajo de la imagen.
 * @returns {Promise<object>} - Respuesta de YCloud.
 */
const sendImage = async (to, imageUrl, caption = '') => {
    try {
        const payload = {
            from: env.ycloud.whatsappNumber,
            to,
            type: 'image',
            image: { link: imageUrl },
        };
        if (caption) payload.image.caption = caption;

        const response = await ycloud.post('/whatsapp/messages', payload);
        console.log(`✅ Imagen enviada a ${to}`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error al enviar imagen a ${to}:`, error.response?.data || error.message);
        throw error;
    }
};

/**
 * Envia un video por WhatsApp.
 * @param {string} to - Numero del destinatario.
 * @param {string} videoUrl - URL publica del video.
 * @param {string} caption - Texto opcional debajo del video.
 * @returns {Promise<object>} - Respuesta de YCloud.
 */
const sendVideo = async (to, videoUrl, caption = '') => {
    try {
        const payload = {
            from: env.ycloud.whatsappNumber,
            to,
            type: 'video',
            video: { link: videoUrl },
        };
        if (caption) payload.video.caption = caption;

        const response = await ycloud.post('/whatsapp/messages', payload);
        console.log(`✅ Video enviado a ${to}`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error al enviar video a ${to}:`, error.response?.data || error.message);
        throw error;
    }
};


/**
 * Envia una ubicacion (pin de mapa) por WhatsApp.
 * @param {string} to - Numero del destinatario.
 * @param {number} latitude - Latitud.
 * @param {number} longitude - Longitud.
 * @param {string} name - Nombre del lugar.
 * @param {string} address - Direccion del lugar.
 * @returns {Promise<object>} - Respuesta de YCloud.
 */
const sendLocation = async (to, latitude, longitude, name = '', address = '') => {
    try {
        const payload = {
            from: env.ycloud.whatsappNumber,
            to,
            type: 'location',
            location: {
                latitude,
                longitude,
                name,
                address,
            },
        };

        const response = await ycloud.post('/whatsapp/messages', payload);
        console.log(`\u2705 Ubicacion enviada a ${to}`);
        return response.data;
    } catch (error) {
        console.error(`\u274C Error al enviar ubicacion a ${to}:`, error.response?.data || error.message);
        throw error;
    }
};

/**
 * Envia un documento (PDF, etc.) por WhatsApp.
 * @param {string} to - Numero del destinatario.
 * @param {string} documentUrl - URL publica del documento.
 * @param {string} filename - Nombre opcional del archivo.
 * @returns {Promise<object>} - Respuesta de YCloud.
 */
const sendDocument = async (to, documentUrl, filename = '') => {
    try {
        const payload = {
            from: env.ycloud.whatsappNumber,
            to,
            type: 'document',
            document: { link: documentUrl },
        };
        if (filename) payload.document.filename = filename;

        const response = await ycloud.post('/whatsapp/messages', payload);
        console.log(`✅ Documento enviado a ${to}`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error al enviar documento a ${to}:`, error.response?.data || error.message);
        throw error;
    }
};

module.exports = { sendMessage, sendTemplate, sendImage, sendVideo, sendLocation, sendDocument };
