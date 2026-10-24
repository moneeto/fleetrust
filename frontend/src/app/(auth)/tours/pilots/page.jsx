"use client";

import { useEffect, useState } from "react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import Config from "@/config";
import { Form, FormGroup, Label, Input, Button, Modal, ModalBody, ModalFooter, ModalHeader, Table } from "reactstrap";
import { useToast } from "@/components/ui/use-toast";
import { CheckIcon, EditIcon, Filter, TrashIcon, XIcon } from "lucide-react";
import MessageModal from "@/components/ui/MessageModal";
import styles from "@/components/ui/listing.module.css";
import Spinner from "@/components/ui/Spinner";
import useIsMobile from "@/hooks/useIsMobile";
import MobileFiltersModal from "@/components/ui/MobileFiltersModal";

export default function PilotList() {
    const [pilots, setPilots] = useState([]);
    const [selectedPilot, setSelectedPilot] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
    const [error, setError] = useState(null);
    const [creatingPilot, setCreatingPilot] = useState(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const [deleteConfirmModal, setDeleteConfirmModal] = useState({ show: false, pilot: null });
    const [showDeleted, setShowDeleted] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filters, setFilters] = useState({ pilotName: "", phoneNumber: "", active: "all" });
    const isMobile = useIsMobile();

    const { toast } = useToast();

    function photoUrl(filename) {
        if (filename.startsWith('data:')) return filename;
        return `${Config.endpoint}/pilots/photo/${encodeURIComponent(filename)}`;
    }

    function previewSrc(pilotState) {
        if (pilotState.photoPreview) return pilotState.photoPreview;
        if (pilotState.pilotPicture) return photoUrl(pilotState.pilotPicture);
        return null;
    }

    async function fetchPilots() {
        try {
            setLoading(true);
            setError(null);

            const res = await ApiComunicator(`/pilots?includeDeleted=1`, 'GET');

            setPilots(res.pilots);
        } catch (err) {
            setError(err.message);
            setPilots([]);
        } finally {
            setLoading(false);
            setHasFetchedOnce(true);
        }
    }

    useEffect(() => {
        fetchPilots();
    }, []);

    function onPhotoSelected(file, pilotState, setPilotState) {
        setPilotState({
            ...pilotState,
            photoFile: file,
            photoPreview: URL.createObjectURL(file)
        });
    }

    const createPilot = async () => {
        try {
            setLoading(true);

            const formData = new FormData();
            formData.append("pilotName", creatingPilot.pilotName);
            formData.append("phoneNumber", creatingPilot.phoneNumber);
            formData.append("active", creatingPilot.active ? "1" : "0");
            if (creatingPilot.photoFile) {
                formData.append("pilotPicture", creatingPilot.photoFile);
            }

            await ApiComunicator(`/pilots/new`, "POST", formData);

            await fetchPilots();

            setEditorOpen(false);
        } catch (error) {
            let message = "Error creating pilot";
            if (error.message) { message = error.message }
            toast({
                variant: "destructive",
                title: "Error",
                description: message
            });
        } finally {
            setLoading(false);
        }
    };

    const editPilot = async (id) => {
        try {
            setLoading(true)
            const formData = new FormData();
            formData.append("idPilot", id);
            formData.append("pilotName", selectedPilot.pilotName);
            formData.append("phoneNumber", selectedPilot.phoneNumber);
            formData.append("active", selectedPilot.active ? "1" : "0");
            if (selectedPilot.photoFile) {
                formData.append("pilotPicture", selectedPilot.photoFile);
            }
            await ApiComunicator(`/pilots/edit`, "POST", formData);
            await fetchPilots();
            setEditorOpen(false);
        } catch (error) {
            let message = "An error occurred while editing the pilot's information. Please try again.";
            if (error.message) { message = error.message }
            toast({
                variant: "destructive",
                title: "Error",
                description: message
            });
        } finally {
            setLoading(false)
        }
    }

    const openDeleteModal = (pilot) => {
        setDeleteConfirmModal({ show: true, pilot });
    };

    const confirmDelete = async () => {
        const { pilot } = deleteConfirmModal;
        if (!pilot) return;

        try {
            setLoading(true);
            const response = await ApiComunicator(`/pilots/delete`, "POST", {
                idPilot: pilot.idPilot
            });

            if (response.success) {
                setDeleteConfirmModal({ show: false, pilot: null });
                if (selectedPilot && selectedPilot.idPilot === pilot.idPilot) {
                    setEditorOpen(false);
                }
                toast({
                    title: "Success",
                    description: "Pilot deleted successfully"
                });
                await fetchPilots();
            }
        } catch (error) {
            let message = "An error occurred while deleting the pilot.";
            if (error.message) { message = error.message }
            toast({
                variant: "destructive",
                title: "Error",
                description: message
            });
        } finally {
            setLoading(false);
        }
    };

    function toggleEditPilot(pilot) {
        setCreatingPilot(null);
        setSelectedPilot(pilot);
        setEditorOpen(true);
    }

    const renderEditFields = (pilotState, setPilotState, idSuffix) => (
        <div className={styles.editFields}>
            {previewSrc(pilotState) && (
                <img
                    src={previewSrc(pilotState)}
                    alt={pilotState.pilotName}
                    className={styles.photoPreview}
                    crossOrigin="use-credentials"
                />
            )}
            <FormGroup className="mb-0">
                <Label for={`photo-${idSuffix}`}>Photo</Label>
                <Input
                    id={`photo-${idSuffix}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        if (e.target.files[0]) {
                            onPhotoSelected(e.target.files[0], pilotState, setPilotState);
                        }
                    }}
                />
            </FormGroup>
            <FormGroup className="mb-0">
                <Label for={`name-${idSuffix}`}>Name</Label>
                <Input
                    id={`name-${idSuffix}`}
                    type="text"
                    value={pilotState.pilotName}
                    onChange={(e) => setPilotState({ ...pilotState, pilotName: e.target.value })}
                />
            </FormGroup>
            <FormGroup className="mb-0">
                <Label for={`phone-${idSuffix}`}>Phone</Label>
                <Input
                    id={`phone-${idSuffix}`}
                    type="text"
                    value={pilotState.phoneNumber}
                    onChange={(e) => setPilotState({ ...pilotState, phoneNumber: e.target.value })}
                />
            </FormGroup>
            <FormGroup switch className="mb-0">
                <Input
                    type="switch"
                    id={`active-${idSuffix}`}
                    checked={!!pilotState.active}
                    style={{ cursor: "pointer" }}
                    onChange={(e) => setPilotState({ ...pilotState, active: e.target.checked })}
                />
                <Label for={`active-${idSuffix}`} check>
                    Active
                </Label>
            </FormGroup>
        </div>
    );

    if (!hasFetchedOnce && loading) {
        return <Spinner />
    }

    const visiblePilots = pilots.filter((row) => {
        if (!showDeleted && row.deleted) return false;
        if (filters.pilotName && !String(row.pilotName || "").toLowerCase().includes(filters.pilotName.toLowerCase())) return false;
        if (filters.phoneNumber && !String(row.phoneNumber || "").toLowerCase().includes(filters.phoneNumber.toLowerCase())) return false;
        if (filters.active === "yes" && !row.active) return false;
        if (filters.active === "no" && row.active) return false;
        return true;
    });
    const updateFilter = (field, value) => setFilters((prev) => ({ ...prev, [field]: value }));
    const resetFilters = () => {
        setFilters({ pilotName: "", phoneNumber: "", active: "all" });
        setShowDeleted(false);
    };
    const activeFilterCount = [filters.pilotName, filters.phoneNumber].filter(Boolean).length + (filters.active !== "all" ? 1 : 0) + (showDeleted ? 1 : 0);
    const fieldMin = isMobile ? "100%" : undefined;
    const filterFields = (idPrefix = "") => (
        <>
            <FormGroup style={{ minWidth: fieldMin || "180px" }}>
                <Label for={`${idPrefix}filterName`}>Name</Label>
                <Input id={`${idPrefix}filterName`} value={filters.pilotName} onChange={(e) => updateFilter("pilotName", e.target.value)} />
            </FormGroup>
            <FormGroup style={{ minWidth: fieldMin || "160px" }}>
                <Label for={`${idPrefix}filterPhone`}>Phone</Label>
                <Input id={`${idPrefix}filterPhone`} value={filters.phoneNumber} onChange={(e) => updateFilter("phoneNumber", e.target.value)} />
            </FormGroup>
            <FormGroup style={{ minWidth: fieldMin || "140px" }}>
                <Label for={`${idPrefix}filterActive`}>Active</Label>
                <Input id={`${idPrefix}filterActive`} type="select" value={filters.active} onChange={(e) => updateFilter("active", e.target.value)}>
                    <option value="all">All</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                </Input>
            </FormGroup>
            <FormGroup style={{ minWidth: fieldMin || "140px" }}>
                {isMobile ? <Label for={`${idPrefix}showDeleted`}>Show deleted</Label> : <Label className="d-block invisible">Show deleted</Label>}
                <div className="d-flex align-items-center" style={{ minHeight: "38px" }}>
                    <Input id={`${idPrefix}showDeleted`} type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />
                    {!isMobile && <Label for={`${idPrefix}showDeleted`} check className="ms-2 mb-0">Show deleted</Label>}
                </div>
            </FormGroup>
        </>
    );

    return (
        <div className={styles.page}>
            <div className={styles.pageActions}>
                <Button
                    color="primary"
                    size="sm"
                    onClick={() => {
                        setSelectedPilot(null);
                        setCreatingPilot({
                            pilotName: "",
                            phoneNumber: "",
                            pilotPicture: "",
                            active: true
                        });
                        setEditorOpen(true);
                    }}
                >
                    + New pilot
                </Button>
            </div>

            {error && (
                <p className="text-sm text-red-600 px-3">
                    {error}
                </p>
            )}

            <div className={styles.mobileToolbar}>
                <Button color="primary" outline className={styles.filtersBtn} type="button" onClick={() => setFiltersOpen(true)}>
                    <Filter size={16} />
                    Filters
                    {activeFilterCount > 0 && <span className={styles.filtersBadge}>{activeFilterCount}</span>}
                </Button>
            </div>
            <Form className={`${styles.filtersCard} ${styles.desktopOnly}`}>
                <div className="d-flex flex-wrap gap-3 align-items-end">
                    {filterFields()}
                </div>
            </Form>
            <MobileFiltersModal isOpen={filtersOpen} toggle={() => setFiltersOpen(false)} onApply={() => setFiltersOpen(false)} onReset={resetFilters}>
                {filterFields("mobile-")}
            </MobileFiltersModal>

            <div className={`${styles.tableCard} ${styles.desktopOnly}`}>
                <Table>
                    <thead>
                        <tr>
                            <th>Pilot</th>
                            <th>Phone</th>
                            <th>Active</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visiblePilots.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center text-muted">No pilots found.</td>
                            </tr>
                        )}
                        {visiblePilots.map((r) => (
                            <tr key={r.idPilot} style={{ opacity: r.deleted ? 0.55 : 1 }}>
                                <td>
                                    <div className="d-flex align-items-center gap-3">
                                        {r.pilotPicture ? (
                                            <img
                                                src={photoUrl(r.pilotPicture)}
                                                alt={r.pilotName}
                                                className={styles.avatar}
                                                crossOrigin="use-credentials"
                                            />
                                        ) : (
                                            <div className={styles.avatar} />
                                        )}
                                        <span className="fw-semibold">{r.pilotName}</span>
                                    </div>
                                </td>
                                <td>{r.phoneNumber}</td>
                                <td><span className={`${styles.badge} ${r.active ? styles.badgeOk : styles.badgeNo}`}>{r.active ? "Active" : "Inactive"}</span></td>
                                <td>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" size="sm" outline onClick={() => toggleEditPilot(r)}>
                                            <EditIcon size={16} /> Edit
                                        </Button>
                                        {!r.deleted && (
                                            <Button color="danger" size="sm" outline onClick={() => openDeleteModal(r)}>
                                                <TrashIcon size={16} /> Delete
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            <div className={`${styles.cardsList} ${styles.mobileOnly}`}>
                {visiblePilots.length === 0 && (
                    <div className={styles.emptyCard}>
                        <p className="mb-0 text-sm text-gray-500">No pilots found.</p>
                    </div>
                )}

                {visiblePilots.map((r) => (
                    <div key={r.idPilot} className={`${styles.card} ${r.deleted ? styles.cardDeleted : ""}`}>
                        <div className={styles.cardHead}>
                            <div className="d-flex align-items-center gap-3">
                                {r.pilotPicture ? (
                                    <img
                                        src={photoUrl(r.pilotPicture)}
                                        alt={r.pilotName}
                                        className={styles.avatar}
                                        crossOrigin="use-credentials"
                                    />
                                ) : (
                                    <div className={styles.avatar} />
                                )}
                                <h3 className={styles.cardTitle}>{r.pilotName}</h3>
                            </div>
                            <span className={`${styles.badge} ${r.active ? styles.badgeOk : styles.badgeNo}`}>{r.active ? "Active" : "Inactive"}</span>
                        </div>
                        <div className={styles.cardMeta}>
                            <div className={styles.cardMetaFull}>
                                <span className={styles.cardMetaLabel}>Phone</span>
                                {r.phoneNumber || "-"}
                            </div>
                        </div>
                        <div className={styles.cardActions}>
                            <Button color="primary" size="sm" outline onClick={() => toggleEditPilot(r)}>
                                <EditIcon size={16} /> Edit
                            </Button>
                            {!r.deleted && (
                                <Button color="danger" size="sm" outline onClick={() => openDeleteModal(r)}>
                                    <TrashIcon size={16} /> Delete
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {loading && hasFetchedOnce && (
                <div className="px-3 text-sm text-gray-500">
                    Loading pilots...
                </div>
            )}

            <Modal isOpen={editorOpen} centered toggle={() => setEditorOpen(false)} onClosed={() => { if (!editorOpen) { setCreatingPilot(null); setSelectedPilot(null); } }}>
                <ModalHeader
                    toggle={() => setEditorOpen(false)}
                    style={{ backgroundColor: '#1e1e1e', color: 'white' }}
                >
                    <span style={{ color: 'white' }}>{creatingPilot ? "New pilot" : "Edit pilot"}</span>
                </ModalHeader>
                <ModalBody>
                    {creatingPilot && renderEditFields(creatingPilot, setCreatingPilot, "new")}
                    {selectedPilot && renderEditFields(selectedPilot, setSelectedPilot, selectedPilot.idPilot)}
                </ModalBody>
                <ModalFooter style={{ backgroundColor: '#f8f9fa' }}>
                    <Button
                        style={{ fontSize: '13px', fontWeight: '600' }}
                        color="secondary"
                        outline
                        onClick={() => setEditorOpen(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        style={{ fontSize: '13px', fontWeight: '600' }}
                        color="success"
                        onClick={() => {
                            if (creatingPilot) {
                                createPilot();
                            } else {
                                editPilot(selectedPilot.idPilot);
                            }
                        }}
                        disabled={
                            loading ||
                            (creatingPilot && !creatingPilot.pilotName) ||
                            (selectedPilot && !selectedPilot.pilotName)
                        }
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </Button>
                </ModalFooter>
            </Modal>

            <MessageModal
                isOpen={deleteConfirmModal.show}
                type="confirm"
                title="Confirm deletion"
                confirmLabel={loading ? "Deleting..." : "Delete pilot"}
                confirmColor="danger"
                disabled={loading}
                onClose={() => setDeleteConfirmModal({ show: false, pilot: null })}
                onConfirm={confirmDelete}
            >
                Are you sure you want to delete {deleteConfirmModal.pilot && deleteConfirmModal.pilot.pilotName}?
            </MessageModal>
        </div>
    );
}
