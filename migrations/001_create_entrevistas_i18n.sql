-- =============================================================
-- Migración: Crear tabla entrevistas_i18n
-- Descripción: Tabla de traducciones para entrevistas.
--              Sigue el mismo patrón de historia_i18n y proyectos_i18n.
-- =============================================================

CREATE TABLE IF NOT EXISTS entrevistas_i18n (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entrevista_id INT NOT NULL,
    locale VARCHAR(5) NOT NULL DEFAULT 'es',
    titulo VARCHAR(255),
    entrevistado VARCHAR(255),
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (entrevista_id) REFERENCES entrevistas(id) ON DELETE CASCADE,
    UNIQUE KEY uq_entrevista_locale (entrevista_id, locale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrar datos existentes de entrevistas a entrevistas_i18n (locale = 'es')
INSERT INTO entrevistas_i18n (entrevista_id, locale, titulo, entrevistado, descripcion)
SELECT id, 'es', titulo, entrevistado, descripcion
FROM entrevistas
ON DUPLICATE KEY UPDATE titulo = VALUES(titulo);
