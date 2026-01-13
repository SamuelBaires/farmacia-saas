-- ==============================================================================
-- MIGRACION: ACTUALIZACION ESQUEMA MEDICAMENTOS (CLINICO + OPERATIVO)
-- ==============================================================================

DO $$
BEGIN
    -- 1. Crear Enum 'forma_farmaceutica' si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'forma_farmaceutica_enum') THEN
        CREATE TYPE public.forma_farmaceutica_enum AS ENUM (
            'TABLETA', 
            'CAPSULA', 
            'JARABE', 
            'INYECTABLE', 
            'CREMA', 
            'SUSPENSION', 
            'GOTA', 
            'SUPOSITORIO', 
            'POLVO',
            'OTRO'
        );
    END IF;

    -- 2. Alterar tabla 'medicamentos'
    -- Agregar columnas nuevas
    
    -- principio_activo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medicamentos' AND column_name = 'principio_activo') THEN
        ALTER TABLE public.medicamentos ADD COLUMN principio_activo VARCHAR(200);
    END IF;

    -- forma_farmaceutica
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medicamentos' AND column_name = 'forma_farmaceutica') THEN
        ALTER TABLE public.medicamentos ADD COLUMN forma_farmaceutica public.forma_farmaceutica_enum DEFAULT 'OTRO';
    END IF;

    -- concentracion
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medicamentos' AND column_name = 'concentracion') THEN
        ALTER TABLE public.medicamentos ADD COLUMN concentracion VARCHAR(100);
    END IF;

    -- laboratorio_fabricacion
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medicamentos' AND column_name = 'laboratorio_fabricacion') THEN
        ALTER TABLE public.medicamentos ADD COLUMN laboratorio_fabricacion VARCHAR(200);
    END IF;

    -- 3. Renombrar columnas (Conservando datos)
    -- es_controlado -> medicamento_controlado
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medicamentos' AND column_name = 'es_controlado') THEN
        ALTER TABLE public.medicamentos RENAME COLUMN es_controlado TO medicamento_controlado;
    END IF;

    -- Si no existía 'es_controlado' y tampoco 'medicamento_controlado', lo creamos la nueva directo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medicamentos' AND column_name = 'medicamento_controlado') THEN
        ALTER TABLE public.medicamentos ADD COLUMN medicamento_controlado BOOLEAN DEFAULT FALSE;
    END IF;

END $$;
