-- ==============================================================================
-- SEED DATA - USUARIOS DE PRUEBA (AUTH + PUBLIC)
-- ==============================================================================
-- Este script crea usuarios directamente en auth.users y public.usuarios
-- para permitir el login inmediato en desarrollo.

-- 1. Asegurar que pgcrypto existe para hashear passwords
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Insertar en auth.users (Supabase Auth)
-- Las contraseñas son hasheadas con bcrypt (equivalente a lo que hace Gotrue)
INSERT INTO auth.users (
    id, 
    instance_id, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_app_meta_data, 
    raw_user_meta_data, 
    created_at, 
    updated_at, 
    role, 
    aud,
    confirmation_token
)
VALUES 
  -- ADMIN
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'admin@farmacia.com', crypt('admin123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"nombre_completo":"Admin Demo","rol":"ADMINISTRADOR"}', NOW(), NOW(), 'authenticated', 'authenticated', ''),
  
  -- FARMACEUTICO
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'farm@farmacia.com', crypt('farm123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"nombre_completo":"Farmaceutico Demo","rol":"FARMACEUTICO"}', NOW(), NOW(), 'authenticated', 'authenticated', ''),
  
  -- CAJERO
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'caja@farmacia.com', crypt('cajero123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"nombre_completo":"Cajero Demo","rol":"CAJERO"}', NOW(), NOW(), 'authenticated', 'authenticated', '')
ON CONFLICT (id) DO NOTHING;

-- 3. Crear Farmacia Default (si no existe)
INSERT INTO public.farmacias (id, nombre, nit, direccion, telefono)
VALUES ('00000000-0000-0000-0000-000000000001', 'Farmacia Central Demo', '0614-000000-001-0', 'San Salvador, SV', '2222-0000')
ON CONFLICT (id) DO NOTHING;

-- 4. Sincronizar en public.usuarios (Perfiles)
-- Esto es necesario porque nuestros RLS leen de AQUÍ, no de auth.users
INSERT INTO public.usuarios (id, farmacia_id, username, email, nombre_completo, rol)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin', 'admin@farmacia.com', 'Admin Demo', 'ADMINISTRADOR'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'farmaceutico', 'farm@farmacia.com', 'Farmaceutico Demo', 'FARMACEUTICO'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'cajero', 'caja@farmacia.com', 'Cajero Demo', 'CAJERO')
ON CONFLICT (id) DO NOTHING;
