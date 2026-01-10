import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Lock, User, ArrowRight, Shield, Activity, Package } from 'lucide-react';
import { supabase } from '../../services/supabaseClient'

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    const navigate = useNavigate();
    const { isAuthenticated, loading: authLoading } = useAuth(); // Obtener estado de auth

    // Redirigir si ya está autenticado
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, authLoading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Promesa de timeout para evitar hang eterno
            const loginPromise = async () => {
                const { data: { user }, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;

                // Obtener perfil para redirección
                const { data: profile, error: profileError } = await supabase
                    .from('usuarios')
                    .select('rol')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    console.warn("Error al buscar perfil:", profileError);
                }

                const role = profile?.rol;
                return role;
            };

            const racePromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Tiempo de espera agotado (10s)')), 10000);
            });

            const role = await Promise.race([loginPromise(), racePromise]);

            toast.success('¡Bienvenido al sistema!');

            // Redirect based on role
            if (role === 'ADMINISTRADOR') navigate('/');
            else if (role === 'FARMACEUTICO') navigate('/inventario');
            else if (role === 'CAJERO') navigate('/pos');
            else navigate('/');

        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error.message || 'Error desconocido';
            toast.error(`Error: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const features = [
        { icon: Package, text: 'Control de Inventario' },
        { icon: Activity, text: 'Punto de Venta' },
        { icon: Shield, text: 'Cumplimiento Normativo' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Left side - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary-800 to-primary-900 relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
                <div className="relative z-10 max-w-lg text-white space-y-8">
                    <div className="flex items-center space-x-3 text-white/90">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold tracking-tight">Farmacia SaaS</span>
                    </div>

                    <div>
                        <h2 className="text-4xl font-bold leading-tight mb-6">
                            Gestión Inteligente para su Farmacia
                        </h2>
                        <p className="text-lg text-blue-100 leading-relaxed font-light">
                            Simplifique su operación diaria, controle su inventario y cumpla con todas las normativas de El Salvador en una sola plataforma unificada.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-8">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-center space-x-3 text-blue-50">
                                <feature.icon className="w-5 h-5 opacity-80" />
                                <span className="text-sm font-medium">{feature.text}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-8 border-t border-white/10 text-sm text-blue-200 flex items-center space-x-2">
                        <Shield className="w-4 h-4" />
                        <span>Plataforma Segura & Cumplimiento Normativo ISO 27001</span>
                    </div>
                </div>
            </div>

            {/* Right side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile Branding */}
                    <div className="lg:hidden flex items-center justify-center mb-8">
                        <div className="flex items-center space-x-2 text-primary-700">
                            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold">Farmacia SaaS</span>
                        </div>
                    </div>

                    <div className="text-center lg:text-left space-y-2">
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Bienvenido de nuevo</h1>
                        <p className="text-gray-500">
                            Ingrese sus credenciales para acceder a su panel
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                        {/* Username Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 block">
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <User className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900 placeholder-gray-400"
                                    placeholder="usuario@farmacia.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 block">
                                    Contraseña
                                </label>
                                <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                                    ¿Olvidó su contraseña?
                                </a>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900 placeholder-gray-400"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Ingresar al Sistema</span>
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </>
                            )}
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
};

export default LoginPage;
