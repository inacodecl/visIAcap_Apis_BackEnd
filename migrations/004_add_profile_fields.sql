-- ═══════════════════════════════════════════════════════════════
-- Migración 004: Agregar campos de perfil a tabla usuarios
-- Fecha: 2026-04-18
-- Descripción: Agrega columnas 'telefono' y 'avatar_url' para
--              la sección "Mi Perfil" del panel administrativo.
--              Estos campos son opcionales y los administradores
--              los rellenan desde su perfil (no al crear cuenta).
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE usuarios
    ADD COLUMN telefono   VARCHAR(20)  NULL AFTER email,
    ADD COLUMN avatar_url VARCHAR(255) NULL AFTER telefono;
