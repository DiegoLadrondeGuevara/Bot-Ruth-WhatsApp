/**
 * Logger Utility — Dulce Ruth Bot
 * Centraliza los logs con timestamps y niveles.
 */

const formatMessage = (level, message, context = '') => {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` [${context}]` : '';
  return `[${timestamp}] ${level.toUpperCase()}${contextStr}: ${message}`;
};

const logger = {
  info: (message, context) => console.log(formatMessage('info', message, context)),
  warn: (message, context) => console.warn(formatMessage('warn', message, context)),
  error: (message, context, error) => {
    console.error(formatMessage('error', message, context));
    if (error && error.stack) {
      console.error(error.stack);
    }
  }
};

module.exports = logger;
