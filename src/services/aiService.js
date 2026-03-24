/**
 * Servicio de Inteligencia Artificial — OpenRouter
 * Orquesta la memoria y las llamadas al modelo de IA.
 */

const axios = require('axios');
const fs = require('fs');
const env = require('../config/env');
const botConfig = require('../config/bot.config');
const { pool } = require('../config/database');

// Carga el system prompt (Rosmel) desde el archivo .md
const SYSTEM_PROMPT = fs.readFileSync(botConfig.systemPromptPath, 'utf-8');

/**
 * Obtiene el historial reciente de la DB para darle memoria al bot.
 */
const getHistory = async (phone) => {
    const result = await pool.query(
        'SELECT message, response FROM conversations WHERE phone = $1 ORDER BY created_at DESC LIMIT $2',
        [phone, botConfig.ai.historyLimit]
    );
    return result.rows.reverse(); // Invertimos para que el orden sea cronológico
};

/**
 * Función Principal: Une historial + IA
 */
const getChatResponse = async (phone, userMessage) => {
    const history = await getHistory(phone);
    return await askAI(userMessage, history);
};

/**
 * Consulta directa a OpenRouter
 */
const askAI = async (userMessage, history = []) => {
    try {
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT.replace('[PRODUCTO_SEMANA]', 'Torta de Chocolate Premium') }, // Ejemplo hardcoded por ahora, se puede traer de DB
        ];

        // Construir el hilo de la conversación con el historial
        if (history && history.length > 0) {
            history.forEach(entry => {
                messages.push({ role: 'user', content: entry.message });
                messages.push({ role: 'assistant', content: entry.response });
            });
        }

        // Añadir el mensaje actual
        messages.push({ role: 'user', content: userMessage });

        const response = await axios.post(
            `${env.openrouter.apiUrl}/chat/completions`,
            {
                model: env.openrouter.model,
                messages,
                max_tokens: botConfig.ai.maxTokens,
                temperature: botConfig.ai.temperature,
            },
            {
                headers: {
                    Authorization: `Bearer ${env.openrouter.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': botConfig.websiteUrl || 'https://dulceruth.com.pe',
                    'X-Title': botConfig.botName,
                },
                timeout: botConfig.ai.timeout,
            }
        );

        const reply = response.data?.choices?.[0]?.message?.content;
        return reply ? reply.trim() : 'Lo siento, no pude procesar tu mensaje. 🙏';

    } catch (error) {
        console.error('❌ Error OpenRouter:', error.response?.data || error.message);
        return 'Tuve un pequeño error técnico. ¿Me lo repites? 🙏';
    }
};

module.exports = { getChatResponse }; // Exportamos la función con memoria