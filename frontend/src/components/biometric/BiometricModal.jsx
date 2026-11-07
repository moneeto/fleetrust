"use client";

import { FaFingerprint } from "react-icons/fa";
import { Button, Modal, ModalBody, Spinner } from "reactstrap";
import styles from "./BiometricModal.module.css";

export default function BiometricModal({ isOpen, loading, error, onEnable, onSkip }) {
    return (
        <Modal isOpen={isOpen} toggle={onSkip} centered size="md" contentClassName="border-0 shadow-md">
            <ModalBody className="p-5 text-center">
                <div className={styles.icon}>
                    <FaFingerprint aria-hidden="true" />
                </div>
                <h2 className="fw-bold mt-4 mb-2">Sign in faster</h2>
                <p className="text-muted fs-5 mb-4">Use your fingerprint, face or device lock instead of your password.</p>

                {error && <p className="text-danger small">{error}</p>}

                <Button color="primary" size="lg" className="w-100" onClick={onEnable} disabled={loading}>
                    {loading ? <Spinner size="sm" /> : "Enable"}
                </Button>
                <Button color="link" className="text-muted text-decoration-none mt-2" onClick={onSkip} disabled={loading}>
                    Maybe later
                </Button>
            </ModalBody>
        </Modal>
    );
}
