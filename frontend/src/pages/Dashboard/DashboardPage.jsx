import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, Package, AlertTriangle, DollarSign, Activity } from 'lucide-react';
import { reportesService } from '../../services/api';
import toast from 'react-hot-toast';

const DashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Redirigir cajeros al POS ya que no tienen acceso a métricas generales
        if (user?.rol === 'CAJERO') {
            navigate('/pos');
            return;
        }

        const fetchMetrics = async () => {
            try {
                const data = await reportesService.getDashboard();
                setMetrics(data);
            } catch (error) {
                console.error('Error al cargar métricas:', error);
                toast.error('No se pudieron cargar las métricas del dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, [user, navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const stats = [
        {
            title: 'Ventas Hoy',
            value: `$${(metrics?.ventas_hoy ?? 0).toLocaleString()}`,
            icon: DollarSign,
            color: 'bg-green-500',
            textColor: 'text-green-600'
        },
        {
            title: 'Ventas Mes',
            value: `$${(metrics?.ventas_mes ?? 0).toLocaleString()}`,
            icon: TrendingUp,
            color: 'bg-purple-500',
            textColor: 'text-purple-600'
        },
        {
            title: 'Stock Bajo',
            value: metrics?.stock_bajo_count ?? 0,
            icon: AlertTriangle,
            color: 'bg-yellow-500',
            textColor: 'text-yellow-600'
        },
        {
            title: 'Productos Activos',
            value: metrics?.total_productos ?? 0,
            icon: Package,
            color: 'bg-blue-500',
            textColor: 'text-blue-600'
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-outfit">Dashboard</h1>
                    <p className="text-gray-600 mt-1">Resumen general de rendimiento y estado de inventario.</p>
                </div>
                <div className="hidden md:block">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Activity className="w-3 h-3 mr-1" />
                        Actualizado en tiempo real
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="card hover:shadow-lg transition-all border-none bg-white/80 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            </div>
                            <div className={`${stat.color} p-3 rounded-2xl shadow-lg`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card border-none bg-white/80 backdrop-blur-md shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900">Productos Más Vendidos</h3>
                        <TrendingUp className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-4">
                        {metrics?.top_productos?.length > 0 ? (
                            metrics.top_productos.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{item.nombre}</p>
                                            <p className="text-sm text-gray-500">{item.cantidad} unidades vendidas</p>
                                        </div>
                                    </div>
                                    <span className="text-green-600 font-bold text-lg">${item.total.toLocaleString()}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-center py-8 text-gray-400 italic">No hay datos de ventas recientes</p>
                        )}
                    </div>
                </div>

                <div className="card border-none bg-white/80 backdrop-blur-md shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900">Alertas de Inventario</h3>
                        <AlertTriangle className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-4">
                        {metrics?.alertas_inventario?.length > 0 ? (
                            metrics.alertas_inventario.map((item, i) => (
                                <div key={i} className="flex items-center space-x-4 p-4 bg-yellow-50/50 border border-yellow-100 rounded-2xl">
                                    <div className="bg-yellow-100 p-2 rounded-lg">
                                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900">{item.nombre}</p>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-sm text-gray-600">Stock: {item.stock_actual} unidades</p>
                                            <span className="text-xs font-bold text-yellow-700 uppercase">Mínimo: {item.stock_minimo}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                            <div
                                                className="bg-yellow-500 h-1.5 rounded-full"
                                                style={{ width: `${Math.min((item.stock_actual / item.stock_minimo) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 text-green-600">
                                <Activity className="w-12 h-12 mb-2 opacity-20" />
                                <p className="italic">Todo en orden, no hay stock bajo</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
