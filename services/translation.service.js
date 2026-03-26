/**
 * Archivo: services/translation.service.js
 * Descripción: Servicio para traducción automática de contenido.
 *              Usa @vitalets/google-translate-api (Gratis via Web Interface).
 */

const { translate } = require('@vitalets/google-translate-api');

const TranslationService = {
    /**
     * Traduce un texto a un idioma específico con reintentos y delay.
     */
    async translateText(text, targetLang, attempt = 1) {
        if (!text || !targetLang || targetLang === 'es') return text;
        const maxAttempts = 3;
        
        try {
            // Pequeño delay inicial para evitar ráfagas
            await new Promise(resolve => setTimeout(resolve, attempt * 500));

            // Nota: El código para Creole Haitiano en Google es 'ht'
            const res = await translate(text, { to: targetLang, from: 'es' });
            return res.text;
        } catch (error) {
            if (error.message.includes('Too Many Requests') && attempt < maxAttempts) {
                console.warn(`[TranslationService] Rate limit hit. Reintento ${attempt}/${maxAttempts} para ${targetLang}...`);
                return this.translateText(text, targetLang, attempt + 1);
            }
            console.error(`[TranslationService] Error traduciendo a ${targetLang}:`, error.message);
            // Fallback: devolver el texto original si la API falla
            return text;
        }
    },

    /**
     * Traduce un objeto de campos a múltiples idiomas de forma optimizada (Batching).
     * Combina campos en una sola llamada para evitar Rate Limits (Too Many Requests).
     */
    async translateBatch(fields, locales = ['en', 'ht']) {
        const results = {};
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
                
                // 3. Separar los resultados
                const translatedValues = translatedCombined.split(SEPARATOR);

                if (translatedValues.length === values.length) {
                    keys.forEach((key, index) => {
                        results[locale][key] = translatedValues[index].trim();
                    });
                    console.log(`[TranslationService] Batch translation SUCCESS for ${locale}`);
                } else {
                    console.warn(`[TranslationService] Mismatch in batch translation for ${locale}. Fallback to individual.`);
                    // Fallback individual si el separador falló
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
