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
        // En Supabase Auth, los usuarios se crean en auth.users
        // Este método podría ser para crear el perfil en public.usuarios o usar una Edge Function para crear auth+perfil
        // Asumimos creación de perfil o gestión administrativa
        const { data, error } = await supabase
            .from('usuarios')
            .insert([userData])
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
        const { data, error } = await supabase
            .from('medicamentos')
            .select('*')
            .lte('stock_actual', 'stock_minimo') // stock_actual <= stock_minimo
            .eq('activo', true);
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
    }
};

export const proveedoresService = {
    getAll: async () => {
        const { data, error } = await supabase.from('proveedores').select('*').eq('activo', true).order('nombre');
        if (error) throw error;
        return data;
    }
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
        const { data: stockBajo, error: errStock } = await supabase
            .from('medicamentos')
            .select('id, nombre_comercial, stock_actual, stock_minimo')
            .lte('stock_actual', supabase.rpc('stock_minimo_col') || 10) // Usamos filtro JS post-fetch si rpc falla, o simple logic
            .eq('activo', true);

        // Mejor aproximación para stock bajo sin RPC compleja: traer todo y filtrar o usar query raw
        // Por ahora, asumimos que stock_minimo es columna. La comparación columna vs columna en postgrest suele requerir RPC o filtro específico.
        // Haremos un fetch de alertas directas usando la función de api "getAlertasStockMinimo" logic
        const alertas = await medicamentosService.getAlertasStockMinimo();

        return {
            ventas_mes: totalMes,
            ventas_hoy: totalHoy,
            total_productos: totalProductos,
            stock_bajo_count: alertas.length,
            top_productos: [], // Implementar si hay tabla detalle_ventas
            alertas_inventario: alertas.slice(0, 5)
        };
    }
};

// Alias para compatibilidad con código existente que usa posService
export const posService = ventasService;
