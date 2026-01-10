-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums (Idempotent)
DO $$ BEGIN
    CREATE TYPE rol_usuario AS ENUM ('ADMINISTRADOR', 'FARMACEUTICO', 'CAJERO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_movimiento AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'VENCIMIENTO', 'DEVOLUCION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE metodo_pago AS ENUM ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'MIXTO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE estado_caja AS ENUM ('ABIERTA', 'CERRADA', 'PENDIENTE_REVISION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS farmacias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(200) NOT NULL,
    nit VARCHAR(20) UNIQUE NOT NULL,
    direccion VARCHAR(500),
    telefono VARCHAR(20),
    email VARCHAR(100),
    registro_sanitario VARCHAR(100),
    configuracion JSONB DEFAULT '{}'::jsonb,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    farmacia_id UUID NOT NULL REFERENCES farmacias(id),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    nombre_completo VARCHAR(200) NOT NULL,
    rol rol_usuario NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmacia_id UUID NOT NULL REFERENCES farmacias(id),
    nombre VARCHAR(200) NOT NULL,
    nit VARCHAR(20),
    direccion VARCHAR(500),
    telefono VARCHAR(20),
    email VARCHAR(100),
    contacto VARCHAR(200),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medicamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmacia_id UUID NOT NULL REFERENCES farmacias(id),
    proveedor_id UUID REFERENCES proveedores(id),
    codigo_barras VARCHAR(50) NOT NULL,
    nombre_comercial VARCHAR(200) NOT NULL,
    nombre_generico VARCHAR(200),
    lote VARCHAR(50),
    fecha_vencimiento DATE,
    precio_compra NUMERIC(10, 2) NOT NULL,
    precio_venta NUMERIC(10, 2) NOT NULL,
    stock_actual INTEGER DEFAULT 0 NOT NULL,
    stock_minimo INTEGER DEFAULT 10 NOT NULL,
    es_controlado BOOLEAN DEFAULT FALSE,
    requiere_receta BOOLEAN DEFAULT FALSE,
    categoria VARCHAR(100),
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmacia_id UUID NOT NULL REFERENCES farmacias(id),
    nombre VARCHAR(200) NOT NULL,
    nit_dui VARCHAR(20),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cajas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmacia_id UUID NOT NULL REFERENCES farmacias(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    monto_inicial NUMERIC(10, 2) NOT NULL,
    monto_final NUMERIC(10, 2),
    monto_esperado NUMERIC(10, 2),
    diferencia NUMERIC(10, 2),
    fecha_apertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    estado estado_caja DEFAULT 'ABIERTA',
    observaciones TEXT
);

CREATE TABLE IF NOT EXISTS ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmacia_id UUID NOT NULL REFERENCES farmacias(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    cliente_id UUID REFERENCES clientes(id),
    caja_id UUID REFERENCES cajas(id),
    numero_venta VARCHAR(50) UNIQUE NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    descuento NUMERIC(10, 2) DEFAULT 0,
    total NUMERIC(10, 2) NOT NULL,
    metodo_pago metodo_pago NOT NULL,
    referencia_pago VARCHAR(100),
    requirio_receta BOOLEAN DEFAULT FALSE,
    observaciones TEXT,
    fecha_venta TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS detalle_ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    medicamento_id UUID NOT NULL REFERENCES medicamentos(id),
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    lote VARCHAR(50),
    fecha_vencimiento DATE
);

CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmacia_id UUID NOT NULL REFERENCES farmacias(id),
    medicamento_id UUID NOT NULL REFERENCES medicamentos(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    tipo_movimiento tipo_movimiento NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC(10, 2),
    referencia VARCHAR(100),
    observaciones TEXT,
    fecha_movimiento TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmacia_id UUID NOT NULL REFERENCES farmacias(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    tabla VARCHAR(100) NOT NULL,
    accion VARCHAR(20) NOT NULL,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_medicamentos_codigo_barras ON medicamentos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_medicamentos_nombre ON medicamentos(nombre_comercial);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
DROP TRIGGER IF EXISTS update_farmacias_updated_at ON farmacias;
CREATE TRIGGER update_farmacias_updated_at BEFORE UPDATE ON farmacias FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_proveedores_updated_at ON proveedores;
CREATE TRIGGER update_proveedores_updated_at BEFORE UPDATE ON proveedores FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_medicamentos_updated_at ON medicamentos;
CREATE TRIGGER update_medicamentos_updated_at BEFORE UPDATE ON medicamentos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
-- RLS (Row Level Security) - Basic Setup for POC
ALTER TABLE farmacias ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON farmacias;
CREATE POLICY "Allow all for authenticated users" ON farmacias FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow users to see their own profile" ON usuarios;
CREATE POLICY "Allow users to see their own profile" ON usuarios FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow admins to see all profiles" ON usuarios;
CREATE POLICY "Allow admins to see all profiles" ON usuarios FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'ADMINISTRADOR')
);

-- Note: In a production environment, you would add more granular policies.

-- SEED DATA (Solo para entorno de pruebas/inicial)
-- Primero creamos una farmacia por defecto
INSERT INTO farmacias (id, nombre, nit, direccion, telefono)
VALUES ('00000000-0000-0000-0000-000000000001', 'Farmacia Central POC', '0614-000000-001-0', 'San Salvador, SV', '2222-0000')
ON CONFLICT (id) DO NOTHING;

-- Instrucción para Supabase Auth:
-- Los usuarios de Auth deben crearse a través de la interfaz de Supabase o la Auth API.
-- Sin embargo, para este script SQL inicial, podemos insertar en auth.users si tienes permisos de superusuario,
-- pero lo más seguro es que el usuario los cree manualmente o use una función de trigger.

-- Por simplicidad en este POC, el trigger sincronizará si se crean desde el panel:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, farmacia_id, username, email, nombre_completo, rol)
  VALUES (
    NEW.id,
    '00000000-0000-0000-0000-000000000001',
    split_part(NEW.email, '@', 1),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'rol')::rol_usuario, 'CAJERO')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- DATOS DE PRUEBA (Para insertar después de haber creado los usuarios en Auth)
-- Si ya tienes los IDs de auth.users, puedes insertarlos así:
/*
INSERT INTO usuarios (id, farmacia_id, username, email, nombre_completo, rol)
VALUES 
('UUID_ADMIN', '00000000-0000-0000-0000-000000000001', 'admin', 'admin@farmacia.com', 'Admin Demo', 'ADMINISTRADOR'),
('UUID_FARM', '00000000-0000-0000-0000-000000000001', 'farmaceutico', 'farm@farmacia.com', 'Farm de Prueba', 'FARMACEUTICO'),
('UUID_CAJA', '00000000-0000-0000-0000-000000000001', 'cajero', 'caja@farmacia.com', 'Caja de Prueba', 'CAJERO');
*/
