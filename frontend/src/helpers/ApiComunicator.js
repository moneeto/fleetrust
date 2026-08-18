import Config from '../config.js';

export const ApiComunicator = async (urlTail, method, info, signal, isADownload = false) => {
    
    const url = Config.endpoint + urlTail;
    const isFormData = typeof FormData !== 'undefined' && info instanceof FormData;

    const params = {
        credentials: "include",
        method: method,
        mode: 'cors',
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
            
            try {
                const errorBody = await response.clone().json(); 
                throw errorBody;
            } catch (e) {
                throw e; 
            }
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