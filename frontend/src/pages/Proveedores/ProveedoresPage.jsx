import React, { useState, useEffect } from 'react';
import { proveedoresService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Search, Truck, Phone, Mail, MapPin, Package, FileText, X, AlertCircle } from 'lucide-react';

const ProveedoresPage = () => {
    const { user } = useAuth();
    const canEdit = user?.rol === 'ADMINISTRADOR';

    const [proveedores, setProveedores] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showEntriesModal, setShowEntriesModal] = useState(false);
    const [selectedProveedor, setSelectedProveedor] = useState(null);
    const [entradas, setEntradas] = useState([]);
    const [loadingEntries, setLoadingEntries] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        nit: '',
        direccion: '',
        telefono: '',
        email: '',
        contacto: ''
    });

    useEffect(() => {
        cargarProveedores();
    }, []);

    const cargarProveedores = async () => {
        setLoading(true);
        try {
            const data = await proveedoresService.getAll();
            setProveedores(data);
        } catch (error) {
            toast.error('Error al cargar proveedores');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (selectedProveedor) {
                await proveedoresService.update(selectedProveedor.id, formData);
                toast.success('Proveedor actualizado');
            } else {
                await proveedoresService.create(formData);
                toast.success('Proveedor registrado');
            }
            setShowModal(false);
            cargarProveedores();
            resetForm();
        } catch (error) {
            toast.error('Error al guardar proveedor');
        }
    };

    const handleEdit = (proveedor) => {
        setSelectedProveedor(proveedor);
        setFormData({
            nombre: proveedor.nombre,
            nit: proveedor.nit || '',
            direccion: proveedor.direccion || '',
            telefono: proveedor.telefono || '',
            email: proveedor.email || '',
            contacto: proveedor.contacto || ''
        });
        setShowModal(true);
    };

    const handleViewEntries = async (proveedor) => {
        setSelectedProveedor(proveedor);
        setShowEntriesModal(true);
        setLoadingEntries(true);
        try {
            const data = await proveedoresService.getEntradas(proveedor.id);
            setEntradas(data);
        } catch (error) {
            toast.error('Error al cargar entradas de inventario');
        } finally {
            setLoadingEntries(false);
        }
    };

    const resetForm = () => {
        setSelectedProveedor(null);
        setFormData({
            nombre: '',
            nit: '',
            direccion: '',
            telefono: '',
            email: '',
            contacto: ''
        });
    };

    const proveedoresFiltrados = proveedores.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.nit?.includes(busqueda) ||
        p.contacto?.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Proveedores</h1>
                    <p className="text-gray-600 mt-1">Gestión de proveedores y abastecimiento</p>
                </div>
                {canEdit && (
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Añadir Proveedor</span>
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
                        placeholder="Buscar por nombre, NIT o contacto..."
                        className="input-field pl-10"
                    />
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                </div>
            </div>

            {/* Providers Table */}
            <div className="card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Proveedor</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">NIT / Contacto</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Comunicación</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : proveedoresFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                        No se encontraron proveedores
                                    </td>
                                </tr>
                            ) : (
                                proveedoresFiltrados.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                                    <Truck className="w-5 h-5" />
                                                </div>
                                                <span className="font-semibold text-gray-900">{p.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <p className="text-gray-900">{p.nit || 'Sin NIT'}</p>
                                                <p className="text-gray-500 text-xs">{p.contacto || 'Sin contacto directo'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm space-y-1">
                                                {p.telefono && (
                                                    <div className="flex items-center space-x-1 text-gray-600">
                                                        <Phone className="w-3 h-3" />
                                                        <span>{p.telefono}</span>
                                                    </div>
                                                )}
                                                {p.email && (
                                                    <div className="flex items-center space-x-1 text-gray-600">
                                                        <Mail className="w-3 h-3" />
                                                        <span className="truncate max-w-[150px]">{p.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center space-x-2">
                                                <button
                                                    onClick={() => handleViewEntries(p)}
                                                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                    title="Entradas de Inventario"
                                                >
                                                    <Package className="w-5 h-5" />
                                                </button>
                                                {canEdit && (
                                                    <button
                                                        onClick={() => handleEdit(p)}
                                                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <FileText className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Registro */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">
                                {selectedProveedor ? 'Editar Proveedor' : 'Registrar Proveedor'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="label">Nombre o Razón Social</label>
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
                                    <label className="label">NIT / NRC</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.nit}
                                        onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">Persona de Contacto</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.contacto}
                                        onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Teléfono</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.telefono}
                                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                    />
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
                            </div>
                            <div>
                                <label className="label">Dirección Fiscal / Oficina</label>
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

            {/* Modal de Entradas de Inventario */}
            {showEntriesModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-3xl w-full p-6 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-bold">Control de Entradas</h2>
                                <p className="text-sm text-gray-500">Proveedor: {selectedProveedor?.nombre}</p>
                            </div>
                            <button onClick={() => setShowEntriesModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loadingEntries ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                </div>
                            ) : entradas.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p>No se registran entradas de inventario para este proveedor</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Medicamento</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Cantidad</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Precio Unit.</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {entradas.map((entrada) => (
                                                <tr key={entrada.id} className="text-sm">
                                                    <td className="px-4 py-3 text-gray-600">
                                                        {new Date(entrada.fecha_movimiento).toLocaleDateString('es-SV')}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-gray-900">
                                                        {entrada.medicamento?.nombre_comercial}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-green-600 font-bold">
                                                        +{entrada.cantidad}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-gray-600">
                                                        ${entrada.precio_unitario ? Number(entrada.precio_unitario).toFixed(2) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t">
                            <button
                                onClick={() => setShowEntriesModal(false)}
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

export default ProveedoresPage;
