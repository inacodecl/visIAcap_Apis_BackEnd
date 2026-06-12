const path = require('path');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

// Variables para caché en memoria
let historicoCache = {
    data: null,
    timestamp: 0
};
const HISTORICO_TTL = 2 * 60 * 60 * 1000; // 2 horas (en milisegundos)

let realtimeCache = {
    data: null,
    timestamp: 0
};
const REALTIME_TTL = 1 * 60 * 1000; // 1 minuto (en milisegundos)

// Inicialización segura de BetaAnalyticsDataClient
let analyticsDataClient = null;
try {
    const credentialsPath = path.join(__dirname, '../google-credentials.json');
    analyticsDataClient = new BetaAnalyticsDataClient({
        keyFilename: credentialsPath
    });
} catch (err) {
    console.error('[AnalyticsController] Error al inicializar BetaAnalyticsDataClient:', err);
}

/**
 * Obtiene métricas agregadas e históricas de GA4 (últimos 7 días)
 * utilizando caché y batchRunReports.
 * 
 * GET /api/admin/metricas
 */
const getMetricas = async (req, res) => {
    try {
        const propertyId = process.env.GA_PROPERTY_ID;

        if (!propertyId) {
            return res.status(500).json({
                ok: false,
                error: {
                    code: 'GA_CONFIG_ERROR',
                    message: 'Falta la variable de entorno GA_PROPERTY_ID en el archivo .env',
                    userMessage: 'La configuración de la propiedad de Google Analytics no está completa en el servidor.'
                }
            });
        }

        if (!analyticsDataClient) {
            return res.status(500).json({
                ok: false,
                error: {
                    code: 'GA_CLIENT_ERROR',
                    message: 'No se pudo inicializar el cliente de Google Analytics con las credenciales provistas.',
                    userMessage: 'El archivo de credenciales de Google Analytics no está disponible o es inválido.'
                }
            });
        }

        // 1. Validar sistema de caché para datos históricos (2 horas de TTL)
        const ahora = Date.now();
        if (historicoCache.data && (ahora - historicoCache.timestamp < HISTORICO_TTL)) {
            return res.status(200).json({
                ok: true,
                source: 'cache',
                data: historicoCache.data
            });
        }

        // 2. Si el caché expiró o está vacío, consultar a Google Analytics usando batchRunReports (1 sola petición a la API)
        const [response] = await analyticsDataClient.batchRunReports({
            property: `properties/${propertyId}`,
            requests: [
                // Reporte 1: Tráfico Diario (Evolución)
                {
                    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
                    dimensions: [{ name: 'date' }],
                    metrics: [{ name: 'activeUsers' }, { name: 'sessions' }]
                },
                // Reporte 2: Dispositivos Usados
                {
                    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
                    dimensions: [{ name: 'deviceCategory' }],
                    metrics: [{ name: 'activeUsers' }]
                },
                // Reporte 3: Canales de Adquisición / Origen de Visitas
                {
                    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
                    dimensions: [{ name: 'sessionSourceMedium' }],
                    metrics: [{ name: 'sessions' }]
                },
                // Reporte 4: Tabla de Clasificación de Páginas más Leídas
                {
                    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
                    dimensions: [{ name: 'pagePath' }],
                    metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }]
                }
            ]
        });

        // 3. Procesar y estructurar las respuestas de los reportes por lotes
        const reports = response.reports || [];
        
        // Reporte 1: Tráfico Diario
        const traficoDiario = [];
        if (reports[0] && reports[0].rows) {
            reports[0].rows.forEach(row => {
                const fechaRaw = row.dimensionValues[0].value; // YYYYMMDD
                const fecha = `${fechaRaw.substring(0, 4)}-${fechaRaw.substring(4, 6)}-${fechaRaw.substring(6, 8)}`;
                const usuarios_activos = parseInt(row.metricValues[0].value, 10) || 0;
                const sesiones = parseInt(row.metricValues[1].value, 10) || 0;
                traficoDiario.push({ fecha, usuarios_activos, sesiones });
            });
        }
        // Ordenar cronológicamente para los gráficos
        traficoDiario.sort((a, b) => a.fecha.localeCompare(b.fecha));

        // Reporte 2: Dispositivos
        const dispositivos = [];
        if (reports[1] && reports[1].rows) {
            reports[1].rows.forEach(row => {
                const categoria = row.dimensionValues[0].value || 'Desconocido';
                const usuarios_activos = parseInt(row.metricValues[0].value, 10) || 0;
                dispositivos.push({ categoria, usuarios_activos });
            });
        }

        // Reporte 3: Canales de Adquisición
        const canales = [];
        if (reports[2] && reports[2].rows) {
            reports[2].rows.forEach(row => {
                const origen_medio = row.dimensionValues[0].value || 'direct / (none)';
                const sesiones = parseInt(row.metricValues[0].value, 10) || 0;
                canales.push({ origen_medio, sesiones });
            });
        }

        // Reporte 4: Top Páginas
        const topPaginas = [];
        if (reports[3] && reports[3].rows) {
            reports[3].rows.forEach(row => {
                const ruta = row.dimensionValues[0].value || '/';
                const vistas = parseInt(row.metricValues[0].value, 10) || 0;
                const usuarios_activos = parseInt(row.metricValues[1].value, 10) || 0;
                topPaginas.push({ ruta, vistas, usuarios_activos });
            });
        }
        // Ordenar por vistas (descendente) y limitar a top 10
        topPaginas.sort((a, b) => b.vistas - a.vistas);

        const dataProcesada = {
            traficoDiario,
            dispositivos,
            canales,
            topPaginas: topPaginas.slice(0, 10)
        };

        // 4. Guardar datos procesados en la caché
        historicoCache.data = dataProcesada;
        historicoCache.timestamp = ahora;

        return res.status(200).json({
            ok: true,
            source: 'api',
            data: dataProcesada
        });

    } catch (error) {
        console.error('[AnalyticsController] Error al obtener métricas consolidadas:', error);
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
 * Obtiene métricas en tiempo real de los últimos 30 minutos
 * utilizando caché corto y runRealtimeReport.
 * 
 * GET /api/admin/metricas/tiempo-real
 */
const getRealtimeMetricas = async (req, res) => {
    try {
        const propertyId = process.env.GA_PROPERTY_ID;

        if (!propertyId) {
            return res.status(500).json({
                ok: false,
                error: {
                    code: 'GA_CONFIG_ERROR',
                    message: 'Falta la variable de entorno GA_PROPERTY_ID en el archivo .env',
                    userMessage: 'La configuración de la propiedad de Google Analytics no está completa.'
                }
            });
        }

        if (!analyticsDataClient) {
            return res.status(500).json({
                ok: false,
                error: {
                    code: 'GA_CLIENT_ERROR',
                    message: 'No se pudo inicializar el cliente de Google Analytics.',
                    userMessage: 'El archivo de credenciales de Google Analytics no está disponible.'
                }
            });
        }

        // 1. Validar caché corto de tiempo real (1 minuto de TTL)
        const ahora = Date.now();
        if (realtimeCache.data && (ahora - realtimeCache.timestamp < REALTIME_TTL)) {
            return res.status(200).json({
                ok: true,
                source: 'cache',
                data: realtimeCache.data
            });
        }

        // 2. Consultar reporte en tiempo real a GA4 (últimos 30 minutos)
        const [realtimeResponse] = await analyticsDataClient.runRealtimeReport({
            property: `properties/${propertyId}`,
            metrics: [
                { name: 'activeUsers' }
            ],
            dimensions: [
                { name: 'pagePath' }
            ]
        });

        // 3. Procesar resultados en tiempo real
        let usuariosActivosTotal = 0;
        const paginasActivas = [];

        if (realtimeResponse && realtimeResponse.rows) {
            realtimeResponse.rows.forEach(row => {
                const ruta = row.dimensionValues[0].value || '/';
                const usuarios = parseInt(row.metricValues[0].value, 10) || 0;
                usuariosActivosTotal += usuarios;
                paginasActivas.push({ ruta, usuarios });
            });
        }

        // Si no hay filas pero Google reporta un total, lo usamos
        if (usuariosActivosTotal === 0 && realtimeResponse && realtimeResponse.totals && realtimeResponse.totals[0]) {
            usuariosActivosTotal = parseInt(realtimeResponse.totals[0].metricValues[0].value, 10) || 0;
        }

        const dataProcesadaRealtime = {
            usuariosActivos: usuariosActivosTotal,
            paginasActivas: paginasActivas.sort((a, b) => b.usuarios - a.usuarios).slice(0, 5)
        };

        // 4. Actualizar la caché en tiempo real
        realtimeCache.data = dataProcesadaRealtime;
        realtimeCache.timestamp = ahora;

        return res.status(200).json({
            ok: true,
            source: 'api',
            data: dataProcesadaRealtime
        });

    } catch (error) {
        console.error('[AnalyticsController] Error al obtener métricas de tiempo real:', error);
        return res.status(500).json({
            ok: false,
            error: {
                code: 'GA_REALTIME_REPORT_ERROR',
                message: error.message,
                userMessage: 'No se pudieron obtener los datos de tráfico en tiempo real.'
            }
        });
    }
};

module.exports = {
    getMetricas,
    getRealtimeMetricas
};
