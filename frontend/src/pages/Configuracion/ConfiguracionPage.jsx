import React, { useState, useEffect } from 'react';
import {
    Settings, User, Shield, Monitor, FileText, Lock, Save,
    Plus, Edit2, Trash2, Check, X, Bell, Globe, DollarSign,
    Clock, Smartphone, Printer, CreditCard, Mail
} from 'lucide-react';
import { configuracionService, usuariosService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ConfiguracionPage = () => {
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState({
        general: { nombre_farmacia: '', direccion: '', telefono: '', email: '', moneda: 'USD', zona_horaria: 'America/El_Salvador' },
        parametros: { stock_minimo_defecto: 10, dias_alerta_vencimiento: 60, numeracion_comprobantes: '000001', impuestos_valor: 13.0 },
        pos: { lector_codigo_barras: true, tipo_impresora: 'Térmica 80mm', metodos_pago_habilitados: ['Efectivo'] },
        reportes: { reportes_activos: true, formato_preferido: 'pdf', correos_notificaciones: [] },
        seguridad: { tiempo_sesion: 60 }
    });
    const [usuarios, setUsuarios] = useState([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        nombre_completo: '',
        email: '',
        username: '',
        rol: 'CAJERO',
        password: ''
    });

    const isAdmin = currentUser?.rol === 'ADMINISTRADOR';
    const canViewUsers = ['ADMINISTRADOR', 'FARMACEUTICO'].includes(currentUser?.rol);

    useEffect(() => {
        fetchConfig();
        if (canViewUsers) {
            fetchUsuarios();
        }
    }, [currentUser]);

    useEffect(() => {
        if (editingUser) {
            setFormData({
                nombre_completo: editingUser.nombre_completo,
                email: editingUser.email || '',
                username: editingUser.username || '',
                rol: editingUser.rol,
                password: '' // Password intentionally blank on edit
            });
        } else {
            setFormData({
                nombre_completo: '',
                email: '',
                username: '',
                rol: 'CAJERO',
                password: ''
            });
        }
    }, [editingUser, showUserModal]);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const data = await configuracionService.getConfig();

            if (data) {
                setConfig(prev => ({
                    ...prev,
                    general: {
                        nombre_farmacia: data.nombre || '',
                        direccion: data.direccion || '',
                        telefono: data.telefono || '',
                        email: data.email || '',
                        moneda: 'USD',
                        zona_horaria: 'America/El_Salvador'
                    },
                    ...prev
                }));
            }
        } catch (error) {
            console.error("Error fetching config:", error);
            toast.error('Error al cargar configuración');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsuarios = async () => {
        try {
            const data = await usuariosService.getAll();
            if (Array.isArray(data)) setUsuarios(data);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error('Error al cargar usuarios');
        }
    };

    const handleSaveConfig = async () => {
        try {
            setLoading(true);
            const updates = {
                nombre: config.general.nombre_farmacia,
                direccion: config.general.direccion,
                telefono: config.general.telefono,
            };
            await configuracionService.updateConfig(updates);
            toast.success('Configuración guardada correctamente');
        } catch (error) {
            console.error("Error saving config:", error);
            toast.error('Error al guardar configuración');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (editingUser) {
                const changes = { ...formData };
                if (!changes.password) delete changes.password; // Don't send empty password
                
                await usuariosService.update(editingUser.id, changes);
                toast.success('Usuario actualizado');
            } else {
                await usuariosService.create(formData);
                toast.success('Usuario creado');
            }
            setShowUserModal(false);
            fetchUsuarios();
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar usuario');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (usuario) => {
        if (usuario.id === currentUser.id) {
            toast.error('No puedes desactivar tu propio usuario');
            return;
        }
        try {
            await usuariosService.toggleActivo(usuario.id, usuario.activo);
            toast.success(`Usuario ${usuario.activo ? 'desactivado' : 'activado'}`);
            fetchUsuarios();
        } catch (error) {
            console.error(error);
            toast.error('Error al cambiar estado');
        }
    };

    const tabs = [
        { id: 'general', name: 'General', icon: Globe },
        { id: 'usuarios', name: 'Usuarios', icon: User },
        { id: 'parametros', name: 'Parámetros', icon: Settings },
        { id: 'pos', name: 'Configuración POS', icon: Monitor },
        { id: 'reportes', name: 'Reportes y Alertas', icon: Bell },
        { id: 'seguridad', name: 'Seguridad', icon: Lock },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            {/* User Modal */}
            {showUserModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h3>
                            <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 bg-gray-50 border-gray-200 border rounded-xl"
                                    value={formData.nombre_completo}
                                    onChange={e => setFormData({...formData, nombre_completo: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Usuario (Login)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 bg-gray-50 border-gray-200 border rounded-xl"
                                        value={formData.username}
                                        onChange={e => setFormData({...formData, username: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Rol</label>
                                    <select
                                        className="w-full px-4 py-2 bg-gray-50 border-gray-200 border rounded-xl"
                                        value={formData.rol}
                                        onChange={e => setFormData({...formData, rol: e.target.value})}
                                    >
                                        <option value="CAJERO">Cajero</option>
                                        <option value="FARMACEUTICO">Farmacéutico</option>
                                        <option value="ADMINISTRADOR">Administrador</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2 bg-gray-50 border-gray-200 border rounded-xl"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    {editingUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
                                </label>
                                <input
                                    type="password"
                                    className="w-full px-4 py-2 bg-gray-50 border-gray-200 border rounded-xl"
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                    required={!editingUser}
                                    placeholder={editingUser ? 'Dejar en blanco para mantener actual' : ''}
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={loading} className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg">
                                    {loading ? 'Guardando...' : 'Guardar Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-outfit">Configuración del Sistema</h1>
                    <p className="text-gray-500">Gestiona los parámetros globales y usuarios de tu farmacia.</p>
                </div>
                <button
                    onClick={handleSaveConfig}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg hover:shadow-primary-600/20 active:scale-95 disabled:opacity-50"
                    disabled={loading}
                >
                    <Save className="w-5 h-5" />
                    Guardar Cambios
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Tabs */}
                <div className="w-full lg:w-64 space-y-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-primary-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`} />
                            {tab.name}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-8 min-h-[600px]">
                    {activeTab === 'general' && (
                        <div className="space-y-8">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Globe className="w-6 h-6 text-primary-600" />
                                Información de la Farmacia
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Nombre de la Farmacia</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 transition-all"
                                        value={config.general.nombre_farmacia}
                                        onChange={(e) => setConfig({ ...config, general: { ...config.general, nombre_farmacia: e.target.value } })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Email Corporativo</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 transition-all"
                                        value={config.general.email}
                                        onChange={(e) => setConfig({ ...config, general: { ...config.general, email: e.target.value } })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Teléfono</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 transition-all"
                                        value={config.general.telefono}
                                        onChange={(e) => setConfig({ ...config, general: { ...config.general, telefono: e.target.value } })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Moneda</label>
                                    <select
                                        className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 transition-all appearance-none"
                                        value={config.general.moneda}
                                        onChange={(e) => setConfig({ ...config, general: { ...config.general, moneda: e.target.value } })}
                                    >
                                        <option value="USD">Dólar Estadounidense ($)</option>
                                        <option value="EUR">Euro (€)</option>
                                    </select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-bold text-gray-700">Dirección Física</label>
                                    <textarea
                                        rows="3"
                                        className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 transition-all"
                                        value={config.general.direccion}
                                        onChange={(e) => setConfig({ ...config, general: { ...config.general, direccion: e.target.value } })}
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'usuarios' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <User className="w-6 h-6 text-primary-600" />
                                    Gestión de Usuarios
                                </h2>
                                {isAdmin && (
                                    <button
                                        onClick={() => { setEditingUser(null); setShowUserModal(true); }}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-xl font-bold hover:bg-primary-200 transition-all"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Nuevo Usuario
                                    </button>
                                )}
                            </div>

                            {!canViewUsers ? (
                                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100 text-gray-500">
                                    <Shield className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                                    <p className="font-bold">Acceso Restringido</p>
                                    <p className="text-sm">Solo el personal autorizado puede gestionar usuarios.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-100">
                                                <th className="text-left py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Nombre / Usuario</th>
                                                <th className="text-left py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Rol</th>
                                                <th className="text-left py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Estado</th>
                                                {isAdmin && <th className="text-right py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Acciones</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {usuarios.map((user) => (
                                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-4">
                                                        <div className="font-bold text-gray-900">{user.nombre_completo}</div>
                                                        <div className="text-sm text-gray-500">@{user.username}</div>
                                                    </td>
                                                    <td className="py-4 text-sm">
                                                        <span className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase ${user.rol === 'ADMINISTRADOR' ? 'bg-purple-100 text-purple-700' :
                                                            user.rol === 'FARMACEUTICO' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                                            }`}>
                                                            {user.rol}
                                                        </span>
                                                    </td>
                                                    <td className="py-4">
                                                        {user.activo ?
                                                            <span className="flex items-center gap-1 text-green-600 text-sm font-bold">
                                                                <Check className="w-4 h-4" /> Activo
                                                            </span> :
                                                            <span className="flex items-center gap-1 text-red-600 text-sm font-bold">
                                                                <X className="w-4 h-4" /> Inactivo
                                                            </span>
                                                        }
                                                    </td>
                                                    {isAdmin && (
                                                        <td className="py-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => { setEditingUser(user); setShowUserModal(true); }}
                                                                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                                    title="Editar"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleToggleStatus(user)}
                                                                    className={`p-2 rounded-lg transition-all ${user.activo 
                                                                        ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' 
                                                                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                                                                    title={user.activo ? "Desactivar" : "Activar"}
                                                                >
                                                                    {user.activo ? <Trash2 className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'parametros' && (
                        <div className="space-y-8">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Settings className="w-6 h-6 text-primary-600" />
                                Parámetros de Inventario
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-gray-50 p-6 rounded-2xl space-y-4 border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <Settings className="w-5 h-5 text-primary-600" />
                                        </div>
                                        <div className="font-bold text-gray-900">Existencias Mínimas</div>
                                    </div>
                                    <p className="text-sm text-gray-500">Stock base para disparar alertas de reposición.</p>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2.5 bg-white border-gray-200 border rounded-xl focus:ring-2 focus:ring-primary-500/20 transition-all font-bold"
                                        value={config.parametros.stock_minimo_defecto}
                                        onChange={(e) => setConfig({ ...config, parametros: { ...config.parametros, stock_minimo_defecto: parseInt(e.target.value) } })}
                                    />
                                </div>

                                <div className="bg-orange-50/50 p-6 rounded-2xl space-y-4 border border-orange-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm text-orange-600">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div className="font-bold text-gray-900">Alerta de Vencimiento</div>
                                    </div>
                                    <p className="text-sm text-gray-500">Días previos para notificar productos por expirar.</p>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2.5 bg-white border-gray-200 border rounded-xl focus:ring-2 focus:ring-primary-500/20 transition-all font-bold"
                                        value={config.parametros.dias_alerta_vencimiento}
                                        onChange={(e) => setConfig({ ...config, parametros: { ...config.parametros, dias_alerta_vencimiento: parseInt(e.target.value) } })}
                                    />
                                </div>

                                <div className="bg-blue-50/50 p-6 rounded-2xl space-y-4 border border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="font-bold text-gray-900">Próxima Factura</div>
                                    </div>
                                    <p className="text-sm text-gray-500">Correlativo inicial para nuevos comprobantes.</p>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-white border-gray-200 border rounded-xl focus:ring-2 focus:ring-primary-500/20 transition-all font-bold"
                                        value={config.parametros.numeracion_comprobantes}
                                        onChange={(e) => setConfig({ ...config, parametros: { ...config.parametros, numeracion_comprobantes: e.target.value } })}
                                    />
                                </div>

                                <div className="bg-green-50/50 p-6 rounded-2xl space-y-4 border border-green-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm text-green-600">
                                            <DollarSign className="w-5 h-5" />
                                        </div>
                                        <div className="font-bold text-gray-900">Tasa de Impuesto (IVA)</div>
                                    </div>
                                    <p className="text-sm text-gray-500">Porcentaje aplicado a productos gravados.</p>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-full px-4 py-2.5 bg-white border-gray-200 border rounded-xl focus:ring-2 focus:ring-primary-500/20 transition-all font-bold pr-10"
                                            value={config.parametros.impuestos_valor}
                                            onChange={(e) => setConfig({ ...config, parametros: { ...config.parametros, impuestos_valor: parseFloat(e.target.value) } })}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'pos' && (
                        <div className="space-y-8">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Monitor className="w-6 h-6 text-primary-600" />
                                Configuración del Punto de Venta
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="w-8 h-8 text-gray-400" />
                                        <div>
                                            <div className="font-bold text-gray-900">Lector de Barra</div>
                                            <div className="text-xs text-gray-500">Habilitar escaneo rápido</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setConfig({ ...config, pos: { ...config.pos, lector_codigo_barras: !config.pos.lector_codigo_barras } })}
                                        className={`w-12 h-6 rounded-full transition-all relative ${config.pos.lector_codigo_barras ? 'bg-primary-600' : 'bg-gray-300'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${config.pos.lector_codigo_barras ? 'right-1' : 'left-1'}`}></div>
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <Printer className="w-4 h-4" /> Impresora de Tickets
                                    </label>
                                    <select
                                        className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20"
                                        value={config.pos.tipo_impresora}
                                        onChange={(e) => setConfig({ ...config, pos: { ...config.pos, tipo_impresora: e.target.value } })}
                                    >
                                        <option>Térmica 80mm</option>
                                        <option>Térmica 58mm</option>
                                        <option>Inyección / Láser (A4)</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-100">
                                    <div className="font-bold text-gray-700 flex items-center gap-2">
                                        <CreditCard className="w-4 h-4" /> Métodos de Pago Habilitados
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {['Efectivo', 'Tarjeta', 'Transferencia', 'Bitcoin'].map(metodo => (
                                            <button
                                                key={metodo}
                                                onClick={() => {
                                                    const current = config.pos.metodos_pago_habilitados;
                                                    const updated = current.includes(metodo)
                                                        ? current.filter(m => m !== metodo)
                                                        : [...current, metodo];
                                                    setConfig({ ...config, pos: { ...config.pos, metodos_pago_habilitados: updated } });
                                                }}
                                                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${config.pos.metodos_pago_habilitados.includes(metodo)
                                                    ? 'bg-primary-50 border-primary-200 text-primary-700 shadow-sm'
                                                    : 'bg-white border-gray-200 text-gray-400'
                                                    }`}
                                            >
                                                {metodo}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'reportes' && (
                        <div className="space-y-8">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Bell className="w-6 h-6 text-primary-600" />
                                Reportes y Notificaciones
                            </h2>
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-bold text-gray-900">Activar Reportes Automáticos</div>
                                        <div className="text-sm text-gray-500">Enviar resúmenes diarios por correo.</div>
                                    </div>
                                    <button
                                        onClick={() => setConfig({ ...config, reportes: { ...config.reportes, reportes_activos: !config.reportes.reportes_activos } })}
                                        className={`w-12 h-6 rounded-full transition-all relative ${config.reportes.reportes_activos ? 'bg-primary-600' : 'bg-gray-300'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${config.reportes.reportes_activos ? 'right-1' : 'left-1'}`}></div>
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-gray-700">Formato Preferido</label>
                                    <div className="flex gap-4">
                                        {['pdf', 'excel'].map(formato => (
                                            <button
                                                key={formato}
                                                onClick={() => setConfig({ ...config, reportes: { ...config.reportes, formato_preferido: formato } })}
                                                className={`flex-1 py-3 rounded-xl border font-bold uppercase text-xs tracking-widest transition-all ${config.reportes.formato_preferido === formato
                                                    ? 'bg-white border-primary-500 text-primary-600 shadow-sm'
                                                    : 'bg-transparent border-gray-200 text-gray-400'
                                                    }`}
                                            >
                                                {formato}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Email de Notificaciones</label>
                                    <div className="flex gap-2 text-gray-400 text-xs italic">
                                        Único campo de texto para staging (separado por comas)
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-white border-gray-200 border rounded-xl focus:ring-2 focus:ring-primary-500/20"
                                        placeholder="admin@ejemplo.com, gerencia@ejemplo.com"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'seguridad' && (
                        <div className="space-y-8">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Lock className="w-6 h-6 text-primary-600" />
                                Seguridad del Sistema
                            </h2>
                            <div className="max-w-md space-y-6">
                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-700">Política de Sesión</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 font-bold"
                                                value={config.seguridad.tiempo_sesion}
                                                onChange={(e) => setConfig({ ...config, seguridad: { ...config.seguridad, tiempo_sesion: parseInt(e.target.value) } })}
                                            />
                                        </div>
                                        <div className="text-sm font-bold text-gray-500">Minutos de inactividad</div>
                                    </div>
                                </div>

                                <div className="p-6 bg-red-50 rounded-2xl border border-red-100 space-y-4">
                                    <h3 className="font-bold text-red-700 flex items-center gap-2">
                                        <Shield className="w-5 h-5" /> Zona de Seguridad
                                    </h3>
                                    <p className="text-sm text-red-600">Cambio de contraseña forzado para la cuenta maestra.</p>
                                    <button className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">
                                        Cambiar Contraseña Admin
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConfiguracionPage;
