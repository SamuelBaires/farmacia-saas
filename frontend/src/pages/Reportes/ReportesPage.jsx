import React, { useState } from 'react';
import {
    FileText, Download, TrendingUp, Package, AlertTriangle, ShieldCheck,
    Filter, Calendar, User, CreditCard, Tag, Bell, ChevronRight, Eye,
    Settings, Send, Clock, AlertCircle
} from 'lucide-react';
import { reportesService } from '../../services/api';
import toast from 'react-hot-toast';

const ReportesPage = () => {
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        fechaInicio: '',
        fechaFin: '',
        usuario: '',
        metodoPago: '',
        categoria: '',
        soloAlertas: false
    });

    const reportList = [
        {
            id: 'ventas',
            title: 'Reporte de Ventas',
            description: 'Resumen detallado de ingresos, transacciones y márgenes de ganancia.',
            icon: TrendingUp,
            metrics: { total: '$12,450.00', trend: '+12.5%', count: '145 ventas' },
            color: 'green',
            tags: ['Ventas', 'Finanzas']
        },
        {
            id: 'inventario',
            title: 'Reporte de Inventario',
            description: 'Control de existencias, valorización de stock y rotación de productos.',
            icon: Package,
            metrics: { total: '842 items', trend: 'Estable', count: '12 categorías' },
            color: 'blue',
            tags: ['Stock', 'Logística']
        },
        {
            id: 'vencimientos',
            title: 'Proximidad de Vencimiento',
            description: 'Monitoreo crítico de lotes próximos a expirar en los próximos 30-60-90 días.',
            icon: AlertTriangle,
            metrics: { total: '18 alertas', trend: 'Crítico', count: '5 urgentes' },
            color: 'orange',
            tags: ['Calidad', 'Mermas']
        },
        {
            id: 'controlados',
            title: 'Sustancias Controladas',
            description: 'Registro riguroso de medicamentos sujetos a fiscalización y recetas retenidas.',
            icon: ShieldCheck,
            metrics: { total: '45 recetas', trend: 'Auditado', count: '100% cumplido' },
            color: 'purple',
            tags: ['Legal', 'Seguridad']
        }
    ];

    const regulatoryReports = [
        {
            id: 'cssp',
            title: 'Informe CSSP (Libros)',
            description: 'Generación de libros oficiales para el Consejo Superior de Salud Pública.',
            icon: FileText,
            color: 'slate'
        },
        {
            id: 'dnm',
            title: 'Reporte DNM - Precios',
            description: 'Cumplimiento de precios máximos de venta al público según la DNM.',
            icon: ShieldCheck,
            color: 'slate'
        },
        {
            id: 'iva',
            title: 'Libro de Ventas Gravadas',
            description: 'Reporte fiscal de IVA para declaración mensual ante el Ministerio de Hacienda.',
            icon: TrendingUp,
            color: 'slate'
        }
    ];

    const handleDownload = async (tipo, formato) => {
        try {
            setLoading(true);
            toast.loading(`Preparando reporte ${formato.toUpperCase()}...`, { id: 'download' });
            await reportesService.descargarReporte(tipo, formato);
            toast.success(`Reporte generado con éxito`, { id: 'download' });
        } catch (error) {
            console.error('Error al descargar reporte:', error);
            toast.error('Error al generar el reporte', { id: 'download' });
        } finally {
            setLoading(false);
        }
    };

    const getColorClasses = (color) => {
        const colors = {
            green: 'bg-green-50 text-green-700 border-green-100 icon-green-600',
            blue: 'bg-blue-50 text-blue-700 border-blue-100 icon-blue-600',
            orange: 'bg-orange-50 text-orange-700 border-orange-100 icon-orange-600',
            purple: 'bg-purple-50 text-purple-700 border-purple-100 icon-purple-600',
            slate: 'bg-slate-50 text-slate-700 border-slate-100 icon-slate-600'
        };
        return colors[color] || colors.slate;
    };

    const getIconColor = (color) => {
        const colors = {
            green: 'text-green-600',
            blue: 'text-blue-600',
            orange: 'text-orange-600',
            purple: 'text-purple-600',
            slate: 'text-slate-600'
        };
        return colors[color] || 'text-slate-600';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section with refined title */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-outfit tracking-tight">Centro de Inteligencia</h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Informes analíticos y regulatorios de tu sucursal
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all text-sm font-medium shadow-sm">
                        <Download className="w-4 h-4" />
                        Exportar Todo
                    </button>
                </div>
            </div>

            {/* Global Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 px-1">
                    <Filter className="w-4 h-4 text-primary-600" />
                    Filtros Globales
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="date"
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 transition-all"
                            value={filters.fechaInicio}
                            onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
                        />
                    </div>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 appearance-none"
                            value={filters.usuario}
                            onChange={(e) => setFilters({ ...filters, usuario: e.target.value })}
                        >
                            <option value="">Usuario</option>
                            <option value="admin">Administrador</option>
                            <option value="caj-1">Cajero Central</option>
                        </select>
                    </div>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 appearance-none"
                            value={filters.metodoPago}
                            onChange={(e) => setFilters({ ...filters, metodoPago: e.target.value })}
                        >
                            <option value="">Met. Pago</option>
                            <option value="efectivo">Efectivo</option>
                            <option value="tarjeta">Tarjeta</option>
                            <option value="transfer">Transferencia</option>
                        </select>
                    </div>
                    <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 appearance-none"
                            value={filters.categoria}
                            onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}
                        >
                            <option value="">Categoría</option>
                            <option value="antibi">Antibióticos</option>
                            <option value="analge">Analgésicos</option>
                            <option value="contro">Controlados</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-xl border border-red-100 cursor-pointer hover:bg-red-100 transition-all lg:col-span-2 shadow-sm"
                        onClick={() => setFilters({ ...filters, soloAlertas: !filters.soloAlertas })}>
                        <div className={`w-4 h-4 rounded-full border-2 border-red-400 flex items-center justify-center transition-all ${filters.soloAlertas ? 'bg-red-500 border-red-600' : ''}`}>
                            {filters.soloAlertas && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">Alertas Críticas</span>
                        <Bell className="w-4 h-4 ml-auto" />
                    </div>
                </div>
            </div>

            {/* Main Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reportList.map((report) => (
                    <div key={report.id} className="group relative overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        {/* Decorative background element */}
                        <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full ${getColorClasses(report.color).split(' ')[0]} opacity-30 group-hover:scale-150 transition-transform duration-700`}></div>

                        <div className="p-6 relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-3.5 rounded-2xl ${getColorClasses(report.color)} shadow-sm`}>
                                    <report.icon className={`w-7 h-7 ${getIconColor(report.color)}`} />
                                </div>
                                <div className="flex gap-1.5">
                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all" title="Vista previa">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all" title="Configurar">
                                        <Settings className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all" title="Programar envío">
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-xl font-bold text-gray-900">{report.title}</h3>
                                    <div className="flex gap-1">
                                        {report.tags.map(tag => (
                                            <span key={tag} className="text-[10px] font-bold uppercase tracking-tighter bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-gray-500 text-sm leading-relaxed">{report.description}</p>
                            </div>

                            {/* Metrics section within Card */}
                            <div className="grid grid-cols-3 gap-2 py-4 border-y border-gray-50 mb-6">
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Acumulado</div>
                                    <div className="text-sm font-bold text-gray-900">{report.metrics.total}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Tendencia</div>
                                    <div className={`text-sm font-bold ${report.metrics.trend.includes('+') ? 'text-green-600' : report.metrics.trend.includes('Crítico') ? 'text-red-600' : 'text-blue-600'}`}>
                                        {report.metrics.trend}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Registros</div>
                                    <div className="text-sm font-bold text-gray-900">{report.metrics.count}</div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleDownload(report.id, 'pdf')}
                                    disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 active:scale-95 transition-all font-bold text-sm border border-red-100 shadow-sm"
                                >
                                    <FileText className="w-4 h-4" />
                                    <span>PDF</span>
                                </button>
                                <button
                                    onClick={() => handleDownload(report.id, 'excel')}
                                    disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 active:scale-95 transition-all font-bold text-sm border border-green-100 shadow-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>EXCEL</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Regulatory Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-1 bg-primary-600 rounded-full"></div>
                    <h2 className="text-xl font-bold text-gray-900">Reportes Regulatorios</h2>
                    <span className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-lg font-bold">El Salvador</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {regulatoryReports.map(report => (
                        <div key={report.id} className="group p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all cursor-pointer">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-white text-gray-400 group-hover:text-primary-600 transition-colors shadow-sm">
                                    <report.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-primary-700 transition-colors">{report.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{report.description}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-400 mt-1" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Custom Report Banner - Refined Professional Design */}
            <div className="relative group overflow-hidden mt-12 mb-8">
                {/* Main Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0c4a6e] via-[#075985] to-[#0c4a6e] rounded-[2.5rem] opacity-100 group-hover:scale-[1.005] transition-transform duration-700 shadow-2xl"></div>

                {/* Mesh Gradient / Abstract background blobs */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-400/15 rounded-full blur-[100px] -mr-48 -mt-48 animate-pulse duration-[10s]"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -ml-40 -mb-40"></div>

                {/* Glassmorphism Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] rounded-[2.5rem]"></div>

                <div className="relative z-10 px-6 py-10 md:px-14 md:py-16 flex flex-col md:flex-row items-center gap-10 lg:gap-20 border border-white/10 rounded-[2.5rem] backdrop-blur-[2px]">
                    <div className="flex-1 space-y-7 text-center md:text-left">
                        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"></div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-100">Consultoría Especializada</span>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-outfit text-white leading-[1.15] tracking-tight">
                                Visualiza tus datos <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-200 via-sky-300 to-primary-100 italic">a otro nivel</span>
                            </h2>

                            <p className="text-primary-100/70 text-base md:text-lg leading-relaxed max-w-xl font-medium">
                                ¿Necesitas un KPI específico o una integración personalizada? Transformamos la complejidad de tus datos en herramientas de decisión claras y accionables.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
                            <button className="group/btn relative px-8 py-4 bg-white text-primary-900 rounded-2xl font-bold hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:-translate-y-1 active:scale-95 transition-all text-base flex items-center justify-center gap-2">
                                Solicitar Reporte
                                <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                            <button className="px-8 py-4 bg-white/5 border border-white/20 text-white rounded-2xl font-bold hover:bg-white/10 hover:border-white/30 transition-all text-base flex items-center justify-center gap-2 backdrop-blur-sm">
                                <Eye className="w-5 h-5 text-primary-300" />
                                Ver Casos de Éxito
                            </button>
                        </div>
                    </div>

                    <div className="relative flex-shrink-0 hidden md:block">
                        <div className="relative z-10 p-12 rounded-[3.5rem] bg-gradient-to-tr from-white/10 to-transparent border border-white/20 shadow-[-20px_-20px_60px_rgba(255,255,255,0.05)] backdrop-blur-md">
                            <div className="absolute -top-6 -right-6 p-5 bg-gradient-to-br from-green-400 to-green-600 rounded-[2rem] shadow-[0_10px_30px_rgba(34,197,94,0.4)] animate-bounce duration-[4s]">
                                <TrendingUp className="w-8 h-8 text-white" />
                            </div>
                            <FileText className="w-32 h-32 lg:w-44 lg:h-44 text-white opacity-95 drop-shadow-[0_15px_15px_rgba(0,0,0,0.3)]" />
                        </div>
                        {/* Abstract rings */}
                        <div className="absolute inset-0 -m-6 border border-white/5 rounded-[4rem] scale-110 rotate-3"></div>
                        <div className="absolute inset-0 -m-12 border border-blue-400/5 rounded-[4.5rem] scale-125 -rotate-6"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportesPage;
