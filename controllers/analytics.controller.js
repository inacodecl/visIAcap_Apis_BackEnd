const { google } = require('googleapis');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

/**
 * Obtiene las métricas de tráfico de Google Analytics 4 (GA4)
 * de los últimos 7 días, ordenadas por vistas totales.
 * 
 * GET /api/admin/metricas
 */
const getMetricas = async (req, res) => {
    try {
        const clientId = process.env.GA_CLIENT_ID;
        const clientSecret = process.env.GA_CLIENT_SECRET;
        const refreshToken = process.env.GA_REFRESH_TOKEN;
        const propertyId = process.env.GA_PROPERTY_ID;

        // Validación de que todas las credenciales requeridas existan
        if (!clientId || !clientSecret || !refreshToken || !propertyId) {
            console.warn('[AnalyticsController] Faltan variables de entorno obligatorias para GA4');
            return res.status(500).json({
                ok: false,
                error: {
                    code: 'GA_CONFIG_ERROR',
                    message: 'Missing required Google Analytics environment variables in .env',
                    userMessage: 'La configuración de Google Analytics no está completa en el servidor.'
                }
            });
        }

        // Configurar cliente de autenticación de OAuth2
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
        oauth2Client.setCredentials({
            refresh_token: refreshToken
        });

        // Inicializar BetaAnalyticsDataClient pasándole el cliente OAuth2 como authClient
        const analyticsDataClient = new BetaAnalyticsDataClient({
            authClient: oauth2Client
        });

        // Consultar el reporte a Google Analytics 4
        const [response] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [
                {
                    startDate: '7daysAgo',
                    endDate: 'today'
                }
            ],
            dimensions: [
                {
                    name: 'pagePath'
                }
            ],
            metrics: [
                {
                    name: 'activeUsers'
                },
                {
                    name: 'screenPageViews'
                }
            ]
        });

        const metricas = [];

        // Procesar y mapear las filas del reporte
        if (response && response.rows) {
            response.rows.forEach(row => {
                const ruta = (row.dimensionValues && row.dimensionValues[0]) ? row.dimensionValues[0].value : '';
                const usuarios_unicos = (row.metricValues && row.metricValues[0]) ? parseInt(row.metricValues[0].value, 10) : 0;
                const vistas_totales = (row.metricValues && row.metricValues[1]) ? parseInt(row.metricValues[1].value, 10) : 0;

                metricas.push({
                    ruta,
                    usuarios_unicos,
                    vistas_totales
                });
            });
        }

        // Ordenar de mayor a menor según vistas_totales
        metricas.sort((a, b) => b.vistas_totales - a.vistas_totales);

        return res.status(200).json({
            ok: true,
            data: metricas
        });

    } catch (error) {
        console.error('[AnalyticsController] Error al obtener reportes de GA4:', error);
        return res.status(500).json({
            ok: false,
            error: {
                code: 'GA_REPORT_ERROR',
                message: error.message,
                userMessage: 'No se pudieron obtener las métricas de tráfico en este momento.'
            }
        });
    }
};

/**
 * Envía un evento de page_view al Measurement Protocol de GA4
 * POST /api/admin/track
 */
const trackPageView = async (req, res) => {
    try {
        const { ruta, client_id } = req.body;

        if (!ruta || !client_id) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios: ruta y client_id'
            });
        }

        const measurementId = process.env.GA_MEASUREMENT_ID;
        const apiSecret = process.env.GA_API_SECRET;

        if (!measurementId || !apiSecret) {
            console.warn('[AnalyticsController] Faltan variables de entorno obligatorias para trackear eventos en GA4');
            // Devolvemos 200 de todos modos para no interferir con el frontend
            return res.status(200).json({
                success: true,
                warning: 'GA4 config not complete on server'
            });
        }

        const url = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;

        const payload = {
            client_id: client_id,
            events: [
                {
                    name: 'page_view',
                    params: {
                        page_path: ruta
                    }
                }
            ]
        };

        // Enviar evento de forma asíncrona a Google Analytics (Server-to-Server)
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                console.error(`[AnalyticsController] Error al enviar evento a GA4: ${response.status} ${response.statusText}`);
            } else {
                console.log(`[AnalyticsController] Evento page_view enviado a GA4 para la ruta: ${ruta}`);
            }
        })
        .catch(error => {
            console.error('[AnalyticsController] Error de red al reportar a GA4:', error);
        });

        // Responder inmediatamente al cliente
        return res.status(200).json({
            success: true
        });

    } catch (error) {
        console.error('[AnalyticsController] Error en trackPageView:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al procesar el tracking'
        });
    }
};

module.exports = {
    getMetricas,
    trackPageView
};
