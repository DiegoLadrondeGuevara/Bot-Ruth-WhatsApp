/**
 * Servicio de Google Sheets — Registro de Pedidos Dulce Ruth
 * Guarda los datos de pedidos y clientes desde el bot.
 */

const { google } = require('googleapis');
const path = require('path');
const env = require('../config/env');
const botConfig = require('../config/bot.config');

const SPREADSHEET_ID = env.google.spreadsheetId;
const CREDENTIALS_PATH = path.resolve(__dirname, '../../', env.google.credentialsPath);

const getSheetsClient = async () => {
    const auth = new google.auth.GoogleAuth({
        keyFile: CREDENTIALS_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const authClient = await auth.getClient();
    return google.sheets({ version: 'v4', auth: authClient });
};

/**
 * Registra un pedido realizado por el bot.
 * @param {object} data - Datos provenientes del JSON "READY_FOR_HUMAN".
 */
const saveAppointment = async (data) => {
    try {
        const sheets = await getSheetsClient();
        const { order_details, phone, status, priority } = data;

        const now = new Date();
        const fecha = now.toLocaleDateString(botConfig.locale, {
            timeZone: botConfig.timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        const horaRegistro = now.toLocaleTimeString(botConfig.locale, {
            timeZone: botConfig.timezone,
            hour: '2-digit',
            minute: '2-digit',
        });

        const sheetRange = `${botConfig.sheets.sheetName}!${botConfig.sheets.dataRange}`;

        /**
         * 🟢 ORDEN DE COLUMNAS (Debe coincidir con bot.config.js):
         * FECHA | CLIENTE | TIPO | DESTINO | PEDIDO | ESTADO | TOTAL | JSON_REPORTE
         */
        const result = await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: sheetRange,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    `${fecha} ${horaRegistro}`,
                    phone || 'N/A',
                    order_details?.client_type || 'Desconocido',
                    order_details?.delivery_type || '-',
                    order_details?.items || 'Sin detalles',
                    status || botConfig.sheets.defaultStatus,
                    priority === 'high' ? 'PRIORIDAD ALTA' : '-',
                    JSON.stringify(data)
                ]],
            },
        });

        console.log(`📊 Pedido registrado en Sheets para: ${phone}`);
        return result.data;
    } catch (error) {
        console.error('❌ Error al guardar pedido en Sheets:', error.message);
        throw error;
    }
};

const initializeSheet = async () => {
    try {
        const sheets = await getSheetsClient();
        const headerRange = `${botConfig.sheets.sheetName}!${botConfig.sheets.headerRange}`;

        const existing = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: headerRange,
        });

        if (!existing.data.values || existing.data.values.length === 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: headerRange,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [botConfig.sheets.headers],
                },
            });
            console.log('📊 Google Sheets: Encabezados creados para Dulce Ruth');
        } else {
            console.log('📊 Google Sheets: Conexión establecida');
        }
    } catch (error) {
        console.error('⚠️ Error Sheets:', error.message);
    }
};

module.exports = { saveAppointment, initializeSheet };