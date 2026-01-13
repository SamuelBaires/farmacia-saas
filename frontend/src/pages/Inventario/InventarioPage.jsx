import React, { useState, useEffect, useMemo } from 'react';
import { medicamentosService, proveedoresService } from '../../services/api';
import { useAuth } from '../../context/AuthContext'; // Integrate Auth
import toast from 'react-hot-toast';
import {
    Plus, Search, AlertTriangle, Package, Edit2, X, Save,
    Filter, ChevronLeft, ChevronRight, Calendar, AlertCircle, CheckCircle
} from 'lucide-react';

const FORMAS_FARMACEUTICAS = [
    'TABLETA', 'CAPSULA', 'JARABE', 'INYECTABLE', 'CREMA',
    'SUSPENSION', 'GOTA', 'SUPOSITORIO', 'POLVO', 'OTRO'
];

const ITEMS_PER_PAGE = 10;

const InventarioPage = () => {
    // Auth & Role Logic
    const { user } = useAuth();
    const isCajero = user?.rol === 'CAJERO';
    const canEdit = ['ADMINISTRADOR', 'FARMACEUTICO'].includes(user?.rol);

    // Data State
    const [medicamentos, setMedicamentos] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [alertas, setAlertas] = useState([]);
    const [laboratorios, setLaboratorios] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter/Search State
    const [busqueda, setBusqueda] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        forma_farmaceutica: '',
        laboratorio: '',
        vencimiento: 'todos',
        medicamento_controlado: false
    });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(initialFormState());

    function initialFormState() {
        return {
            // Sección 1 - Datos Generales
            nombre_comercial: '',
            nombre_generico: '',
            principio_activo: '',
            forma_farmaceutica: 'TABLETA',
            concentracion: '',
            codigo_barras: '',

            // Sección 2 - Fabricación
            laboratorio_fabricacion: '',
            lote: '',
            fecha_vencimiento: '',

            // Sección 3 - Inventario
            stock_actual: '',
            stock_minimo: 10,
            precio_compra: '',
            precio_venta: '',

            // Sección 4 - Regulación
            medicamento_controlado: false,
            requiere_receta: false,

            proveedor_id: '',
            activo: true
        };
    }

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [medicamentosData, alertasData, proveedoresData] = await Promise.all([
                medicamentosService.getAll({ limit: 1000 }),
                medicamentosService.getAlertasStockMinimo(),
                proveedoresService.getAll()
            ]);
            setMedicamentos(medicamentosData);
            setAlertas(alertasData);
            setProveedores(proveedoresData);

            const labs = [...new Set(medicamentosData.map(m => m.laboratorio_fabricacion).filter(Boolean))].sort();
            setLaboratorios(labs);

        } catch (error) {
            console.error(error);
            toast.error('Error al cargar inventario');
        } finally {
            setLoading(false);
        }
    };

    // --- FILTER LOGIC ---
    const filteredMedicamentos = useMemo(() => {
        return medicamentos.filter(med => {
            const searchText = busqueda.toLowerCase();
            const matchesSearch =
                med.nombre_comercial.toLowerCase().includes(searchText) ||
                med.nombre_generico?.toLowerCase().includes(searchText) ||
                med.principio_activo?.toLowerCase().includes(searchText) ||
                med.codigo_barras.includes(searchText);

            if (!matchesSearch) return false;

            if (filters.forma_farmaceutica && med.forma_farmaceutica !== filters.forma_farmaceutica) return false;
            if (filters.laboratorio && med.laboratorio_fabricacion !== filters.laboratorio) return false;
            if (filters.medicamento_controlado && !med.medicamento_controlado) return false;

            if (filters.vencimiento !== 'todos') {
                if (!med.fecha_vencimiento) return false;
                const today = new Date();
                const expDate = new Date(med.fecha_vencimiento);
                const diffTime = expDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (filters.vencimiento === 'vencido') {
                    if (diffDays > 0) return false;
                } else if (filters.vencimiento === 'proximo_30') {
                    if (diffDays < 0 || diffDays > 30) return false;
                } else if (filters.vencimiento === 'proximo_90') {
                    if (diffDays < 0 || diffDays > 90) return false;
                }
            }
            return true;
        });
    }, [medicamentos, busqueda, filters]);

    // --- PAGINATION LOGIC ---
    const totalPages = Math.ceil(filteredMedicamentos.length / ITEMS_PER_PAGE);
    const paginatedMedicamentos = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredMedicamentos.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredMedicamentos, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [busqueda, filters]);


    // --- CRUD HANDLERS ---
    const handleEdit = (med) => {
        if (!canEdit) return; // Guard logic
        setFormData({
            ...med,
            principio_activo: med.principio_activo || '',
            concentracion: med.concentracion || '',
            laboratorio_fabricacion: med.laboratorio_fabricacion || '',
            lote: med.lote || '',
            medicamento_controlado: med.medicamento_controlado || false,
            fecha_vencimiento: med.fecha_vencimiento ? med.fecha_vencimiento.split('T')[0] : ''
        });
        setEditingId(med.id);
        setShowModal(true);
    };

    const handleNew = () => {
        setFormData(initialFormState());
        setEditingId(null);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await medicamentosService.update(editingId, formData);
                toast.success('Medicamento actualizado');
            } else {
                await medicamentosService.create(formData);
                toast.success('Medicamento creado');
            }
            setShowModal(false);
            cargarDatos();
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar medicamento');
        }
    };

    // --- HELPER: STATUS BADGES ---
    const getStockStatus = (med) => {
        if (med.stock_actual === 0) return { label: 'Sin Stock', color: 'bg-red-100 text-red-800', icon: AlertCircle };
        if (med.stock_actual <= med.stock_minimo) return { label: 'Bajo', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
        return { label: 'Normal', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    };

    const getExpirationStatus = (dateStr) => {
        if (!dateStr) return null;
        const today = new Date();
        const expDate = new Date(dateStr);
        const diffTime = expDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: 'Vencido', color: 'text-red-600 font-bold' };
        if (diffDays <= 90) return { label: 'Por Vencer', color: 'text-orange-600 font-medium' };
        return { label: 'Vigente', color: 'text-gray-600' };
    };


    if (loading) return <div className="p-8 text-center animate-pulse">Cargando inventario...</div>;

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
                    <p className="text-gray-600 mt-1">Gestión clínica y operativa</p>
                </div>
                {/* Security Check: Only show Add button if authorized */}
                {canEdit && (
                    <button onClick={handleNew} className="btn-primary flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all">
                        <Plus className="w-5 h-5" />
                        <span>Nuevo Producto</span>
                    </button>
                )}
            </div>

            {/* Alert Banner */}
            {alertas.length > 0 && (
                <div className="card bg-orange-50 border border-orange-200 p-4 flex items-start space-x-3">
                    <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0" />
                    <div>
                        <h3 className="text-lg font-semibold text-orange-900">Atención Requerida</h3>
                        <p className="text-orange-800 text-sm">
                            Hay {alertas.length} productos con stock bajo o crítico.
                        </p>
                    </div>
                </div>
            )}

            {/* Controls Section */}
            <div className="card p-4 space-y-4">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar por código, nombre, activo..."
                            className="input-field pl-10 w-full"
                        />
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-2 border rounded-lg flex items-center space-x-2 transition-colors ${showFilters ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white hover:bg-gray-50'}`}
                    >
                        <Filter className="w-5 h-5" />
                        <span>Filtros</span>
                        {(filters.forma_farmaceutica || filters.laboratorio || filters.vencimiento !== 'todos' || filters.medicamento_controlado) && (
                            <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                        )}
                    </button>
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t animate-in fade-in slide-in-from-top-2">
                        {/* Filters UI (Same as before) */}
                        <div>
                            <label className="label text-xs">Forma Farmacéutica</label>
                            <select
                                className="input-field w-full text-sm"
                                value={filters.forma_farmaceutica}
                                onChange={e => setFilters({ ...filters, forma_farmaceutica: e.target.value })}
                            >
                                <option value="">Todas</option>
                                {FORMAS_FARMACEUTICAS.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label text-xs">Laboratorio</label>
                            <select
                                className="input-field w-full text-sm"
                                value={filters.laboratorio}
                                onChange={e => setFilters({ ...filters, laboratorio: e.target.value })}
                            >
                                <option value="">Todos</option>
                                {laboratorios.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label text-xs">Vencimiento</label>
                            <select
                                className="input-field w-full text-sm"
                                value={filters.vencimiento}
                                onChange={e => setFilters({ ...filters, vencimiento: e.target.value })}
                            >
                                <option value="todos">Todos</option>
                                <option value="proximo_90">Próximos 90 días</option>
                                <option value="proximo_30">Próximos 30 días</option>
                                <option value="vencido">Vencidos</option>
                            </select>
                        </div>
                        <div className="flex items-end pb-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-primary-600 rounded"
                                    checked={filters.medicamento_controlado}
                                    onChange={e => setFilters({ ...filters, medicamento_controlado: e.target.checked })}
                                />
                                <span className="text-sm font-medium text-gray-700">Solo Controlados</span>
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="card overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Detalles Clínicos</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vencimiento</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {paginatedMedicamentos.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                                        No se encontraron medicamentos con los filtros actuales.
                                    </td>
                                </tr>
                            ) : (
                                paginatedMedicamentos.map((med) => {
                                    const stockStatus = getStockStatus(med);
                                    const expStatus = getExpirationStatus(med.fecha_vencimiento);

                                    return (
                                        <tr key={med.id} className="hover:bg-gray-50 transition-colors group">
                                            {/* (Table Rows content same as before) */}
                                            <td className="px-4 py-3">
                                                <div>
                                                    <div className="font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
                                                        {med.nombre_comercial}
                                                    </div>
                                                    <p className="text-sm text-gray-500">{med.nombre_generico}</p>
                                                    <span className="text-xs text-gray-400 font-mono">{med.codigo_barras}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="space-y-1">
                                                    {med.principio_activo && <p className="text-gray-700"><span className="text-gray-400">PA:</span> {med.principio_activo}</p>}
                                                    {med.concentracion && <p className="text-gray-700"><span className="text-gray-400">Conc:</span> {med.concentracion}</p>}
                                                    <div className="flex gap-1 mt-1">
                                                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                                            {med.forma_farmaceutica}
                                                        </span>
                                                        {med.medicamento_controlado && (
                                                            <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-bold">
                                                                CONTROLADO
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${stockStatus.color}`}>
                                                        {stockStatus.label}: {med.stock_actual}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1 pl-1">Min: {med.stock_minimo}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {med.fecha_vencimiento ? (
                                                    <div>
                                                        <div className="flex items-center space-x-1 text-gray-700">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>{new Date(med.fecha_vencimiento).toLocaleDateString()}</span>
                                                        </div>
                                                        {expStatus && expStatus.label !== 'Vigente' && (
                                                            <span className={`text-xs ${expStatus.color} block mt-0.5`}>
                                                                {expStatus.label}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-gray-900">
                                                ${med.precio_venta}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {canEdit && (
                                                    <button onClick={() => handleEdit(med)} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination (Same as before) */
                    filteredMedicamentos.length > 0 && (
                        <div className="bg-gray-50 border-t p-3 flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Mostrando <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> a <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredMedicamentos.length)}</span> de <span className="font-medium">{filteredMedicamentos.length}</span>
                            </p>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="flex items-center px-4 bg-white border rounded text-sm font-medium">
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
            </div>

            {/* MODAL FORM (Restructured into 4 sections) */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="flex justify-between items-center mb-6 border-b pb-4">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {editingId ? 'Editar Medicamento' : 'Nuevo Medicamento'}
                                </h2>
                                <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* SECTION 1: Datos Generales */}
                                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                    <h3 className="font-semibold text-primary-800 border-b border-gray-200 pb-2 mb-2 flex items-center">
                                        <span className="bg-primary-100 text-primary-700 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">1</span>
                                        Datos Generales
                                    </h3>
                                    <div>
                                        <label className="label">Nombre Comercial *</label>
                                        <input required className="input-field w-full" value={formData.nombre_comercial} onChange={e => setFormData({ ...formData, nombre_comercial: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="label">Nombre Genérico</label>
                                        <input className="input-field w-full" value={formData.nombre_generico} onChange={e => setFormData({ ...formData, nombre_generico: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="label">Principio Activo</label>
                                            <input className="input-field w-full" value={formData.principio_activo} onChange={e => setFormData({ ...formData, principio_activo: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Concentración</label>
                                            <input className="input-field w-full" value={formData.concentracion} onChange={e => setFormData({ ...formData, concentracion: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="label">Forma Farm.</label>
                                            <select className="input-field w-full" value={formData.forma_farmaceutica} onChange={e => setFormData({ ...formData, forma_farmaceutica: e.target.value })}>
                                                {FORMAS_FARMACEUTICAS.map(f => <option key={f} value={f}>{f}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">Código Barras *</label>
                                            <input required className="input-field w-full" value={formData.codigo_barras} onChange={e => setFormData({ ...formData, codigo_barras: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 2: Fabricación */}
                                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                    <h3 className="font-semibold text-primary-800 border-b border-gray-200 pb-2 mb-2 flex items-center">
                                        <span className="bg-primary-100 text-primary-700 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                                        Fabricación
                                    </h3>
                                    <div>
                                        <label className="label">Laboratorio</label>
                                        <input className="input-field w-full" value={formData.laboratorio_fabricacion} onChange={e => setFormData({ ...formData, laboratorio_fabricacion: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="label">Lote</label>
                                            <input className="input-field w-full" value={formData.lote} onChange={e => setFormData({ ...formData, lote: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Vencimiento</label>
                                            <input type="date" className="input-field w-full" value={formData.fecha_vencimiento} onChange={e => setFormData({ ...formData, fecha_vencimiento: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 3: Inventario */}
                                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                    <h3 className="font-semibold text-primary-800 border-b border-gray-200 pb-2 mb-2 flex items-center">
                                        <span className="bg-primary-100 text-primary-700 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">3</span>
                                        Inventario
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="label">Stock Actual *</label>
                                            <input type="number" required className="input-field w-full font-mono font-bold" value={formData.stock_actual} onChange={e => setFormData({ ...formData, stock_actual: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Stock Mínimo</label>
                                            <input type="number" className="input-field w-full" value={formData.stock_minimo} onChange={e => setFormData({ ...formData, stock_minimo: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="label">Costo ($)</label>
                                            <input type="number" step="0.01" className="input-field w-full" value={formData.precio_compra} onChange={e => setFormData({ ...formData, precio_compra: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Precio Venta ($) *</label>
                                            <input type="number" step="0.01" required className="input-field w-full font-bold text-green-700" value={formData.precio_venta} onChange={e => setFormData({ ...formData, precio_venta: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 4: Regulación */}
                                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                    <h3 className="font-semibold text-primary-800 border-b border-gray-200 pb-2 mb-2 flex items-center">
                                        <span className="bg-primary-100 text-primary-700 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">4</span>
                                        Regulación
                                    </h3>
                                    <div className="space-y-3">
                                        <label className="flex items-center p-3 border rounded-lg cursor-pointer bg-white hover:bg-gray-50">
                                            <input type="checkbox" className="w-5 h-5 text-primary-600 rounded" checked={formData.requiere_receta} onChange={e => setFormData({ ...formData, requiere_receta: e.target.checked })} />
                                            <span className="ml-3 text-sm font-medium text-gray-700">Requiere Receta Médica</span>
                                        </label>
                                        <label className="flex items-center p-3 border border-red-200 rounded-lg cursor-pointer bg-red-50 hover:bg-red-100">
                                            <input type="checkbox" className="w-5 h-5 text-red-600 rounded" checked={formData.medicamento_controlado} onChange={e => setFormData({ ...formData, medicamento_controlado: e.target.checked })} />
                                            <div className="ml-3">
                                                <span className="block text-sm font-bold text-red-700">Medicamento Controlado</span>
                                                <span className="block text-xs text-red-500">Requiere validación especial en venta</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end space-x-3 border-t pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 btn-primary flex items-center space-x-2"
                                >
                                    <Save className="w-5 h-5" />
                                    <span>{editingId ? 'Actualizar' : 'Guardar'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventarioPage;
