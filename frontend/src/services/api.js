import axios from 'axios';
import { supabase } from './supabaseClient';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

// Auth services
export const authService = {
    login: async (username, password) => {
        // En un despliegue con Supabase Auth, se usaría supabase.auth.signInWithPassword
        // Para este POC, simulamos el login si el backend de Python no está disponible
        try {
            const response = await api.post('/auth/login', { username, password });
            return response.data;
        } catch (error) {
            console.warn('Backend Python no disponible, intentando Supabase o bypass...');
            // Lógica de bypass para pruebas en Render sin backend real
            if (username === 'admin' && password === 'admin123') {
                const mockUser = { id: 'admin-id', username: 'admin', rol: 'ADMINISTRADOR' };
                localStorage.setItem('token', 'mock-token');
                localStorage.setItem('user', JSON.stringify(mockUser));
                return { access_token: 'mock-token', user: mockUser };
            }
            throw error;
        }
    },

    logout: async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
};

// Medicamentos services
export const medicamentosService = {
    getAll: async (params = {}) => {
        const response = await api.get('/medicamentos', { params });
        return response.data;
    },

    getByBarcode: async (codigo_barras) => {
        const response = await api.get(`/medicamentos/barcode/${codigo_barras}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/medicamentos', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/medicamentos/${id}`, data);
        return response.data;
    },

    getAlertasStockMinimo: async () => {
        const response = await api.get('/medicamentos/alertas/stock-minimo');
        return response.data;
    },
};

// POS services
export const posService = {
    crearVenta: async (data) => {
        const response = await api.post('/pos/ventas', data);
        return response.data;
    },

    getVentas: async (params = {}) => {
        const response = await api.get('/pos/ventas', { params });
        return response.data;
    },
};

// Clientes services
export const clientesService = {
    getAll: async (params = {}) => {
        const response = await api.get('/clientes', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/clientes/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/clientes', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/clientes/${id}`, data);
        return response.data;
    },

    getHistorial: async (id) => {
        const response = await api.get(`/clientes/${id}/historial`);
        return response.data;
    },
};

// Proveedores services
export const proveedoresService = {
    getAll: async (params = {}) => {
        const response = await api.get('/proveedores', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/proveedores/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/proveedores', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/proveedores/${id}`, data);
        return response.data;
    },

    getEntradas: async (id) => {
        const response = await api.get(`/proveedores/${id}/entradas`);
        return response.data;
    },
};

// Reportes services
export const reportesService = {
    getDashboard: async () => {
        const response = await api.get('/reportes/dashboard');
        return response.data;
    },

    descargarReporte: async (tipo, formato) => {
        const response = await api.get(`/reportes/descargar/${tipo}/${formato}`, {
            responseType: 'blob',
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `reporte_${tipo}_${new Date().toISOString().split('T')[0]}.${formato === 'excel' ? 'xlsx' : 'pdf'}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
};

// Configuracion services
export const configuracionService = {
    getConfig: async () => {
        const response = await api.get('/configuracion');
        return response.data;
    },

    updateConfig: async (data) => {
        const response = await api.put('/configuracion', data);
        return response.data;
    },

    getUsuarios: async () => {
        const response = await api.get('/configuracion/usuarios');
        return response.data;
    },

    createUsuario: async (data) => {
        const response = await api.post('/configuracion/usuarios', data);
        return response.data;
    },

    updateUsuario: async (id, data) => {
        const response = await api.put(`/configuracion/usuarios/${id}`, data);
        return response.data;
    },

    deleteUsuario: async (id) => {
        const response = await api.delete(`/configuracion/usuarios/${id}`);
        return response.data;
    },
};
