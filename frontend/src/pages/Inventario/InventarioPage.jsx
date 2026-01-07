import React, { useState, useEffect } from 'react';
import { medicamentosService } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, AlertTriangle, Package } from 'lucide-react';

const InventarioPage = () => {
    const [medicamentos, setMedicamentos] = useState([]);
    const [alertas, setAlertas] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [medicamentosData, alertasData] = await Promise.all([
                medicamentosService.getAll({ limit: 100 }),
                medicamentosService.getAlertasStockMinimo(),
            ]);
            setMedicamentos(medicamentosData);
            setAlertas(alertasData);
        } catch (error) {
            toast.error('Error al cargar inventario');
        } finally {
            setLoading(false);
        }
    };

    const medicamentosFiltrados = medicamentos.filter(med =>
        med.nombre_comercial.toLowerCase().includes(busqueda.toLowerCase()) ||
        med.nombre_generico?.toLowerCase().includes(busqueda.toLowerCase()) ||
        med.codigo_barras.includes(busqueda)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
                    <p className="text-gray-600 mt-1">Gestión de medicamentos y stock</p>
                </div>
                <button className="btn-primary flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Nuevo Medicamento</span>
                </button>
            </div>

            {/* Alertas */}
            {alertas.length > 0 && (
                <div className="card bg-yellow-50 border border-yellow-200">
                    <div className="flex items-center space-x-3 mb-3">
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                        <h3 className="text-lg font-semibold text-yellow-900">
                            Alertas de Stock Bajo ({alertas.length})
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {alertas.slice(0, 6).map((med) => (
                            <div key={med.id} className="p-3 bg-white rounded-lg border border-yellow-300">
                                <p className="font-semibold text-sm">{med.nombre_comercial}</p>
                                <p className="text-xs text-gray-600">
                                    Stock: {med.stock_actual} / Mínimo: {med.stock_minimo}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="card">
                <div className="relative">
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por nombre o código de barras..."
                        className="input-field pl-10"
                    />
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                </div>
            </div>

            {/* Inventory Table */}
            <div className="card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                    Medicamento
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                    Código
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                    Stock
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                    Precio Venta
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                    Vencimiento
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                    Estado
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {medicamentosFiltrados.map((med) => (
                                <tr key={med.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-semibold text-gray-900">{med.nombre_comercial}</p>
                                            <p className="text-sm text-gray-600">{med.nombre_generico}</p>
                                            {med.es_controlado && (
                                                <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded">
                                                    Controlado
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {med.codigo_barras}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center space-x-2">
                                            <Package className="w-4 h-4 text-gray-400" />
                                            <span className={`font-semibold ${med.stock_actual <= med.stock_minimo
                                                    ? 'text-red-600'
                                                    : 'text-gray-900'
                                                }`}>
                                                {med.stock_actual}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-primary-600">
                                        ${med.precio_venta}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {med.fecha_vencimiento
                                            ? new Date(med.fecha_vencimiento).toLocaleDateString('es-SV')
                                            : 'N/A'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs rounded-full ${med.activo
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {med.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InventarioPage;
