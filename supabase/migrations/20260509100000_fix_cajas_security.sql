-- ==============================================================================
-- CORRECCIÓN DE SEGURIDAD Y ESTABILIZACIÓN MULTI-TENANCY
-- ==============================================================================

-- 0. Asegurar funciones base
CREATE OR REPLACE FUNCTION public.get_my_farmacia_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT farmacia_id 
    FROM public.usuarios 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.force_farmacia_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.farmacia_id := public.get_my_farmacia_id();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Añadir triggers para forzar farmacia_id en todas las tablas críticas
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'cajas', 'movimientos_inventario', 'auditoria', 
        'medicamentos', 'clientes', 'proveedores', 
        'ventas', 'detalle_ventas', 'compras', 'detalle_compras'
    ];
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        -- Solo si la tabla existe Y tiene la columna farmacia_id
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) AND
           EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'farmacia_id') 
        THEN
            EXECUTE format('DROP TRIGGER IF EXISTS tr_force_farmacia_%I ON public.%I', t, t);
            EXECUTE format('CREATE TRIGGER tr_force_farmacia_%I BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.force_farmacia_id()', t, t);
        END IF;
    END LOOP;
END $$;

-- 2. Mejorar políticas RLS para aislamiento y permisos de escritura
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'cajas', 'movimientos_inventario', 'auditoria', 
        'medicamentos', 'clientes', 'proveedores', 
        'ventas', 'detalle_ventas', 'compras', 'detalle_compras'
    ];
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        -- Solo si la tabla existe Y tiene la columna farmacia_id
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) AND
           EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'farmacia_id')
        THEN
            EXECUTE format('DROP POLICY IF EXISTS "Aislamiento %I" ON public.%I', t, t);
            EXECUTE format('CREATE POLICY "Aislamiento %I" ON public.%I FOR ALL USING (farmacia_id = public.get_my_farmacia_id()) WITH CHECK (farmacia_id = public.get_my_farmacia_id())', t, t);
        END IF;
    END LOOP;
END $$;

-- 3. Asegurar permisos para el rol authenticated
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT USAGE ON TYPE public.estado_caja TO authenticated;
GRANT USAGE ON TYPE public.forma_farmaceutica_enum TO authenticated;
