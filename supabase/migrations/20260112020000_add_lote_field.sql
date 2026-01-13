-- ==============================================================================
-- MIGRACION: AGREGAR CAMPO LOTE
-- ==============================================================================

DO $$
BEGIN
    -- Agregar lote
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medicamentos' AND column_name = 'lote') THEN
        ALTER TABLE public.medicamentos ADD COLUMN lote VARCHAR(100);
    END IF;

END $$;
