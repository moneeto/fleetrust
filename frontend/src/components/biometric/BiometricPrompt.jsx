"use client";

import { useEffect, useState } from "react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { biometricCancelled, biometricSupported, registerBiometric } from "@/helpers/biometric";
import BiometricModal from "./BiometricModal";

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
        <BiometricModal
            isOpen={open}
            loading={loading}
            error={error}
            onEnable={() => run(registerBiometric)}
            onSkip={() => run(() => ApiComunicator("/auth/biometricSkip", "POST", {}))}
        />
    );
}
