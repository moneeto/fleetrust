import { startRegistration, startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { ApiComunicator } from './ApiComunicator';

export const biometricSupported = browserSupportsWebAuthn;

export function biometricCancelled(err) {
    return err?.name === 'NotAllowedError' || err?.code === 'ERROR_CEREMONY_ABORTED';
}

export async function registerBiometric() {
    const optionsJSON = await ApiComunicator('/auth/biometricRegisterOptions', 'POST', {});
    const response = await startRegistration({ optionsJSON });
    return ApiComunicator('/auth/biometricRegister', 'POST', response);
}

export async function loginWithBiometric() {
    const optionsJSON = await ApiComunicator('/auth/biometricLoginOptions', 'POST', {});
    const response = await startAuthentication({ optionsJSON });
    return ApiComunicator('/auth/biometricLogin', 'POST', response);
}
