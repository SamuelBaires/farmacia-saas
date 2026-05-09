-- ==============================================================================
-- CORRECCIÓN DE SEGURIDAD Y RLS PARA TABLA CAJAS Y OTRAS
-- ==============================================================================

-- 0. Asegurar funciones base (En caso de que no existan o fallen en migraciones previas)
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

-- 1. Añadir triggers para forzar farmacia_id
-- Esto asegura que aunque el frontend no lo envíe o envíe uno incorrecto,
-- el sistema use el farmacia_id del perfil del usuario autenticado.

DO $$
DECLARE
    t text;
    tables text[] := ARRAY['cajas', 'movimientos_inventario', 'auditoria'];
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            EXECUTE format('DROP TRIGGER IF EXISTS tr_force_farmacia_%I ON public.%I', t, t);
            EXECUTE format('CREATE TRIGGER tr_force_farmacia_%I BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.force_farmacia_id()', t, t);
        END IF;
    END LOOP;
END $$;

-- 2. Mejorar política RLS para estas tablas
-- La política anterior solo usaba USING. Añadimos WITH CHECK para INSERT y UPDATE.

DO $$
DECLARE
    t text;
    tables text[] := ARRAY['cajas', 'movimientos_inventario', 'auditoria'];
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            EXECUTE format('DROP POLICY IF EXISTS "Aislamiento %I" ON public.%I', t, t);
            EXECUTE format('CREATE POLICY "Aislamiento %I" ON public.%I FOR ALL USING (farmacia_id = public.get_my_farmacia_id()) WITH CHECK (farmacia_id = public.get_my_farmacia_id())', t, t);
        END IF;
    END LOOP;
END $$;

-- 3. Asegurar que los usuarios autenticados puedan usar el tipo enum estado_caja
-- A veces los permisos de tipos no se heredan correctamente en entornos Supabase.

GRANT USAGE ON TYPE public.estado_caja TO authenticated;
GRANT ALL ON TABLE public.cajas TO authenticated;
GRANT ALL ON TABLE public.movimientos_inventario TO authenticated;
GRANT ALL ON TABLE public.auditoria TO authenticated;
