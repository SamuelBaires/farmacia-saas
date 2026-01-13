-- ==============================================================================
-- FUNCION RPC PROCESAR VENTA (TRANSACCIONAL)
-- ==============================================================================

-- Esta función maneja toda la lógica de venta en una "transacción" implícita
-- de PostgreSQL. Si falla algo, se hace rollback de todo.

CREATE OR REPLACE FUNCTION public.procesar_venta(
    venta_data JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_farmacia_id UUID;
    v_usuario_id UUID;
    v_cliente_id UUID;
    v_venta_id UUID;
    v_total NUMERIC(10,2);
    v_item JSONB;
    v_medicamento RECORD;
    v_nuevo_stock INTEGER;
    v_detalles JSONB;
    v_fecha TIMESTAMP;
BEGIN
    -- 1. OBTENER CONTEXTO DE SEGURIDAD
    v_fecha := NOW();
    v_farmacia_id := public.get_my_farmacia_id();
    v_usuario_id := auth.uid();

    IF v_farmacia_id IS NULL THEN
        RAISE EXCEPTION 'No se pudo identificar la farmacia del usuario.';
    END IF;

    -- Validar rol (Opcional, pero RLS ya lo hace. Aquí por doble seguridad logic)
    IF NOT (public.is_admin() OR public.get_my_role() = 'CAJERO' OR public.get_my_role() = 'FARMACEUTICO') THEN
        RAISE EXCEPTION 'No tiene permisos para procesar ventas.';
    END IF;

    -- 2. VALIDAR DATOS DE ENTRADA
    v_cliente_id := (venta_data->>'cliente_id')::UUID; -- Puede ser NULL
    v_detalles := venta_data->'detalles';
    v_total := (venta_data->>'total')::NUMERIC;
    
    IF v_detalles IS NULL OR jsonb_array_length(v_detalles) = 0 THEN
        RAISE EXCEPTION 'La venta no tiene productos.';
    END IF;

    -- 3. CREAR VENTA
    INSERT INTO public.ventas (
        farmacia_id, 
        usuario_id, 
        cliente_id, 
        numero_venta, -- Generaremos uno temporal o usaremos uno de la UI si viene, sino autogenerado
        subtotal, 
        descuento, 
        total, 
        metodo_pago,
        fecha_venta
    ) 
    VALUES (
        v_farmacia_id,
        v_usuario_id,
        v_cliente_id,
        COALESCE(venta_data->>'numero_venta', 'V-' || floor(extract(epoch from v_fecha))),
        COALESCE((venta_data->>'subtotal')::NUMERIC, v_total),
        COALESCE((venta_data->>'descuento')::NUMERIC, 0),
        v_total,
        (venta_data->>'metodo_pago')::metodo_pago,
        v_fecha
    )
    RETURNING id INTO v_venta_id;

    -- 4. PROCESAR DETALLES Y STOCK
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_detalles)
    LOOP
        -- Buscar medicamento y bloquear fila para update (FOR UPDATE)
        SELECT * INTO v_medicamento 
        FROM public.medicamentos 
        WHERE id = (v_item->>'medicamento_id')::UUID 
        AND farmacia_id = v_farmacia_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Medicamento no encontrado o no pertenece a su farmacia: %', (v_item->>'medicamento_id');
        END IF;

        IF NOT v_medicamento.activo THEN
            RAISE EXCEPTION 'El medicamento "%" no está activo.', v_medicamento.nombre_comercial;
        END IF;

        -- Validar Stock
        v_nuevo_stock := v_medicamento.stock_actual - (v_item->>'cantidad')::INTEGER;
        
        IF v_nuevo_stock < 0 THEN
            RAISE EXCEPTION 'Stock insuficiente para "%". Disponible: %, Solicitado: %', 
                v_medicamento.nombre_comercial, v_medicamento.stock_actual, (v_item->>'cantidad');
        END IF;

        -- Actualizar Stock
        UPDATE public.medicamentos 
        SET stock_actual = v_nuevo_stock,
            updated_at = NOW()
        WHERE id = v_medicamento.id;

        -- Insertar Detalle Venta
        INSERT INTO public.detalle_ventas (
            venta_id,
            medicamento_id,
            cantidad,
            precio_unitario,
            subtotal
        ) VALUES (
            v_venta_id,
            v_medicamento.id,
            (v_item->>'cantidad')::INTEGER,
            (v_item->>'precio_unitario')::NUMERIC,
            ((v_item->>'cantidad')::INTEGER * (v_item->>'precio_unitario')::NUMERIC)
        );

        -- Registrar Movimiento de Inventario (SALIDA)
        INSERT INTO public.movimientos_inventario (
            farmacia_id,
            medicamento_id,
            usuario_id,
            tipo_movimiento,
            cantidad,
            precio_unitario,
            referencia,
            observaciones,
            fecha_movimiento
        ) VALUES (
            v_farmacia_id,
            v_medicamento.id,
            v_usuario_id,
            'SALIDA',
            (v_item->>'cantidad')::INTEGER,
            (v_item->>'precio_unitario')::NUMERIC,
            'VENTA #' || v_venta_id,
            'Salida por venta POS',
            v_fecha
        );

    END LOOP;

    -- 5. RETURN SUCCESS
    RETURN jsonb_build_object(
        'success', true,
        'venta_id', v_venta_id,
        'message', 'Venta procesada correctamente'
    );

EXCEPTION WHEN OTHERS THEN
    -- El rollback es automático en Supabase/Postgres RPC si hay excepción
    RAISE EXCEPTION 'Error al procesar venta: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
