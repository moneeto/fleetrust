"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, Spinner } from "reactstrap";
import { Check } from "lucide-react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { biometricCancelled, registerBiometric } from "@/helpers/biometric";

export default function BiometricSetting() {
    const [configured, setConfigured] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const loadStatus = () => ApiComunicator("/auth/biometricStatus", "GET")
        .then((status) => setConfigured(Number(status.passkeys) > 0))
        .catch((err) => setError(err.message));

    useEffect(() => {
        loadStatus();
    }, []);

    async function enable() {
        setError("");
        setLoading(true);
        try {
            await registerBiometric();
            await loadStatus();
        } catch (err) {
            if (!biometricCancelled(err)) setError(err.message || "Could not enable biometric login.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card>
            <CardBody className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div>
                    <h6 className="mb-1">Biometric login</h6>
                    <p className="mb-0 text-muted">Sign in with your fingerprint, face or device lock.</p>
                    {configured && (
                        <p className="mb-0 mt-2 text-success d-flex align-items-center gap-1">
                            <Check size={16} aria-hidden="true" /> Configured
                        </p>
                    )}
                </div>
                <Button color="primary" outline={configured} onClick={enable} disabled={loading}>
                    {loading && <Spinner size="sm" className="me-2" />}
                    {configured ? "Set up again" : "Enable"}
                </Button>
            </CardBody>
            {error && <Alert color="danger" className="m-3 mt-0 py-2">{error}</Alert>}
        </Card>
    );
}
