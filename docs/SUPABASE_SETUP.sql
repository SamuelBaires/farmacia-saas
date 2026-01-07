-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE rol_usuario AS ENUM ('ADMINISTRADOR', 'FARMACEUTICO', 'CAJERO');
CREATE TYPE tipo_movimiento AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'VENCIMIENTO', 'DEVOLUCION');
CREATE TYPE metodo_pago AS ENUM ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'MIXTO');
CREATE TYPE estado_caja AS ENUM ('ABIERTA', 'CERRADA', 'PENDIENTE_REVISION');

-- Tables
CREATE TABLE farmacias (
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

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmacia_id UUID NOT NULL REFERENCES farmacias(id),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(200) NOT NULL,
    rol rol_usuario NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE proveedores (
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

CREATE TABLE medicamentos (
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

CREATE TABLE clientes (
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

CREATE TABLE cajas (
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

CREATE TABLE ventas (
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

CREATE TABLE detalle_ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    medicamento_id UUID NOT NULL REFERENCES medicamentos(id),
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    lote VARCHAR(50),
    fecha_vencimiento DATE
);

CREATE TABLE movimientos_inventario (
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

CREATE TABLE auditoria (
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
CREATE INDEX idx_medicamentos_codigo_barras ON medicamentos(codigo_barras);
CREATE INDEX idx_medicamentos_nombre ON medicamentos(nombre_comercial);
CREATE INDEX idx_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- Functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_farmacias_updated_at BEFORE UPDATE ON farmacias FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_proveedores_updated_at BEFORE UPDATE ON proveedores FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_medicamentos_updated_at BEFORE UPDATE ON medicamentos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
