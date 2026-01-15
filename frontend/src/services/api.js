import { supabase } from './supabaseClient';

/**
 * API Service Centralizado (Supabase)
 * Estructura solicitada: authService, usuariosService, medicamentosService, ventasService
 */

export const authService = {
    login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;

        // Obtener perfil extendido
        const { data: profile } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', data.user.id)
            .single();

        return {
            access_token: data.session.access_token,
            user: profile || {
                id: data.user.id,
                email: data.user.email,
                rol: 'CAJERO', // Fallback seguro
                nombre_completo: data.user.email
            }
        };
    },

    logout: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getUser: async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return null;

        const { data: profile } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', user.id)
            .single();

        return profile || user;
    }
};

export const auditoriaService = {
    registrarAccion: async (accionData) => {
        // accionData: { usuario_id, farmacia_id, tabla, accion, datos_anteriores, datos_nuevos, detalle }
        // Note: The python model has 'ip_address' and 'user_agent' but we might not have them easily in pure client side without backend help.
        // We will send what we can.
        const { data, error } = await supabase
            .from('auditoria')
            .insert([{
                ...accionData,
                created_at: new Date().toISOString()
            }]);

        if (error) {
            console.error('Error logging audit:', error);
            // Don't throw, audit failure shouldn't block main flow usually
        }
        return data;
    }
};

