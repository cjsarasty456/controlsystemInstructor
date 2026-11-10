-- Migración V1.1: Control de concurrencia optimista e índices de auditoría
-- Fecha: 2026-11-10
-- Agente: Database Engineer & Data Architect (DBA)

-- 1. Agregar columna de control de concurrencia optimista en fichas
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fichas' AND column_name = 'version'
    ) THEN 
        ALTER TABLE fichas ADD COLUMN version INT NOT NULL DEFAULT 0;
    END IF;
END $$;

-- 2. Asegurar índices para búsqueda y conteo concurrente
CREATE INDEX IF NOT EXISTS idx_fichas_programa ON fichas(programa_codigo, programa_version);
CREATE INDEX IF NOT EXISTS idx_aprendices_estado ON aprendices(estado_sena);
CREATE INDEX IF NOT EXISTS idx_juicios_aprendiz_estado ON juicios_evaluativos_detalle(aprendiz_id, estado_juicio);
