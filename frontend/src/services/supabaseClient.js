import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = 'Error Crítico: Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Revise su archivo .env';
    console.error(errorMsg);
    // Inyectar mensaje en el DOM para que sea visible en pantalla blanca
    // Usamos setTimeout para asegurar que corra incluso si React falla
    setTimeout(() => {
        if (typeof document !== 'undefined') {
            document.body.innerHTML = `
                <div style="padding: 20px; color: white; background: red; font-family: sans-serif; height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center;">
                    <div>
                        <h1>Error de Configuración</h1>
                        <p>${errorMsg}</p>
                        <p>Asegúrese de tener un archivo <code>.env</code> en <code>frontend/</code> con las credenciales.</p>
                    </div>
                </div>
            `;
        }
    }, 100);
    throw new Error(errorMsg);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