export const usuariosService = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .order('nombre_completo');
        if (error) throw error;
        return data;
    },

    getById: async (id) => {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    create: async (userData) => {
        // For Supabase Auth, we ideally use the Admin API or an Edge Function.
        // Here we simulate the profile creation in 'usuarios' table.
        // In a real production app, this should trigger a backend function to create the Auth user too.

        // 1. Create Profile
        const { data, error } = await supabase
            .from('usuarios')
            .insert([{
                ...userData,
                activo: true
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    update: async (id, changes) => {
        const { data, error } = await supabase
            .from('usuarios')
            .update(changes)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    delete: async (id) => {
        const { error } = await supabase
            .from('usuarios')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    toggleActivo: async (id, estadoActual) => {
        const { data, error } = await supabase
            .from('usuarios')
            .update({ activo: !estadoActual })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

export const medicamentosService = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('medicamentos')
            .select('*, proveedores(nombre)')
            .eq('activo', true)
            .order('nombre_comercial');
        if (error) throw error;
        return data;
    },

    getByBarcode: async (codigo_barras) => {
        const { data, error } = await supabase
            .from('medicamentos')
            .select('*')
            .eq('codigo_barras', codigo_barras)
            .eq('activo', true)
            .single();
        if (error) throw error;
        return data;
    },

    create: async (medicamento) => {
        const { data, error } = await supabase
            .from('medicamentos')
            .insert([medicamento])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    update: async (id, changes) => {
        const { data, error } = await supabase
            .from('medicamentos')
            .update(changes)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    getAlertasStockMinimo: async () => {
        // Supabase doesn't natively support column-to-column comparison in .lte() easily.
        // We fetch active meds and filter client-side for better reliability in this specific case.
        const { data, error } = await supabase
            .from('medicamentos')
            .select('*')
            .eq('activo', true);

        if (error) throw error;

        // Return only items where stock is below or equal to minimum
        return data.filter(m => Number(m.stock_actual) <= Number(m.stock_minimo));
    },

    delete: async (id) => {
        // Soft delete (set activo = false) is safer for medicines with history
        const { data, error } = await supabase
            .from('medicamentos')
            .update({ activo: false })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

export const ventasService = {
    crearVenta: async (ventaData) => {
        // Enviar todo al backend (RPC) para manejo transaccional
        const { data, error } = await supabase
            .rpc('procesar_venta', { venta_data: ventaData });

        if (error) throw error;
        return data; // { success: true, venta_id: ... }
    },

    getVentas: async () => {
        const { data, error } = await supabase
            .from('ventas')
            .select('*, usuarios(nombre_completo), clientes(nombre)')
            .order('fecha_venta', { ascending: false });
        if (error) throw error;
        return data;
    }
};

// Servicios adicionales no explícitamente pedidos pero necesarios para funcionamiento existente
export const clientesService = {
    getAll: async () => {
        const { data, error } = await supabase.from('clientes').select('*').order('nombre');
        if (error) throw error;
        return data;
    },
    create: async (cliente) => {
        const { data, error } = await supabase.from('clientes').insert([cliente]).select().single();
        if (error) throw error;
        return data;
    },
    update: async (id, changes) => {
        const { data, error } = await supabase.from('clientes').update(changes).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },
    getHistorial: async (id) => {
        const { data, error } = await supabase
            .from('ventas')
            .select(`
                *,
                detalles:detalle_ventas (
                    *,
                    medicamento:medicamentos (nombre_comercial)
                )
            `)
            .eq('cliente_id', id)
            .order('fecha_venta', { ascending: false });
        if (error) throw error;
        return data;
    }
};

export const proveedoresService = {
    getAll: async () => {
        const { data, error } = await supabase.from('proveedores').select('*').eq('activo', true).order('nombre');
        if (error) throw error;
        return data;
    },
    getEntradas: async (proveedorId) => {
        const { data, error } = await supabase
            .from('movimientos_inventario')
            .select(`
                *,
                medicamento:medicamentos!inner (
                    nombre_comercial,
                    proveedor_id
                )
            `)
            .eq('medicamento.proveedor_id', proveedorId)
            .eq('tipo_movimiento', 'ENTRADA')
            .order('fecha_movimiento', { ascending: false });
        if (error) throw error;
        return data;
    },
};

export const configuracionService = {
    getConfig: async () => {
        const { data, error } = await supabase.from('farmacias').select('*').single();
        if (error) throw error;
        return data;
    },
    updateConfig: async (changes) => {
        const { data, error } = await supabase.from('farmacias').update(changes).eq('id', changes.id).select().single();
        if (error) throw error;
        return data;
    },
    getUsuarios: async () => {
        const { data, error } = await supabase.from('usuarios').select('*').order('nombre_completo');
        if (error) throw error;
        return data;
    }
};

export const cajasService = {
    verificarEstado: async (usuario_id) => {
        const { data, error } = await supabase
            .from('cajas')
            .select('*')
            .eq('usuario_id', usuario_id)
            .eq('estado', 'ABIERTA')
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"
        return data; // Returns the open box record or null
    },

    abrirCaja: async (cajaData) => {
        const { data, error } = await supabase
            .from('cajas')
            .insert([cajaData])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    cerrarCaja: async (id, datosCierre) => {
        const { data, error } = await supabase
            .from('cajas')
            .update({
                ...datosCierre,
                estado: 'CERRADA',
                fecha_cierre: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    getTotalesCaja: async (caja_id) => {
        // Calculate totals for the specific box session
        const { data: ventas, error } = await supabase
            .from('ventas')
            .select('total, metodo_pago')
            .eq('caja_id', caja_id);

        if (error) throw error;

        const totales = ventas.reduce((acc, venta) => {
            const monto = Number(venta.total);
            acc.total += monto;
            if (venta.metodo_pago === 'EFECTIVO') acc.efectivo += monto;
            else if (venta.metodo_pago === 'TARJETA') acc.tarjeta += monto;
            else acc.otros += monto;
            return acc;
        }, { total: 0, efectivo: 0, tarjeta: 0, otros: 0 });

        return totales;
    }
};

export const reportesService = {
    getDashboard: async () => {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

        // 1. Ventas del Mes
        const { data: ventasMes, error: errMes } = await supabase
            .from('ventas')
            .select('total')
            .gte('fecha_venta', startOfMonth);
        if (errMes) throw errMes;
        const totalMes = ventasMes.reduce((acc, v) => acc + Number(v.total), 0);

        // 2. Ventas Hoy
        const { data: ventasHoy, error: errHoy } = await supabase
            .from('ventas')
            .select('total')
            .gte('fecha_venta', startOfDay);
        if (errHoy) throw errHoy;
        const totalHoy = ventasHoy.reduce((acc, v) => acc + Number(v.total), 0);

        // 3. Conteo de Productos
        const { count: totalProductos, error: errProd } = await supabase
            .from('medicamentos')
            .select('id', { count: 'exact', head: true })
            .eq('activo', true);
        if (errProd) throw errProd;

        // 4. Stock Bajo
        const alertas = await medicamentosService.getAlertasStockMinimo();

        return {
            ventas_mes: totalMes,
            ventas_hoy: totalHoy,
            total_productos: totalProductos,
            stock_bajo_count: alertas.length,
            top_productos: [],
            alertas_inventario: alertas.slice(0, 5)
        };
    },

    getReporteVentas: async (fechaInicio, fechaFin) => {
        let query = supabase
            .from('ventas')
            .select(`
                *,
                usuarios (nombre_completo),
                clientes (nombre, documento_identidad),
                detalles:detalle_ventas (
                    cantidad,
                    precio_unitario,
                    subtotal,
                    medicamento:medicamentos (nombre_comercial, nombre_generico)
                )
            `)
            .order('fecha_venta', { ascending: false });

        if (fechaInicio) query = query.gte('fecha_venta', fechaInicio);
        if (fechaFin) {
            const endDate = new Date(fechaFin);
            endDate.setHours(23, 59, 59, 999);
            query = query.lte('fecha_venta', endDate.toISOString());
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    getReporteInventario: async (soloBajoStock = false) => {
        let query = supabase
            .from('medicamentos')
            .select('*, proveedores (nombre)')
            .eq('activo', true)
            .order('nombre_comercial');

        const { data, error } = await query;
        if (error) throw error;

        if (soloBajoStock) {
            return data.filter(m => m.stock_actual <= m.stock_minimo);
        }
        return data;
    },

    getReporteControlados: async (fechaInicio, fechaFin) => {
        let query = supabase
            .from('movimientos_inventario')
            .select(`
                *,
                usuario:usuarios (nombre_completo),
                medicamento:medicamentos!inner (
                    nombre_comercial,
                    nombre_generico,
                    es_controlado,
                    lote
                )
            `)
            .eq('medicamento.es_controlado', true)
            .order('fecha_movimiento', { ascending: true });

        if (fechaInicio) query = query.gte('fecha_movimiento', fechaInicio);
        if (fechaFin) {
            const endDate = new Date(fechaFin);
            endDate.setHours(23, 59, 59, 999);
            query = query.lte('fecha_movimiento', endDate.toISOString());
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }
};

// Alias para compatibilidad con código existente que usa posService
export const posService = ventasService;
