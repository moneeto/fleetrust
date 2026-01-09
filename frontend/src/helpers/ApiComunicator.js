import Config from '../config.js';

export const ApiComunicator = async (urlTail, method, info, signal, isADownload = false) => {
    
    const url = Config.endpoint + urlTail;

    const params = {
        credentials: "include",
        method: method,
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        }
    };

    if (info) {
        params.body = JSON.stringify(info);
    }

    if (signal) {
        params.signal = signal;
    }

    try {
        const response = await fetch(url, params);
        if (!response.ok) {

            if (response.status === 401) {
                // window.location.reload(); 
                // throw new Error("No autorizado");
            }
            
            try {
                const errorBody = await response.clone().json(); 
                throw errorBody;
            } catch (e) {
                throw response; 
            }
        }
        
        if (isADownload) {
            return response; 
        } else {
            return response.json();
        }

    } catch (error) {
        let mensaje = "Error al comunicarse con el servidor "
        console.error(mensaje, error);
        if (error instanceof Response) {
             throw { status: error.status, message: error.statusText || mensaje };
        }
    
        throw error;
    }
};