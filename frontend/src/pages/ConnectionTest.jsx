import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const ConnectionTest = () => {
    const [logs, setLogs] = useState([]);

    const addLog = (msg) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const runTests = async () => {
        setLogs([]);
        addLog("Iniciando pruebas de conectividad...");

        // 1. Test Environment Variables
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        addLog(`URL Configurada: ${url ? 'SI (' + url.substring(0, 15) + '...)' : 'NO'}`);
        addLog(`Key Configurada: ${key ? 'SI' : 'NO'}`);

        // 2. Test Raw Fetch (Network Check)
        try {
            addLog("Intentando Ping HTTP a Supabase...");
            const res = await fetch(`${url}/auth/v1/health`);
            addLog(`Ping Status: ${res.status} ${res.statusText}`);
        } catch (e) {
            addLog(`ERROR PING: ${e.message}`);
        }

        // 3. Test SDK Select (DB Check)
        try {
            addLog("Probando lectura de DB (SDK)...");
            const { count, error } = await supabase.from('farmacias').select('*', { count: 'exact', head: true });
            if (error) throw error;
            addLog(`Lectura DB exitosa. Count: ${count}`);
        } catch (e) {
            addLog(`ERROR DB: ${e.message} - ${e.details || ''}`);
        }

        // 4. Test Auth (Session Check)
        try {
            addLog("Probando Auth.getSession()...");
            // Timeout de 5s para auth
            const authPromise = supabase.auth.getSession();
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000));

            const { data } = await Promise.race([authPromise, timeoutPromise]);
            addLog(`Auth Session: ${data?.session ? 'Activa' : 'Ninguna'}`);
        } catch (e) {
            addLog(`ERROR AUTH: ${e.message}`);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto bg-white shadow-xl rounded-xl mt-10">
            <h1 className="text-2xl font-bold mb-4">Diagnóstico de Conexión</h1>
            <button
                onClick={runTests}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold"
            >
                Ejecutar Pruebas
            </button>
            <button
                onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                }}
                className="ml-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
                Borrar Datos Locales y Recargar
            </button>

            <div className="mt-6 bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
                {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
        </div>
    );
};

export default ConnectionTest;
