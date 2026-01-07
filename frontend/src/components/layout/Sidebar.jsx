import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    Truck,
    FileText,
    Settings,
    Pill
} from 'lucide-react';

const Sidebar = () => {
    const { user } = useAuth();

    const menuItems = [
        { path: '/', icon: LayoutDashboard, label: 'Panel', roles: ['ADMINISTRADOR', 'FARMACEUTICO', 'CAJERO'] },
        { path: '/pos', icon: ShoppingCart, label: 'Punto de Venta', roles: ['ADMINISTRADOR', 'FARMACEUTICO', 'CAJERO'] },
        { path: '/inventario', icon: Package, label: 'Inventario', roles: ['ADMINISTRADOR', 'FARMACEUTICO'] },
        { path: '/clientes', icon: Users, label: 'Clientes', roles: ['ADMINISTRADOR', 'FARMACEUTICO'] },
        { path: '/proveedores', icon: Truck, label: 'Proveedores', roles: ['ADMINISTRADOR', 'FARMACEUTICO'] },
        { path: '/reportes', icon: FileText, label: 'Informes', roles: ['ADMINISTRADOR', 'FARMACEUTICO'] },
        { path: '/configuracion', icon: Settings, label: 'Configuración', roles: ['ADMINISTRADOR'] },
    ];

    const filteredMenuItems = menuItems.filter(item =>
        item.roles.includes(user?.rol)
    );

    return (
        <div className="w-64 bg-white shadow-lg flex flex-col">
            <div className="p-6 border-b">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-medical-500 rounded-lg flex items-center justify-center">
                        <Pill className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Farmacia</h1>
                        <p className="text-xs text-gray-500">Sistema SaaS</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {filteredMenuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-primary-50 text-primary-700 font-medium'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t">
                <div className="text-xs text-gray-500">
                    <p className="font-medium">{user?.nombre_completo}</p>
                    <p className="capitalize">{user?.rol?.toLowerCase()}</p>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
