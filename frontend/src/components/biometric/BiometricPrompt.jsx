"use client";

import { useEffect, useState } from "react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { biometricCancelled, biometricSupported, registerBiometric } from "@/helpers/biometric";
import MessageModal from "@/components/ui/MessageModal";

export default function BiometricPrompt() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        ApiComunicator("/auth/biometricStatus", "GET")
            .then((status) => setOpen(Number(status.askBiometric) === 1 && Number(status.passkeys) === 0 && biometricSupported()))
            .catch(() => setOpen(false));
    }, []);

    async function run(action) {
        setError("");
        setLoading(true);
        try {
            await action();
            setOpen(false);
        } catch (err) {
            if (!biometricCancelled(err)) setError(err.message || "Could not complete the request.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <MessageModal
            isOpen={open}
            type="info"
            title="Biometric login"
            confirmLabel="Enable"
            cancelLabel="Skip"
            confirmColor="primary"
            disabled={loading}
            onConfirm={() => run(registerBiometric)}
            onClose={() => run(() => ApiComunicator("/auth/biometricSkip", "POST", {}))}
        >
            <p className="mb-0">Sign in faster with your fingerprint, face or device lock. You can change this later in Settings.</p>
            {error && <p className="text-danger mt-2 mb-0">{error}</p>}
        </MessageModal>
    );
}
