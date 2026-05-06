/**
 * Archivo: services/translation.service.js
 * Descripción: Servicio para traducción automática de contenido.
 *              Usa MyMemory Translation API (Gratis, estable en servidores).
 */

const TranslationService = {
    /**
     * Traduce un texto a un idioma específico usando MyMemory API.
     */
    async translateText(text, targetLang, attempt = 1) {
        if (!text || !targetLang || targetLang === 'es') return text;
        const maxAttempts = 3;
        
        try {
            // Pequeño delay inicial para evitar ráfagas
            await new Promise(resolve => setTimeout(resolve, attempt * 500));

            // Nota: El código para Creole Haitiano es 'ht', Inglés es 'en'
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=es|${targetLang}&de=admin@inacapsmart.cl`;
            
            const data = await new Promise((resolve, reject) => {
                const https = require('https');
                https.get(url, (res) => {
                    let body = '';
                    res.on('data', chunk => body += chunk);
                    res.on('end', () => {
                        if (res.statusCode !== 200) {
                            reject(new Error(`HTTP error! status: ${res.statusCode}`));
                            return;
                        }
                        try {
                            resolve(JSON.parse(body));
                        } catch (e) {
                            reject(new Error('Invalid JSON response'));
                        }
                    });
                }).on('error', reject);
            });
            
            if (data.responseStatus !== 200) {
                throw new Error(data.responseDetails || 'MyMemory API Error');
            }

            return data.responseData.translatedText;
        } catch (error) {
            if (attempt < maxAttempts) {
                console.warn(`[TranslationService] Error/Rate limit. Reintento ${attempt}/${maxAttempts} para ${targetLang}...`);
                return this.translateText(text, targetLang, attempt + 1);
            }
            console.error(`[TranslationService] Error traduciendo a ${targetLang}:`, error.message);
            // Fallback: devolver el texto original si la API falla definitivamente
            return text;
        }
    },

    /**
     * Traduce un objeto de campos a múltiples idiomas de forma optimizada (Batching).
     * Combina campos en una sola llamada para evitar límites de la API.
     */
    async translateBatch(fields, locales = ['en', 'ht']) {
        const results = {};
        // MyMemory maneja mejor delimitadores simples que no sean traducidos.
        const SEPARATOR = ' ||| ';

        // 1. Filtrar solo los campos que son strings y tienen contenido
        const fieldEntries = Object.entries(fields).filter(([_, value]) => 
            value && typeof value === 'string' && value.trim().length > 0
        );

        if (fieldEntries.length === 0) {
            locales.forEach(l => results[l] = { ...fields });
            return results;
        }

        const keys = fieldEntries.map(([key]) => key);
        const values = fieldEntries.map(([_, value]) => value);
        
        // 2. Combinar todos los valores en un solo string
        const combinedText = values.join(SEPARATOR);

        for (const locale of locales) {
            results[locale] = { ...fields }; // Default to original for all fields
            
            try {
                // Hacer una sola llamada por idioma
                const translatedCombined = await this.translateText(combinedText, locale);
                
                // 3. Separar los resultados (A veces las APIs añaden espacios extra alrededor del separador)
                const translatedValues = translatedCombined.split(/\|\|\|/g).map(s => s.trim());

                if (translatedValues.length === values.length) {
                    keys.forEach((key, index) => {
                        // Limpiar caracteres residuales del separador si los hay
                        results[locale][key] = translatedValues[index].replace(/^\||\|$/g, '').trim();
                    });
                    console.log(`[TranslationService] Batch translation SUCCESS for ${locale}`);
                } else {
                    console.warn(`[TranslationService] Mismatch in batch translation for ${locale}. Fallback to individual.`);
                    // Fallback individual si el separador falló (la API se confundió con el delimitador)
                    for (const [key, value] of fieldEntries) {
                        results[locale][key] = await this.translateText(value, locale);
                    }
                }
            } catch (error) {
                console.error(`[TranslationService] Batch translation FAILED for ${locale}:`, error.message);
            }
        }

        return results;
    }
};

module.exports = TranslationService;
