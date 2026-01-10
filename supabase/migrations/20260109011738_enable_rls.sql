
-- ==============================================================================
-- SEGURIDAD AVANZADA Y RLS (ROW LEVEL SECURITY) - COMPATIBLE SUPABASE CLI
-- ==============================================================================
-- Este script es IDEMPOTENTE y SEGURO para migraciones y 'db reset'.

-- ==============================================================================
-- 0. PRE-REQUISITOS (Variables y Tipos)
-- ==============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rol_usuario') THEN
        CREATE TYPE public.rol_usuario AS ENUM ('ADMINISTRADOR', 'FARMACEUTICO', 'CAJERO');
    END IF;
END $$;

-- ==============================================================================
-- 1. FUNCIONES AUXILIARES (Solo si existen las tablas/tipos necesarios)
-- ==============================================================================

DO $$
BEGIN
    -- 1. get_my_farmacia_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios' 
        AND column_name = 'farmacia_id'
    ) THEN
        CREATE OR REPLACE FUNCTION public.get_my_farmacia_id()
        RETURNS UUID AS $func$
        BEGIN
          RETURN (
            SELECT farmacia_id 
            FROM public.usuarios 
            WHERE id = auth.uid()
          );
        END;
        $func$ LANGUAGE plpgsql SECURITY DEFINER;
    END IF;

    -- 2. get_my_role
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rol_usuario') 
       AND EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_schema = 'public' 
           AND table_name = 'usuarios' 
           AND column_name = 'rol'
       ) THEN
        
        CREATE OR REPLACE FUNCTION public.get_my_role()
        RETURNS public.rol_usuario AS $func$
        BEGIN
          RETURN (
            SELECT rol 
            FROM public.usuarios 
            WHERE id = auth.uid()
          );
        END;
        $func$ LANGUAGE plpgsql SECURITY DEFINER;

        -- is_admin
        CREATE OR REPLACE FUNCTION public.is_admin()
        RETURNS BOOLEAN AS $func$
        BEGIN
          RETURN COALESCE(public.get_my_role() = 'ADMINISTRADOR', false);
        END;
        $func$ LANGUAGE plpgsql SECURITY DEFINER;

        -- is_farmaceutico_or_admin
        CREATE OR REPLACE FUNCTION public.is_farmaceutico_or_admin()
        RETURNS BOOLEAN AS $func$
        DECLARE
          v_role public.rol_usuario;
        BEGIN
          v_role := public.get_my_role();
          RETURN COALESCE(v_role = 'ADMINISTRADOR' OR v_role = 'FARMACEUTICO', false);
        END;
        $func$ LANGUAGE plpgsql SECURITY DEFINER;
    END IF;
END $$;

-- ==============================================================================
-- 2. ACTIVACIÓN SEGURA DE RLS (Para todas las tablas solicitadas)
-- ==============================================================================

DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'farmacias', 'usuarios', 'medicamentos', 'ventas', 'detalle_ventas', 
        'clientes', 'proveedores', 'configuracion', 
        'cajas', 'movimientos_inventario', 'auditoria'
    ];
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        END IF;
    END LOOP;
END $$;

