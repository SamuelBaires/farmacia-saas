import React, { useState, useEffect } from 'react';
import { medicamentosService, posService, cajasService, configuracionService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { generateTicket } from '../../utils/ticketGenerator';
import toast from 'react-hot-toast';
import { Scan, Plus, Minus, Trash2, CreditCard, Search, AlertCircle, Printer, Lock, Unlock, LogOut } from 'lucide-react';

const POSPage = () => {
    const { user } = useAuth();
    const [carrito, setCarrito] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [medicamentos, setMedicamentos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    
    // New State for Caja and Config
    const [caja, setCaja] = useState(null);
    const [loadingCaja, setLoadingCaja] = useState(true);
    const [montoInicial, setMontoInicial] = useState('');
    const [montoCierre, setMontoCierre] = useState('');
    const [showCierreModal, setShowCierreModal] = useState(false);
    const [resumenCierre, setResumenCierre] = useState(null);
    const [farmaciaConfig, setFarmaciaConfig] = useState({});
    const [ultimaVenta, setUltimaVenta] = useState(null);

    // Security Check
    const canAccess = user && (user.rol === 'ADMINISTRADOR' || user.rol === 'CAJERO' || user.rol === 'FARMACEUTICO');

    const subtotal = carrito.reduce((sum, item) => {
        const precio = Number(item.precio_venta) || 0;
        const cantidad = Number(item.cantidad) || 0;
        return sum + (precio * cantidad);
    }, 0);
    const total = subtotal;

    useEffect(() => {
        if (user) {
            verificarCaja();
            cargarMedicamentos();
            cargarConfig();
        }
    }, [user]);

    const cargarConfig = async () => {
        try {
            const config = await configuracionService.getConfig();
            setFarmaciaConfig(config || {});
        } catch (error) {
            console.error('Error cargando config:', error);
        }
    };

    const verificarCaja = async () => {
        try {
            setLoadingCaja(true);
            const cajaAbierta = await cajasService.verificarEstado(user.id);
            setCaja(cajaAbierta);
        } catch (error) {
            console.error('Error verificando caja:', error);
        } finally {
            setLoadingCaja(false);
        }
    };

    const handleAbrirCaja = async (e) => {
        e.preventDefault();
        if (!montoInicial || isNaN(montoInicial)) {
            toast.error('Ingrese un monto inicial válido');
            return;
        }

        try {
            const nuevaCaja = await cajasService.abrirCaja({
                usuario_id: user.id,
                farmacia_id: user.farmacia_id || user.farmacia?.id, // Fallback if id is nested
                monto_inicial: parseFloat(montoInicial),
                fecha_apertura: new Date().toISOString(),
                estado: 'ABIERTA'
            });
            setCaja(nuevaCaja);
            toast.success('Caja abierta correctamente');
        } catch (error) {
            console.error(error);
            toast.error('Error al abrir la caja');
        }
    };

    const prepararCierreCaja = async () => {
        try {
            const totales = await cajasService.getTotalesCaja(caja.id);
            setResumenCierre({
                ...totales,
                saldo_inicial: Number(caja.monto_inicial),
                saldo_esperado: Number(caja.monto_inicial) + totales.efectivo // Assuming only cash affects drawer count directly for now
            });
            setShowCierreModal(true);
        } catch (error) {
            toast.error('Error calculando totales');
        }
    };

    const handleCerrarCaja = async () => {
        if (!montoCierre || isNaN(montoCierre)) {
            toast.error('Ingrese el monto contado en caja');
            return;
        }

        try {
            await cajasService.cerrarCaja(caja.id, {
                monto_final: parseFloat(montoCierre),
                monto_esperado: resumenCierre.saldo_esperado,
                diferencia: parseFloat(montoCierre) - resumenCierre.saldo_esperado
            });
            toast.success('Caja cerrada correctamente');
            setShowCierreModal(false);
            setCaja(null);
            setMontoInicial('');
            setMontoCierre('');
        } catch (error) {
            console.error(error);
            toast.error('Error al cerrar caja');
        }
    };


    const cargarMedicamentos = async () => {
        try {
            const data = await medicamentosService.getAll({ limit: 100 });
            setMedicamentos(data);
        } catch (error) {
            toast.error('Error al cargar medicamentos');
            console.error(error);
        }
    };

    const buscarPorCodigo = async (term) => {
        if (!term) return;

        setLoading(true);
        try {
            // First try exact match by barcode
            let medicamento = await medicamentosService.getByBarcode(term);

            // If not found, filters local list (since search API might not exist yet for name)
            if (!medicamento) {
                // Fallback: search in loaded items
                const found = medicamentos.find(m =>
                    m.codigo_barras === term ||
                    m.nombre_comercial.toLowerCase().includes(term.toLowerCase())
                );
                if (found) medicamento = found;
            }

            if (medicamento) {
                agregarAlCarrito(medicamento);
                setBusqueda('');
                if (medicamento.medicamento_controlado) {
                    toast((t) => (
                        <span className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                            <b>MEDICAMENTO CONTROLADO</b>
                            <span className="ml-1 text-sm">Verifique receta.</span>
                        </span>
                    ), { duration: 5000, style: { border: '1px solid #EF4444', background: '#FEF2F2' } });
                } else {
                    toast.success(`Agregado: ${medicamento.nombre_comercial}`);
                }
            } else {
                toast.error('Producto no encontrado');
            }
        } catch (error) {
            console.error(error);
            if (error?.code !== 'PGRST116') {
                toast.error('Producto no encontrado');
            }
        } finally {
            setLoading(false);
        }
    };

    const agregarAlCarrito = (medicamento) => {
        const existente = carrito.find(item => item.id === medicamento.id);
        const cantidadActual = existente ? existente.cantidad : 0;
        const cantidadNueva = cantidadActual + 1;

        if (cantidadNueva > medicamento.stock_actual) {
            toast.error(`Stock insuficiente. Disponible: ${medicamento.stock_actual}`);
            return;
        }

        if (existente) {
            setCarrito(carrito.map(item =>
                item.id === medicamento.id
                    ? { ...item, cantidad: cantidadNueva }
                    : item
            ));
        } else {
            setCarrito([...carrito, { ...medicamento, cantidad: 1 }]);
        }
    };

    const actualizarCantidad = (id, cantidad) => {
        if (cantidad < 1) {
            eliminarDelCarrito(id);
            return;
        }

        const medicamento = medicamentos.find(m => m.id === id);
        const itemEnCarrito = carrito.find(i => i.id === id);
        const stockMax = medicamento ? medicamento.stock_actual : (itemEnCarrito?.stock_actual || 1000);

        if (cantidad > stockMax) {
            toast.error(`Stock insuficiente. Solo hay ${stockMax}`);
            return;
        }

        setCarrito(carrito.map(item =>
            item.id === id ? { ...item, cantidad } : item
        ));
    };

    const eliminarDelCarrito = (id) => {
        setCarrito(carrito.filter(item => item.id !== id));
    };

    const procesarVenta = async () => {
        if (carrito.length === 0) {
            toast.error('El carrito está vacío');
            return;
        }

        if (!canAccess) {
            toast.error('No tiene permisos para procesar ventas');
            return;
        }
        
        if (!caja) {
            toast.error('Debe abrir la caja antes de vender');
            return;
        }

        // Validate Controlled Meds before Finalizing
        const controlados = carrito.filter(item => item.medicamento_controlado);
        if (controlados.length > 0) {
            if (!window.confirm("Esta venta contiene MEDICAMENTOS CONTROLADOS. ¿Ha verificado la receta médica y cumple con la normativa?")) {
                return;
            }
        }

        setProcessingPayment(true);
        try {
            const ventaData = {
                caja_id: caja.id,
                detalles: carrito.map(item => ({
                    medicamento_id: item.id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_venta,
                    subtotal: item.cantidad * item.precio_venta,
                    // Pass extra info for receipt generation locally if needed before refresh
                    nombre_producto: item.nombre_comercial 
                })),
                metodo_pago: 'EFECTIVO', // TODO: Add selector
                descuento: 0,
                subtotal: subtotal,
                total: total,
                cliente_id: null
            };

            const result = await posService.crearVenta(ventaData);
            
            // Generate ticket with complete info
            const ventaCompleta = {
                ...ventaData,
                numero_venta: result.numero_venta || 'PENDIENTE',
                fecha_venta: new Date(),
                usuario: user,
                detalles: ventaData.detalles.map(d => ({
                    ...d,
                    medicamento: { nombre_comercial: d.nombre_producto }
                }))
            };
            
            generateTicket(ventaCompleta, farmaciaConfig);
            setUltimaVenta(ventaCompleta);

            toast.success('¡Venta procesada exitosamente!');
            setCarrito([]);
            cargarMedicamentos();
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Error al procesar venta');
        } finally {
            setProcessingPayment(false);
        }
    };

    if (!user) return <div className="p-10 text-center">Cargando usuario...</div>;
    if (!canAccess) return (
        <div className="p-10 text-center text-red-500">
            <h2 className="text-2xl font-bold">Acceso Denegado</h2>
            <p>No tiene permisos para acceder al Punto de Venta.</p>
        </div>
    );
    
    // --- CAJA CERRADA SCREEN ---
    if (!loadingCaja && !caja) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-6 animate-in zoom-in-95 duration-300">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
                    <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-primary-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Apertura de Caja</h2>
                    <p className="text-gray-500 mb-8">Debe iniciar su turno de caja para comenzar a procesar ventas.</p>
                    
                    <form onSubmit={handleAbrirCaja} className="space-y-4">
                        <div className="text-left">
                            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Monto Inicial (Base)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-gray-400 font-bold">$</span>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-bold text-lg"
                                    placeholder="0.00"
                                    value={montoInicial}
                                    onChange={(e) => setMontoInicial(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="w-full btn-primary py-4 text-lg shadow-lg shadow-primary-500/30">
                            ABRIR CAJA
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex gap-6 relative">
            {/* CIERRE MODAL */}
            {showCierreModal && (
                <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <LogOut className="w-5 h-5 text-red-500" />
                                Cierre de Caja
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-blue-50 p-4 rounded-xl space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-blue-700">Saldo Inicial:</span>
                                    <span className="font-bold text-blue-900">${resumenCierre?.saldo_inicial.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-blue-700">Ventas Efectivo:</span>
                                    <span className="font-bold text-blue-900">+${resumenCierre?.efectivo.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-base pt-2 border-t border-blue-200">
                                    <span className="font-bold text-blue-800">Total Esperado:</span>
                                    <span className="font-bold text-blue-900">${resumenCierre?.saldo_esperado.toFixed(2)}</span>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Efectivo contado (Arqueo)</label>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    className="w-full p-3 border rounded-xl font-bold text-lg"
                                    placeholder="0.00"
                                    value={montoCierre}
                                    onChange={(e) => setMontoCierre(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            
                            {montoCierre && (
                                <div className={`text-sm text-center font-bold p-2 rounded-lg ${Number(montoCierre) - resumenCierre?.saldo_esperado === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    Diferencia: ${(Number(montoCierre) - resumenCierre?.saldo_esperado).toFixed(2)}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50">
                            <button onClick={() => setShowCierreModal(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-all">
                                Cancelar
                            </button>
                            <button onClick={handleCerrarCaja} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all">
                                Confirmar Cierre
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Left Panel - Products */}
            <div className="flex-1 space-y-4">
                <div className="card h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-2xl font-bold">Punto de Venta</h2>
                            <div className="flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit mt-1">
                                <Unlock className="w-3 h-3" />
                                CAJA ABIERTA
                            </div>
                        </div>
                        <div className="flex gap-2">
                             {ultimaVenta && (
                                <button 
                                    onClick={() => generateTicket(ultimaVenta, farmaciaConfig)}
                                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-all"
                                    title="Reimprimir último ticket"
                                >
                                    <Printer className="w-4 h-4" />
                                    <span className="hidden lg:inline">Reimprimir</span>
                                </button>
                             )}
                            <button 
                                onClick={prepararCierreCaja}
                                className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-sm font-bold transition-all"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden lg:inline">Cerrar Caja</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && buscarPorCodigo(busqueda)}
                                placeholder="Escanear código de barras o buscar por nombre..."
                                className="input-field pl-10"
                                autoFocus
                            />
                            <Scan className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        </div>
                        <button
                            onClick={() => buscarPorCodigo(busqueda)}
                            className="btn-primary"
                            disabled={loading || !busqueda}
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto p-1">
                        {medicamentos
                            .filter(m => !busqueda || m.nombre_comercial.toLowerCase().includes(busqueda.toLowerCase()) || m.codigo_barras === busqueda)
                            .slice(0, 50)
                            .map((med) => (
                                <button
                                    key={med.id}
                                    onClick={() => agregarAlCarrito(med)}
                                    disabled={med.stock_actual <= 0}
                                    className={`p-4 border rounded-lg text-left transition-all ${med.stock_actual > 0
                                        ? 'border-gray-200 hover:border-primary-500 hover:bg-primary-50 hover:shadow-md'
                                        : 'border-red-100 bg-red-50 opacity-60 cursor-not-allowed'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold text-sm truncate pr-2">{med.nombre_comercial}</p>
                                        {med.stock_actual <= 0 && <span className="text-xs font-bold text-red-600">SIN STOCK</span>}
                                    </div>
                                    <p className="text-xs text-gray-600 truncate">{med.nombre_generico}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-lg font-bold text-primary-600">
                                            ${med.precio_venta}
                                        </span>
                                        <span className={`text-xs font-medium ${med.stock_actual < 10 ? 'text-orange-500' : 'text-gray-500'}`}>
                                            Stock: {med.stock_actual}
                                        </span>
                                    </div>
                                    {med.medicamento_controlado && (
                                        <div className="mt-1 text-[10px] text-red-600 font-bold bg-red-50 inline-block px-1 rounded">
                                            CONTROLADO
                                        </div>
                                    )}
                                </button>
                            ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Cart */}
            <div className="w-96 card flex flex-col h-full">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-xl font-bold">Carrito</h3>
                    <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {carrito.length} items
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
                    {carrito.length === 0 ? (
                        <div className="text-center text-gray-500 py-10 flex flex-col items-center">
                            <CreditCard className="w-12 h-12 mb-2 opacity-20" />
                            <p>El carrito está vacío</p>
                            <p className="text-sm">Escanea o busca productos</p>
                        </div>
                    ) : (
                        carrito.map((item) => (
                            <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 animate-in fade-in slide-in-from-right-4 relative">
                                {item.medicamento_controlado && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" title="Medicamento Controlado"></span>
                                )}
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm text-gray-800">{item.nombre_comercial}</p>
                                        <p className="text-xs text-gray-500">${item.precio_venta} unitario</p>
                                    </div>
                                    <button onClick={() => eliminarDelCarrito(item.id)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between bg-white p-1 rounded border border-gray-100">
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => actualizarCantidad(item.id, item.cantidad - 1)} className="w-7 h-7 flex items-center justify-center bg-gray-50 border rounded hover:bg-gray-100 text-gray-600">
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="w-8 text-center font-bold text-gray-800">{item.cantidad}</span>
                                        <button onClick={() => actualizarCantidad(item.id, item.cantidad + 1)} className="w-7 h-7 flex items-center justify-center bg-gray-50 border rounded hover:bg-gray-100 text-gray-600">
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <span className="font-bold text-primary-700 mr-2">
                                        ${(Number(item.precio_venta) * Number(item.cantidad)).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="border-t pt-4 space-y-3 bg-white">
                    <div className="flex justify-between text-gray-600">
                        <span className="font-medium">Subtotal:</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-2xl border-t border-dashed pt-2">
                        <span className="font-bold text-gray-800">Total:</span>
                        <span className="font-bold text-primary-600">${total.toFixed(2)}</span>
                    </div>

                    <button
                        onClick={procesarVenta}
                        disabled={carrito.length === 0 || processingPayment}
                        className="w-full btn-primary py-4 text-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30 transition-all active:scale-[0.99]"
                    >
                        {processingPayment ? (
                            <span className="animate-pulse">Procesando...</span>
                        ) : (
                            <>
                                <CreditCard className="w-6 h-6" />
                                <span>COBRAR ${total.toFixed(2)}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default POSPage;
