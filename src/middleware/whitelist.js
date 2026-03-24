/**
 * Middleware de Whitelist
 * Solo permite interactuar con el bot a los números incluidos en la lista.
 * Si la lista está vacía, permite a todos.
 */

const env = require('../config/env');

/**
 * Verifica si un número tiene permiso para interactuar con el bot.
 * @param {string} phone — Número de teléfono a verificar.
 * @returns {boolean} — true si el número PUEDE interactuar con el bot.
 */
const isAllowed = (phone) => {
    // Si no hay whitelist definida, permitir a todos
    if (!phone) return false;
    if (env.whitelist.length === 0) return true;

    // Normalizar: remover +, espacios, guiones
    const normalized = phone.replace(/[\s\-\+]/g, '');

    return env.whitelist.some((whiteNum) => {
        const normalizedWhite = whiteNum.replace(/[\s\-\+]/g, '');
        return normalized.endsWith(normalizedWhite) || normalizedWhite.endsWith(normalized);
    });
};

module.exports = { isAllowed };

