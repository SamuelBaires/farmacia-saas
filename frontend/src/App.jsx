
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import LoginPage from './pages/Auth/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import POSPage from './pages/POS/POSPage';
import InventarioPage from './pages/Inventario/InventarioPage';
import ClientesPage from './pages/Clientes/ClientesPage';
import ProveedoresPage from './pages/Proveedores/ProveedoresPage';
import ReportesPage from './pages/Reportes/ReportesPage';
import ConfiguracionPage from './pages/Configuracion/ConfiguracionPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route
              path="pos"
              element={
                <ProtectedRoute allowedRoles={['ADMINISTRADOR', 'FARMACEUTICO', 'CAJERO']}>
                  <POSPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="inventario"
              element={
                <ProtectedRoute allowedRoles={['ADMINISTRADOR', 'FARMACEUTICO']}>
                  <InventarioPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="clientes"
              element={
                <ProtectedRoute allowedRoles={['ADMINISTRADOR', 'FARMACEUTICO']}>
                  <ClientesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="proveedores"
              element={
                <ProtectedRoute allowedRoles={['ADMINISTRADOR', 'FARMACEUTICO']}>
                  <ProveedoresPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="reportes"
              element={
                <ProtectedRoute allowedRoles={['ADMINISTRADOR', 'FARMACEUTICO']}>
                  <ReportesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="configuracion"
              element={
                <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
                  <ConfiguracionPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;
