-- ═══════════════════════════════════════════════════════════════
-- Migración 005: Crear tabla de registro de actividad (Auditoría)
-- Fecha: 2026-04-18
-- Descripción: Tabla centralizada para registrar todas las acciones
--              administrativas del sistema. Preparada para escalabilidad:
--              'modulo' y 'accion' usan VARCHAR (no ENUM) para que
--              nuevos CRUDs futuros se integren sin ALTER TABLE.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE actividad_log (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id   BIGINT UNSIGNED NOT NULL,
    accion       VARCHAR(30)  NOT NULL,      -- 'login','crear','editar','eliminar','perfil', etc.
    modulo       VARCHAR(50)  NOT NULL,      -- 'proyectos','entrevistas','historias', etc.
    entidad_id   BIGINT UNSIGNED NULL,       -- ID del recurso afectado (NULL para login)
    descripcion  VARCHAR(255) NOT NULL,      -- Texto legible: "Creó el proyecto: Becas 2026"
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_fecha (usuario_id, created_at DESC),
    INDEX idx_modulo (modulo),
    INDEX idx_accion (accion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
