import React, { useState, useEffect } from 'react';
import { medicamentosService, posService } from '../../services/api';
import toast from 'react-hot-toast';
import { Scan, Plus, Minus, Trash2, CreditCard } from 'lucide-react';

const POSPage = () => {
    const [carrito, setCarrito] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [medicamentos, setMedicamentos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);

    const subtotal = carrito.reduce((sum, item) => {
        const precio = Number(item.precio_venta) || 0;
        const cantidad = Number(item.cantidad) || 0;
        console.log(`Calculando: ${item.nombre_comercial} - Cantidad: ${cantidad} - Precio: ${precio}`);
        return sum + (precio * cantidad);
    }, 0);
    const total = subtotal;

    useEffect(() => {
        console.log('Estado del carrito actualizado:', carrito);
        console.log('Subtotal calculado:', subtotal);
    }, [carrito, subtotal]);

    useEffect(() => {
        cargarMedicamentos();
    }, []);

    const cargarMedicamentos = async () => {
        try {
            const data = await medicamentosService.getAll({ limit: 100 });
            setMedicamentos(data);
        } catch (error) {
            toast.error('Error al cargar medicamentos');
        }
    };

    const buscarPorCodigo = async (codigo) => {
        if (!codigo) return;

        setLoading(true);
        try {
            const medicamento = await medicamentosService.getByBarcode(codigo);
            agregarAlCarrito(medicamento);
            setBusqueda('');
        } catch (error) {
            toast.error('Medicamento no encontrado');
        } finally {
            setLoading(false);
        }
    };

    const agregarAlCarrito = (medicamento) => {
        const existente = carrito.find(item => item.id === medicamento.id);

        if (existente) {
            if (existente.cantidad >= medicamento.stock_actual) {
                toast.error('Stock insuficiente');
                return;
            }
            setCarrito(carrito.map(item =>
                item.id === medicamento.id
                    ? { ...item, cantidad: item.cantidad + 1 }
                    : item
            ));
        } else {
            if (medicamento.stock_actual < 1) {
                toast.error('Stock insuficiente');
                return;
            }
            setCarrito([...carrito, { ...medicamento, cantidad: 1 }]);
        }
    };

    const actualizarCantidad = (id, cantidad) => {
        if (cantidad < 1) {
            eliminarDelCarrito(id);
            return;
        }

        const medicamento = medicamentos.find(m => m.id === id);
        if (cantidad > medicamento?.stock_actual) {
            toast.error('Stock insuficiente');
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

        setProcessingPayment(true);
        try {
            const ventaData = {
                detalles: carrito.map(item => ({
                    medicamento_id: item.id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_venta,
                })),
                metodo_pago: 'EFECTIVO',
                descuento: 0,
            };

            await posService.crearVenta(ventaData);
            toast.success('¡Venta procesada exitosamente!');
            setCarrito([]);
            cargarMedicamentos(); // Refresh stock
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al procesar venta');
        } finally {
            setProcessingPayment(false);
        }
    };

    return (
        <div className="h-full flex gap-6">
            {/* Left Panel - Products */}
            <div className="flex-1 space-y-4">
                <div className="card">
                    <h2 className="text-2xl font-bold mb-4">Punto de Venta</h2>

                    <div className="flex gap-2 mb-4">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && buscarPorCodigo(busqueda)}
                                placeholder="Escanear código de barras o buscar..."
                                className="input-field pl-10"
                            />
                            <Scan className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        </div>
                        <button
                            onClick={() => buscarPorCodigo(busqueda)}
                            className="btn-primary"
                            disabled={loading}
                        >
                            Buscar
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                        {medicamentos.slice(0, 20).map((med) => (
                            <button
                                key={med.id}
                                onClick={() => agregarAlCarrito(med)}
                                className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
                            >
                                <p className="font-semibold text-sm">{med.nombre_comercial}</p>
                                <p className="text-xs text-gray-600">{med.nombre_generico}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-lg font-bold text-primary-600">
                                        ${med.precio_venta}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        Stock: {med.stock_actual}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Cart */}
            <div className="w-96 card flex flex-col">
                <h3 className="text-xl font-bold mb-4">Carrito de Venta</h3>

                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                    {carrito.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <p>Carrito vacío</p>
                            <p className="text-sm">Escanea o busca productos</p>
                        </div>
                    ) : (
                        carrito.map((item) => (
                            <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{item.nombre_comercial}</p>
                                        <p className="text-xs text-gray-600">${item.precio_venta} c/u</p>
                                    </div>
                                    <button
                                        onClick={() => eliminarDelCarrito(item.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                                            className="w-8 h-8 flex items-center justify-center bg-white border rounded hover:bg-gray-100"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-12 text-center font-semibold">{item.cantidad}</span>
                                        <button
                                            onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                                            className="w-8 h-8 flex items-center justify-center bg-white border rounded hover:bg-gray-100"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <span className="font-bold text-primary-600">
                                        ${(Number(item.precio_venta) * Number(item.cantidad)).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between text-lg">
                        <span className="font-semibold">Total parcial:</span>
                        <span className="font-bold">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-2xl">
                        <span className="font-bold">Total:</span>
                        <span className="font-bold text-primary-600">${total.toFixed(2)}</span>
                    </div>

                    <button
                        onClick={procesarVenta}
                        disabled={carrito.length === 0 || processingPayment}
                        className="w-full btn-primary py-4 text-lg flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                        <CreditCard className="w-6 h-6" />
                        <span>{processingPayment ? 'Procesando...' : 'Procesador Venta'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default POSPage;
