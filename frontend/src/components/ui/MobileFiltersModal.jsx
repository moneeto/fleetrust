"use client";

import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";

export default function MobileFiltersModal({
    isOpen,
    toggle,
    title = "Filters",
    onApply,
    onReset,
    children,
}) {
    const handleApply = () => {
        onApply?.();
        toggle?.();
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle} fullscreen="sm" centered scrollable>
            <ModalHeader toggle={toggle}>{title}</ModalHeader>
            <ModalBody>
                <div
                    className="d-flex flex-column gap-3"
                    style={{ width: "100%" }}
                >
                    {children}
                </div>
            </ModalBody>
            <ModalFooter className="d-flex justify-content-between">
                <Button color="secondary" outline onClick={onReset}>
                    Reset
                </Button>
                <Button color="primary" onClick={handleApply}>
                    Apply
                </Button>
            </ModalFooter>
        </Modal>
    );
}
