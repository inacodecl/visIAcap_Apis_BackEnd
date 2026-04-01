-- ==========================================================
-- Migración 003: Tablas del Futuro
-- Noticias, Este Mes, Próximamente
-- ==========================================================

-- -------------------------------------------------------
-- BLOQUE 1: Noticias del Futuro
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS noticias_futuro (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    imagen_url  VARCHAR(500),
    etiqueta    VARCHAR(100),
    fecha       DATE,
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    order_index INT         NOT NULL DEFAULT 0,
    created_by  INT,
    updated_by  INT,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP   NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS noticias_futuro_i18n (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    noticia_id  INT         NOT NULL,
    locale      VARCHAR(5)  NOT NULL DEFAULT 'es',
    titulo      VARCHAR(255),
    resumen     TEXT,
    UNIQUE KEY unique_noticia_locale (noticia_id, locale),
    FOREIGN KEY (noticia_id) REFERENCES noticias_futuro(id) ON DELETE CASCADE
);

-- -------------------------------------------------------
-- BLOQUE 2: Este Mes
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS este_mes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    dia         VARCHAR(2)  NOT NULL,
    mes         VARCHAR(3)  NOT NULL,
    tipo        VARCHAR(50),
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    order_index INT         NOT NULL DEFAULT 0,
    created_by  INT,
    updated_by  INT,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP   NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS este_mes_i18n (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    evento_id   INT         NOT NULL,
    locale      VARCHAR(5)  NOT NULL DEFAULT 'es',
    titulo      VARCHAR(255),
    descripcion TEXT,
    UNIQUE KEY unique_evento_locale (evento_id, locale),
    FOREIGN KEY (evento_id) REFERENCES este_mes(id) ON DELETE CASCADE
);

-- -------------------------------------------------------
-- BLOQUE 3: Próximamente
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS proximamente (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    icono       VARCHAR(100),
    imagen_url  VARCHAR(500),
    ubicacion   VARCHAR(255),
    fecha_texto VARCHAR(50),
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    order_index INT         NOT NULL DEFAULT 0,
    created_by  INT,
    updated_by  INT,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP   NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS proximamente_i18n (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    evento_id   INT         NOT NULL,
    locale      VARCHAR(5)  NOT NULL DEFAULT 'es',
    titulo      VARCHAR(255),
    descripcion TEXT,
    UNIQUE KEY unique_prox_locale (evento_id, locale),
    FOREIGN KEY (evento_id) REFERENCES proximamente(id) ON DELETE CASCADE
);
