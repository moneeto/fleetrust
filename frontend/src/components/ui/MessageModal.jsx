"use client";

import { useRef } from "react";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";

const SKIN = {
    success: { header: "bg-success text-white border-0", close: "btn-close btn-close-white", button: "success" },
    error: { header: "bg-danger text-white border-0", close: "btn-close btn-close-white", button: "danger" },
    confirm: { header: "bg-warning text-dark border-0", close: "btn-close", button: "primary" },
    info: { header: "bg-info text-dark border-0", close: "btn-close", button: "info" }
};

export default function MessageModal({
    isOpen,
    type = "info",
    title,
    children,
    onClose,
    onConfirm,
    confirmLabel,
    cancelLabel = "Cancel",
    confirmColor,
    confirmDisabled,
    disabled
}) {
    const held = useRef(null);
    if (isOpen) {
        held.current = { type, title, children, onConfirm, confirmLabel, cancelLabel, confirmColor, confirmDisabled, disabled };
    }
    const view = held.current;
    const skin = SKIN[view?.type] || SKIN.info;
    const label = view?.confirmLabel || (view?.onConfirm ? "Confirm" : "OK");

    return (
        <Modal isOpen={!!isOpen} toggle={onClose} centered onClosed={() => { held.current = null; }}>
            <ModalHeader
                className={skin.header}
                close={<button type="button" className={skin.close} aria-label="Close" onClick={onClose} />}
            >
                {view?.title}
            </ModalHeader>
            <ModalBody>{view?.children}</ModalBody>
            <ModalFooter>
                {view?.onConfirm && (
                    <Button color="secondary" outline onClick={onClose} disabled={!!view.disabled}>
                        {view.cancelLabel}
                    </Button>
                )}
                <Button
                    color={view?.confirmColor || skin.button}
                    onClick={view?.onConfirm || onClose}
                    disabled={!!view?.disabled || !!view?.confirmDisabled}
                >
                    {label}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
