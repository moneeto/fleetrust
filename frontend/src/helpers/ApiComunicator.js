import Config from '../config.js';
import { apiErrorText } from './apiErrorText.mjs';

export const ApiComunicator = async (urlTail, method, info, signal, isADownload = false) => {
    
    const url = Config.endpoint + urlTail;
    const isFormData = typeof FormData !== 'undefined' && info instanceof FormData;

    const params = {
        credentials: "include",
        method: method,
        mode: 'cors',
        cache: 'no-store',
        headers: isFormData ? {} : {
            'Content-Type': 'application/json;charset=utf-8'
        }
    };

    if (info) {
        params.body = isFormData ? info : JSON.stringify(info);
    }

    if (signal) {
        params.signal = signal;
    }

    try {
        const response = await fetch(url, params);
        if (!response.ok) {

            if (response.status === 401) {
                document.cookie = "token=; Max-Age=0; path=/";
                window.location.replace("/login");
                return;
            }
            
            let errorBody = null;
            try { errorBody = await response.clone().json(); } catch { errorBody = null; }
            const body = errorBody && typeof errorBody === 'object' && !Array.isArray(errorBody) ? errorBody : {};
            const { sql, sqlMessage, sqlState, errno, ...safe } = body;
            throw { ...safe, message: apiErrorText(errorBody) };
        }
        
        if (isADownload) {
            return response; 
        } else {
            return response.json();
        }

    } catch (error) {
        let mensaje = "Error al comunicarse con el servidor "
        // console.error(mensaje, error);
        if (error instanceof Response) {
             throw { status: error.status, message: error.statusText || mensaje, ...error };
        }
    
        throw error;
    }
};