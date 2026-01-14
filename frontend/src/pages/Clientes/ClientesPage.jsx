import React, { useState, useEffect } from 'react';
import { clientesService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Search, User, Phone, Mail, MapPin, FileText, History, X } from 'lucide-react';

const ClientesPage = () => {
    const { user } = useAuth();
    const canEdit = user?.rol === 'ADMINISTRADOR';

    const [clientes, setClientes] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        nit_dui: '',
        telefono: '',
        email: '',
        direccion: ''
    });

    useEffect(() => {
        cargarClientes();
    }, []);

    const cargarClientes = async () => {
        setLoading(true);
        try {
            const data = await clientesService.getAll();
            setClientes(data);
        } catch (error) {
            toast.error('Error al cargar clientes');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (selectedCliente) {
                await clientesService.update(selectedCliente.id, formData);
                toast.success('Cliente actualizado');
            } else {
                await clientesService.create(formData);
                toast.success('Cliente registrado');
            }
            setShowModal(false);
            cargarClientes();
            resetForm();
        } catch (error) {
            toast.error('Error al guardar cliente');
        }
    };

    const handleEdit = (cliente) => {
        setSelectedCliente(cliente);
        setFormData({
            nombre: cliente.nombre,
            nit_dui: cliente.nit_dui || '',
            telefono: cliente.telefono || '',
            email: cliente.email || '',
            direccion: cliente.direccion || ''
        });
        setShowModal(true);
    };

    const [topProductos, setTopProductos] = useState([]);

    const handleViewHistory = async (cliente) => {
        setSelectedCliente(cliente);
        setShowHistoryModal(true);
        setLoadingHistory(true);
        try {
            const data = await clientesService.getHistorial(cliente.id);
            setHistorial(data);

            // Calculate Top Products
            const productStats = {};
            data.forEach(venta => {
                venta.detalles.forEach(detalle => {
                    const id = detalle.medicamento_id;
                    const name = detalle.medicamento?.nombre_comercial || 'Desconocido';
                    if (!productStats[id]) {
                        productStats[id] = { name, quantity: 0, totalSpent: 0 };
                    }
                    productStats[id].quantity += Number(detalle.cantidad);
                    productStats[id].totalSpent += Number(detalle.subtotal);
                });
            });

            const sortedProducts = Object.values(productStats)
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);
            
            setTopProductos(sortedProducts);

        } catch (error) {
            console.error(error);
            toast.error('Error al cargar historial');
        } finally {
            setLoadingHistory(false);
        }
    };

    const resetForm = () => {
        setSelectedCliente(null);
        setFormData({
            nombre: '',
            nit_dui: '',
            telefono: '',
            email: '',
            direccion: ''
        });
    };

    const clientesFiltrados = clientes.filter(c =>
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.nit_dui?.includes(busqueda) ||
        c.telefono?.includes(busqueda)
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
                    <p className="text-gray-600 mt-1">Gestión de cartera de clientes</p>
                </div>
                {canEdit && (
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Registrar Cliente</span>
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="card">
                <div className="relative">
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por nombre, NIT/DUI o teléfono..."
                        className="input-field pl-10"
                    />
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                </div>
            </div>

            {/* Clients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : clientesFiltrados.length === 0 ? (
                    <div className="col-span-full card text-center py-12 text-gray-500">
                        No se encontraron clientes
                    </div>
                ) : (
                    clientesFiltrados.map((cliente) => (
                        <div key={cliente.id} className="card hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{cliente.nombre}</h3>
                                        {cliente.nit_dui && (
                                            <p className="text-xs text-gray-500">NIT/DUI: {cliente.nit_dui}</p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleViewHistory(cliente)}
                                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                                    title="Ver Historial"
                                >
                                    <History className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                {cliente.telefono && (
                                    <div className="flex items-center space-x-2">
                                        <Phone className="w-4 h-4" />
                                        <span>{cliente.telefono}</span>
                                    </div>
                                )}
                                {cliente.email && (
                                    <div className="flex items-center space-x-2">
                                        <Mail className="w-4 h-4" />
                                        <span>{cliente.email}</span>
                                    </div>
                                )}
                                {cliente.direccion && (
                                    <div className="flex items-center space-x-2">
                                        <MapPin className="w-4 h-4 shrink-0" />
                                        <span className="truncate">{cliente.direccion}</span>
                                    </div>
                                )}
                            </div>

                            {canEdit && (
                                <button
                                    onClick={() => handleEdit(cliente)}
                                    className="w-full py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                                >
                                    Editar Datos
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Registration Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">
                                {selectedCliente ? 'Editar Cliente' : 'Registrar Cliente'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="label">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">NIT/DUI (Opcional)</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.nit_dui}
                                        onChange={(e) => setFormData({ ...formData, nit_dui: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">Teléfono</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.telefono}
                                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="label">Email</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="label">Dirección</label>
                                <textarea
                                    className="input-field min-h-[80px]"
                                    value={formData.direccion}
                                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 btn-primary"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full p-6 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-bold">Historial de Compras</h2>
                                <p className="text-sm text-gray-500">{selectedCliente?.nombre}</p>
                            </div>
                            <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loadingHistory ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                </div>
                            ) : historial.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    Este cliente no tiene compras registradas
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Top Products Section */}
                                    {topProductos.length > 0 && (
                                        <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
                                            <h3 className="text-sm font-bold text-primary-800 mb-3 flex items-center gap-2">
                                                <div className="bg-white p-1 rounded-md shadow-sm">🏆</div>
                                                Productos Favoritos
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {topProductos.map((prod, idx) => (
                                                    <div key={idx} className="bg-white p-2 rounded-lg text-xs border border-primary-100 flex justify-between items-center">
                                                        <span className="font-medium text-gray-700 truncate pr-2">{prod.name}</span>
                                                        <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-bold">{prod.quantity} un.</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <h3 className="text-sm font-bold text-gray-700 px-1">Historial de Facturas</h3>
                                    <div className="space-y-3">
                                        {historial.map((venta) => (
                                            <div key={venta.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors bg-white">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-bold text-gray-900">Venta #{venta.numero_venta}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(venta.fecha_venta).toLocaleString('es-SV')}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-primary-600">${Number(venta.total).toFixed(2)}</p>
                                                        <p className="text-xs text-gray-500 capitalize">{venta.metodo_pago.toLowerCase()}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-2 pt-2 border-t border-dashed text-xs text-gray-600">
                                                    {venta.detalles.length} productos adquiridos
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t">
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientesPage;
