-- ==========================================================
-- SCRIPT DE MIGRACIÓN: SOPORTE MULTI-IDIOMA (i18n)
-- PROYECTO: VISIACAP
-- DESCRIPCIÓN: Creación de tablas i18n, agregación de columnas de traducción
--              y ampliación de longitud de columnas para URLs largas (Evita Error 500).
-- ==========================================================

-- 1. Tablas de Internacionalización (Almacenan traducciones)
CREATE TABLE IF NOT EXISTS `historia_i18n` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `historia_id` bigint unsigned NOT NULL,
  `locale` char(2) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `descripcion` text,
  `audio_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_historia_i18n_locale` (`historia_id`,`locale`),
  CONSTRAINT `fk_historia_i18n_historia` FOREIGN KEY (`historia_id`) REFERENCES `historia` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `entrevistas_i18n` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entrevista_id` int NOT NULL,
  `locale` varchar(5) NOT NULL DEFAULT 'es',
  `titulo` varchar(255) DEFAULT NULL,
  `entrevistado` varchar(255) DEFAULT NULL,
  `descripcion` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_entrevista_locale` (`entrevista_id`,`locale`),
  CONSTRAINT `entrevistas_i18n_ibfk_1` FOREIGN KEY (`entrevista_id`) REFERENCES `entrevistas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `proyectos_i18n` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `proyecto_id` bigint unsigned NOT NULL,
  `locale` char(2) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `resumen` text,
  `descripcion` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_proyectos_i18n_locale` (`proyecto_id`,`locale`),
  CONSTRAINT `fk_proyectos_i18n_proyecto` FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Modificaciones en tablas existentes (Faltantes de traducción)
ALTER TABLE `tags` ADD COLUMN IF NOT EXISTS `nombre_en` varchar(120) DEFAULT NULL AFTER `nombre_es`;
ALTER TABLE `categorias` ADD COLUMN IF NOT EXISTS `nombre_en` varchar(120) DEFAULT NULL AFTER `nombre_es`;

-- 3. Corrección de longitud para URLs largas (Evita Error 500 "Data too long")
ALTER TABLE `entrevistas` MODIFY COLUMN `url_imagen` TEXT;
ALTER TABLE `entrevistas` MODIFY COLUMN `url_video` TEXT;
ALTER TABLE `historia`    MODIFY COLUMN `media_url` TEXT;
ALTER TABLE `proyectos`   MODIFY COLUMN `image_cover_url` TEXT;
ALTER TABLE `proyectos`   MODIFY COLUMN `url_externa` TEXT;

-- ==========================================================
-- NOTA: El Backend automáticamente llenará estas tablas
-- cuando se guarde un nuevo elemento en Español.
-- ==========================================================