-- ==============================================================================
-- 3. POLITICAS RLS POR TABLA (Policies)
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- TABLA: FARMACIAS
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'farmacias') THEN
        DROP POLICY IF EXISTS "Ver propia farmacia" ON public.farmacias;
        CREATE POLICY "Ver propia farmacia" ON public.farmacias
        FOR SELECT USING (id = public.get_my_farmacia_id());

        DROP POLICY IF EXISTS "Admin actualiza propia farmacia" ON public.farmacias;
        CREATE POLICY "Admin actualiza propia farmacia" ON public.farmacias
        FOR UPDATE
        USING (id = public.get_my_farmacia_id() AND public.is_admin())
        WITH CHECK (id = public.get_my_farmacia_id() AND public.is_admin());
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TABLA: USUARIOS
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usuarios') THEN
        DROP POLICY IF EXISTS "Ver usuarios farmacia" ON public.usuarios;
        CREATE POLICY "Ver usuarios farmacia" ON public.usuarios
        FOR SELECT USING (farmacia_id = public.get_my_farmacia_id());

        DROP POLICY IF EXISTS "Admin gestiona usuarios" ON public.usuarios;
        CREATE POLICY "Admin gestiona usuarios" ON public.usuarios
        FOR ALL
        USING (farmacia_id = public.get_my_farmacia_id() AND public.is_admin())
        WITH CHECK (farmacia_id = public.get_my_farmacia_id() AND public.is_admin());
        
        DROP POLICY IF EXISTS "Ver mi propio usuario" ON public.usuarios;
        CREATE POLICY "Ver mi propio usuario" ON public.usuarios
        FOR SELECT USING (auth.uid() = id);
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TABLA: MEDICAMENTOS (Inventario)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'medicamentos') THEN
        DROP POLICY IF EXISTS "Ver medicamentos farmacia" ON public.medicamentos;
        CREATE POLICY "Ver medicamentos farmacia" ON public.medicamentos
        FOR SELECT USING (farmacia_id = public.get_my_farmacia_id());

        DROP POLICY IF EXISTS "Gestionar medicamentos" ON public.medicamentos;
        CREATE POLICY "Gestionar medicamentos" ON public.medicamentos
        FOR ALL
        USING (farmacia_id = public.get_my_farmacia_id() AND public.is_farmaceutico_or_admin())
        WITH CHECK (farmacia_id = public.get_my_farmacia_id() AND public.is_farmaceutico_or_admin());
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TABLA: VENTAS (POS)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ventas') THEN
        DROP POLICY IF EXISTS "Ver ventas farmacia" ON public.ventas;
        CREATE POLICY "Ver ventas farmacia" ON public.ventas
        FOR SELECT USING (farmacia_id = public.get_my_farmacia_id());

        DROP POLICY IF EXISTS "Crear ventas" ON public.ventas;
        CREATE POLICY "Crear ventas" ON public.ventas
        FOR INSERT WITH CHECK (farmacia_id = public.get_my_farmacia_id());
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TABLA: DETALLE_VENTAS
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'detalle_ventas') THEN
        DROP POLICY IF EXISTS "Ver detalles venta farmacia" ON public.detalle_ventas;
        CREATE POLICY "Ver detalles venta farmacia" ON public.detalle_ventas
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.ventas v 
            WHERE v.id = detalle_ventas.venta_id 
            AND v.farmacia_id = public.get_my_farmacia_id()
          )
        );

        DROP POLICY IF EXISTS "Crear detalles venta" ON public.detalle_ventas;
        CREATE POLICY "Crear detalles venta" ON public.detalle_ventas
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.ventas v 
            WHERE v.id = detalle_ventas.venta_id 
            AND v.farmacia_id = public.get_my_farmacia_id()
          )
        );
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TABLA: CLIENTES
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clientes') THEN
        DROP POLICY IF EXISTS "Ver clientes farmacia" ON public.clientes;
        CREATE POLICY "Ver clientes farmacia" ON public.clientes
        FOR SELECT USING (farmacia_id = public.get_my_farmacia_id());

        DROP POLICY IF EXISTS "Gestionar clientes farmacia" ON public.clientes;
        CREATE POLICY "Gestionar clientes farmacia" ON public.clientes
        FOR ALL
        USING (farmacia_id = public.get_my_farmacia_id())
        WITH CHECK (farmacia_id = public.get_my_farmacia_id());
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TABLA: PROVEEDORES
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'proveedores') THEN
        DROP POLICY IF EXISTS "Ver proveedores farmacia" ON public.proveedores;
        CREATE POLICY "Ver proveedores farmacia" ON public.proveedores
        FOR SELECT USING (farmacia_id = public.get_my_farmacia_id());

        DROP POLICY IF EXISTS "Gestionar proveedores" ON public.proveedores;
        CREATE POLICY "Gestionar proveedores" ON public.proveedores
        FOR ALL
        USING (farmacia_id = public.get_my_farmacia_id() AND public.is_farmaceutico_or_admin())
        WITH CHECK (farmacia_id = public.get_my_farmacia_id() AND public.is_farmaceutico_or_admin());
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TABLA: CONFIGURACION
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'configuracion') THEN
        DROP POLICY IF EXISTS "Admin gestiona configuracion" ON public.configuracion;
        CREATE POLICY "Admin gestiona configuracion" ON public.configuracion
        FOR ALL
        USING (farmacia_id = public.get_my_farmacia_id() AND public.is_admin())
        WITH CHECK (farmacia_id = public.get_my_farmacia_id() AND public.is_admin());
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- OTROS (CAJAS, MOVIMIENTOS, AUDITORIA)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['cajas', 'movimientos_inventario', 'auditoria']
    LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
             EXECUTE format('DROP POLICY IF EXISTS "Aislamiento %I" ON public.%I', t, t);
             EXECUTE format('CREATE POLICY "Aislamiento %I" ON public.%I USING (farmacia_id = public.get_my_farmacia_id())', t, t);
        END IF;
    END LOOP;
END $$;


-- ==============================================================================
-- 4. TRIGGERS DE SEGURIDAD (FORCE FARMACIA_ID)
-- ==============================================================================

DO $$
BEGIN
    -- Función para el trigger (requiere usuarios)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usuarios') THEN
        CREATE OR REPLACE FUNCTION public.force_farmacia_id()
        RETURNS TRIGGER AS $func$
        BEGIN
          NEW.farmacia_id := public.get_my_farmacia_id();
          RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql SECURITY DEFINER;
    END IF;

    -- Trigger Medicamentos
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'medicamentos') THEN
        DROP TRIGGER IF EXISTS tr_force_farmacia_medicamentos ON public.medicamentos;
        CREATE TRIGGER tr_force_farmacia_medicamentos
        BEFORE INSERT ON public.medicamentos
        FOR EACH ROW EXECUTE FUNCTION public.force_farmacia_id();
    END IF;

    -- Trigger Ventas
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ventas') THEN
        DROP TRIGGER IF EXISTS tr_force_farmacia_ventas ON public.ventas;
        CREATE TRIGGER tr_force_farmacia_ventas
        BEFORE INSERT ON public.ventas
        FOR EACH ROW EXECUTE FUNCTION public.force_farmacia_id();
    END IF;

    -- Trigger Clientes
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clientes') THEN
        DROP TRIGGER IF EXISTS tr_force_farmacia_clientes ON public.clientes;
        CREATE TRIGGER tr_force_farmacia_clientes
        BEFORE INSERT ON public.clientes
        FOR EACH ROW EXECUTE FUNCTION public.force_farmacia_id();
    END IF;
    
    -- Trigger Usuarios (si farmacia_id es null)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usuarios') THEN
        DROP TRIGGER IF EXISTS tr_force_farmacia_usuarios ON public.usuarios;
        CREATE TRIGGER tr_force_farmacia_usuarios
        BEFORE INSERT ON public.usuarios
        FOR EACH ROW
        WHEN (NEW.farmacia_id IS NULL)
        EXECUTE FUNCTION public.force_farmacia_id();
    END IF;
END $$;
