"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { FormGroup, Label, Input, Button, Table, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { useToast } from "@/components/ui/use-toast";
import { ArrowRightCircle, CheckIcon, EditIcon, Filter, TrashIcon, Undo2, XIcon } from "lucide-react";
import MessageModal from "@/components/ui/MessageModal";
import styles from "@/components/ui/listing.module.css";
import Spinner from "@/components/ui/Spinner";
import useIsMobile from "@/hooks/useIsMobile";
import MobileFiltersModal from "@/components/ui/MobileFiltersModal";

const INITIAL_FILTERS = {
    aircraft: "",
    capacity: "",
    registrationNumber: "",
    available: "all",
    plannedBookings: "all",
};

function isDeleted(aircraft) {
    return aircraft.deleted === 1 || aircraft.deleted === true;
}

function hasPlannedBookings(aircraft) {
    return aircraft.plannedBookings === 1 || aircraft.plannedBookings === true;
}

function countActiveFilters(filters, showDeleted) {
    let count = 0;
    if (filters.aircraft) count += 1;
    if (filters.capacity) count += 1;
    if (filters.registrationNumber) count += 1;
    if (filters.available !== "all") count += 1;
    if (filters.plannedBookings !== "all") count += 1;
    if (showDeleted) count += 1;
    return count;
}

export default function AircraftList() {
    const [aircrafts, setAircrafts] = useState([]);
    const [selectedAircraft, setSelectedAircraft] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
    const [error, setError] = useState(null);
    const [creatingAircraft, setCreatingAircraft] = useState(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [showDeleted, setShowDeleted] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [deleteConfirmModal, setDeleteConfirmModal] = useState({ show: false, aircraft: null });

    const { toast } = useToast();
    const router = useRouter();
    const isMobile = useIsMobile();
    const activeFilterCount = countActiveFilters(filters, showDeleted);

    async function fetchAircrafts() {
        try {
            setLoading(true);
            setError(null);

            const res = await ApiComunicator(`/aircrafts?includeDeleted=1`, 'GET');

            setAircrafts(res.aircrafts || []);
        } catch (err) {
            setError(err.message);
            setAircrafts([]);
        } finally {
            setLoading(false);
            setHasFetchedOnce(true);
        }
    }

    useEffect(() => {
        fetchAircrafts();
    }, []);

    const filteredAircrafts = useMemo(() => {
        return aircrafts.filter((r) => {
            if (!showDeleted && isDeleted(r)) return false;

            if (filters.aircraft && !String(r.aircraft || "").toLowerCase().includes(filters.aircraft.toLowerCase())) {
                return false;
            }
            if (filters.capacity && !String(r.capacity ?? "").includes(filters.capacity)) {
                return false;
            }
            if (filters.registrationNumber && !String(r.registrationNumber || "").toLowerCase().includes(filters.registrationNumber.toLowerCase())) {
                return false;
            }
            if (filters.available === "yes" && !r.available) return false;
            if (filters.available === "no" && r.available) return false;
            if (filters.plannedBookings === "yes" && !hasPlannedBookings(r)) return false;
            if (filters.plannedBookings === "no" && hasPlannedBookings(r)) return false;

            return true;
        });
    }, [aircrafts, filters, showDeleted]);

    const updateFilter = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
    };

    const resetFilters = () => {
        setFilters(INITIAL_FILTERS);
        setShowDeleted(false);
    };

    const createAircraft = async () => {
        try {
            setLoading(true);

            await ApiComunicator(`/aircrafts/new`, "POST", creatingAircraft);

            await fetchAircrafts();

            setEditorOpen(false);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Error creating aircraft"
            });
        } finally {
            setLoading(false);
        }
    };

    const editAircraft = async (id) => {
        try {
            setLoading(true)
            await ApiComunicator(`/aircrafts/edit`, "POST", { idAircraft: id, ...selectedAircraft });
            setAircrafts(prev => prev.map(aircraft => aircraft.idAircraft === id ? { ...aircraft, ...selectedAircraft } : aircraft));
            setEditorOpen(false);
        } catch (error) {
            let message = "An error occurred while editing aircraft's information. Please try again.";
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

    const openDeleteModal = (aircraft, e) => {
        e?.stopPropagation?.();
        setDeleteConfirmModal({ show: true, aircraft });
    };

    const confirmDelete = async () => {
        const { aircraft } = deleteConfirmModal;
        if (!aircraft) return;

        try {
            setLoading(true);
            const response = await ApiComunicator(`/aircrafts/delete`, "POST", {
                idAircraft: aircraft.idAircraft
            });

            if (response.success) {
                setDeleteConfirmModal({ show: false, aircraft: null });
                if (selectedAircraft?.idAircraft === aircraft.idAircraft) {
                    setEditorOpen(false);
                }
                toast({
                    title: "Success",
                    description: "Aircraft deleted successfully"
                });
                await fetchAircrafts();
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "An error occurred while deleting the aircraft."
            });
        } finally {
            setLoading(false);
        }
    };

    const restoreAircraft = async (aircraft, e) => {
        e?.stopPropagation?.();
        try {
            setLoading(true);
            const response = await ApiComunicator(`/aircrafts/restore`, "POST", {
                idAircraft: aircraft.idAircraft
            });

            if (response.success) {
                toast({
                    title: "Success",
                    description: "Aircraft restored successfully"
                });
                await fetchAircrafts();
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "An error occurred while restoring the aircraft."
            });
        } finally {
            setLoading(false);
        }
    };

    function toggleEditAircraft(aircraft, e) {
        e?.stopPropagation?.();
        setCreatingAircraft(null);
        setSelectedAircraft(aircraft);
        setEditorOpen(true);
    }

    function goToBookings(aircraft) {
        if (isDeleted(aircraft)) return;
        router.push(
            `/tours/bookings?idAircraft=${encodeURIComponent(
                String(aircraft.idAircraft)
            )}&period=month`
        );
    }

    const filterFields = (idPrefix = "") => (
        <>
            <FormGroup style={{ minWidth: isMobile ? "100%" : "180px" }}>
                <Label for={`${idPrefix}filterAircraft`}>Aircraft</Label>
                <Input
                    id={`${idPrefix}filterAircraft`}
                    type="text"
                    value={filters.aircraft}
                    onChange={(e) => updateFilter("aircraft", e.target.value)}
                />
            </FormGroup>
            <FormGroup style={{ minWidth: isMobile ? "100%" : "120px" }}>
                <Label for={`${idPrefix}filterCapacity`}>Capacity</Label>
                <Input
                    id={`${idPrefix}filterCapacity`}
                    type="text"
                    value={filters.capacity}
                    onChange={(e) => updateFilter("capacity", e.target.value)}
                />
            </FormGroup>
            <FormGroup style={{ minWidth: isMobile ? "100%" : "180px" }}>
                <Label for={`${idPrefix}filterRegistration`}>Registration number</Label>
                <Input
                    id={`${idPrefix}filterRegistration`}
                    type="text"
                    value={filters.registrationNumber}
                    onChange={(e) => updateFilter("registrationNumber", e.target.value)}
                />
            </FormGroup>
            <FormGroup style={{ minWidth: isMobile ? "100%" : "140px" }}>
                <Label for={`${idPrefix}filterAvailable`}>Available</Label>
                <Input
                    id={`${idPrefix}filterAvailable`}
                    type="select"
                    value={filters.available}
                    onChange={(e) => updateFilter("available", e.target.value)}
                >
                    <option value="all">All</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                </Input>
            </FormGroup>
            <FormGroup style={{ minWidth: isMobile ? "100%" : "180px" }}>
                <Label for={`${idPrefix}filterPlannedBookings`}>Has planned bookings</Label>
                <Input
                    id={`${idPrefix}filterPlannedBookings`}
                    type="select"
                    value={filters.plannedBookings}
                    onChange={(e) => updateFilter("plannedBookings", e.target.value)}
                >
                    <option value="all">All</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                </Input>
            </FormGroup>
            <FormGroup style={{ minWidth: isMobile ? "100%" : "140px" }}>
                {isMobile ? (
                    <Label for={`${idPrefix}showDeleted`}>Show deleted</Label>
                ) : (
                    <Label className="d-block invisible">Show deleted</Label>
                )}
                <div className="d-flex align-items-center" style={{ minHeight: "38px" }}>
                    <Input
                        id={`${idPrefix}showDeleted`}
                        type="checkbox"
                        checked={showDeleted}
                        onChange={(e) => setShowDeleted(e.target.checked)}
                    />
                    {!isMobile && (
                        <Label for={`${idPrefix}showDeleted`} check className="ms-2 mb-0">
                            Show deleted
                        </Label>
                    )}
                    {isMobile && (
                        <Label for={`${idPrefix}showDeleted`} check className="ms-2 mb-0">
                            Include deleted aircraft
                        </Label>
                    )}
                </div>
            </FormGroup>
        </>
    );

    const renderEditFields = (aircraftState, setAircraftState, idSuffix) => (
        <div className={styles.editFields}>
            <FormGroup className="mb-0">
                <Label for={`aircraft-${idSuffix}`}>Aircraft</Label>
                <Input
                    id={`aircraft-${idSuffix}`}
                    type="text"
                    value={aircraftState.aircraft}
                    onChange={(e) => setAircraftState({ ...aircraftState, aircraft: e.target.value })}
                />
            </FormGroup>
            <FormGroup className="mb-0">
                <Label for={`capacity-${idSuffix}`}>Capacity</Label>
                <Input
                    id={`capacity-${idSuffix}`}
                    type="number"
                    value={aircraftState.capacity}
                    onChange={(e) => setAircraftState({ ...aircraftState, capacity: e.target.value })}
                />
            </FormGroup>
            <FormGroup className="mb-0">
                <Label for={`registration-${idSuffix}`}>Registration number</Label>
                <Input
                    id={`registration-${idSuffix}`}
                    type="text"
                    value={aircraftState.registrationNumber}
                    onChange={(e) => setAircraftState({ ...aircraftState, registrationNumber: e.target.value })}
                />
            </FormGroup>
            <FormGroup switch className="mb-0">
                <Input
                    type="switch"
                    id={`available-mobile-${idSuffix}`}
                    checked={!!aircraftState.available}
                    style={{ cursor: "pointer" }}
                    onChange={(e) => setAircraftState({ ...aircraftState, available: e.target.checked })}
                />
                <Label for={`available-mobile-${idSuffix}`} check>
                    Available
                </Label>
            </FormGroup>
        </div>
    );

    if (!hasFetchedOnce && loading) {
        return <Spinner />
    }

    return (
        <div className={styles.page}>
            <div className={styles.pageActions}>
                <Button
                    color="primary"
                    size="sm"
                    onClick={() => {
                        setSelectedAircraft(null);
                        setCreatingAircraft({
                            aircraft: "",
                            capacity: "",
                            registrationNumber: "",
                            available: true
                        });
                        setEditorOpen(true);
                    }}
                    disabled={editorOpen}
                >
                    + New aircraft
                </Button>
            </div>

            {error && (
                <p className="text-sm text-red-600 px-3">
                    {error}
                </p>
            )}

            <div className={styles.mobileToolbar}>
                <Button
                    color="primary"
                    outline
                    className={styles.filtersBtn}
                    onClick={() => setFiltersOpen(true)}
                >
                    <Filter size={16} />
                    Filters
                    {activeFilterCount > 0 && (
                        <span className={styles.filtersBadge}>{activeFilterCount}</span>
                    )}
                </Button>
            </div>

            <div className={`${styles.filtersCard} ${styles.desktopOnly}`}>
                <div className="d-flex flex-wrap gap-3 align-items-end">
                    {filterFields()}
                </div>
            </div>

            <MobileFiltersModal
                isOpen={filtersOpen}
                toggle={() => setFiltersOpen(false)}
                onApply={() => setFiltersOpen(false)}
                onReset={resetFilters}
            >
                {filterFields("mobile-")}
            </MobileFiltersModal>

            {/* Desktop table */}
            <div className={`${styles.tableCard} ${styles.desktopOnly}`}>
                <Table>
                    <thead style={{ background: '#f3f4f6' }} className="border-b">
                        <tr>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                Aircraft
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                Capacity
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                Registration number
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                Available
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                Has planned bookings
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y">
                        {filteredAircrafts.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-6 text-sm text-gray-500 text-center">
                                    No aircrafts found.
                                </td>
                            </tr>
                        )}
                        {filteredAircrafts.map((r) =>(
                                <tr
                                    key={r.idAircraft}
                                    className={`${isDeleted(r) ? styles.deletedRow : "transition-colors duration-150 hover:bg-sky-100"}`}
                                    style={{ cursor: isDeleted(r) ? "default" : "pointer" }}
                                    onClick={() => goToBookings(r)}
                                >
                                    <td className="px-4 py-3 text-sm">
                                        <ArrowRightCircle className="text-primary shrink-0" size={16} strokeWidth={2} aria-hidden />
                                        <span style={{ marginLeft: '4px', color: isDeleted(r) ? '#991b1b' : '#0d6efd', fontWeight: '500' }}>
                                            {r.aircraft}
                                            {isDeleted(r) && (
                                                <span className="ms-2 text-xs text-red-700">(Deleted)</span>
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {r.capacity}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {r.registrationNumber}
                                    </td>
                                    <td><span className={`${styles.badge} ${r.available ? styles.badgeOk : styles.badgeNo}`}>{r.available ? "Yes" : "No"}</span></td>
                                    <td><span className={`${styles.badge} ${hasPlannedBookings(r) ? styles.badgeOk : styles.badgeNo}`}>{hasPlannedBookings(r) ? "Yes" : "No"}</span></td>
                                    <td>
                                        {isDeleted(r) ? (
                                            <div className="d-flex gap-2">
                                                <Button
                                                    color="secondary"
                                                    size="sm"
                                                    outline
                                                    onClick={(e) => restoreAircraft(r, e)}
                                                    disabled={loading}
                                                >
                                                    <Undo2 size={16} /> Undo
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="d-flex gap-2">
                                                <Button
                                                    color="primary"
                                                    size="sm"
                                                    outline
                                                    onClick={(e) => toggleEditAircraft(r, e)}
                                                >
                                                    <EditIcon size={16} /> Edit
                                                </Button>
                                                <Button
                                                    color="danger"
                                                    size="sm"
                                                    outline
                                                    onClick={(e) => openDeleteModal(r, e)}
                                                >
                                                    <TrashIcon size={16} /> Delete
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </Table>
            </div>

            {/* Mobile cards */}
            <div className={`${styles.mobileOnly} ${styles.cardsList}`}>
                {filteredAircrafts.length === 0 && !creatingAircraft && (
                    <div className={styles.card}>
                        <p className="mb-0 text-sm text-gray-500 text-center">No aircrafts found.</p>
                    </div>
                )}

                {filteredAircrafts.map((r) => {
                    return (
                        <div
                            key={r.idAircraft}
                            className={`${styles.card} ${isDeleted(r) ? styles.cardDeleted : ""}`}
                        >
<>
                                    <div className={styles.cardHead}>
                                    <div
                                        className={`${styles.cardTitle} ${styles.cardTitleLink} ${isDeleted(r) ? styles.cardTitleDeleted : ""}`}
                                        onClick={() => goToBookings(r)}
                                    >
                                        <ArrowRightCircle size={16} strokeWidth={2} aria-hidden />
                                        <span>
                                            {r.aircraft}
                                            {isDeleted(r) && (
                                                <span className="ms-2 text-xs">(Deleted)</span>
                                            )}
                                        </span>
                                    </div>
                                    </div>
                                    <div className={styles.cardMeta}>
                                        <div>
                                            <span className={styles.cardMetaLabel}>Capacity</span>
                                            {r.capacity}
                                        </div>
                                        <div>
                                            <span className={styles.cardMetaLabel}>Registration</span>
                                            {r.registrationNumber}
                                        </div>
                                    </div>
                                    <div className={styles.badges}>
                                        <span className={`${styles.badge} ${r.available ? styles.badgeOk : styles.badgeNo}`}>
                                            {r.available ? <CheckIcon size={12} /> : <XIcon size={12} />}
                                            Available
                                        </span>
                                        <span className={`${styles.badge} ${hasPlannedBookings(r) ? styles.badgeOk : styles.badgeNo}`}>
                                            {hasPlannedBookings(r) ? <CheckIcon size={12} /> : <XIcon size={12} />}
                                            Planned bookings
                                        </span>
                                    </div>
                                    <div className={styles.cardActions}>
                                        {isDeleted(r) ? (
                                            <Button
                                                color="secondary"
                                                size="sm"
                                                outline
                                                onClick={(e) => restoreAircraft(r, e)}
                                                disabled={loading}
                                            >
                                                <Undo2 size={16} /> Undo
                                            </Button>
                                        ) : (
                                            <>
                                                <Button
                                                    color="primary"
                                                    size="sm"
                                                    outline
                                                    onClick={(e) => toggleEditAircraft(r, e)}
                                                >
                                                    <EditIcon size={16} /> Edit
                                                </Button>
                                                <Button
                                                    color="danger"
                                                    size="sm"
                                                    outline
                                                    onClick={(e) => openDeleteModal(r, e)}
                                                >
                                                    <TrashIcon size={16} /> Delete
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </>
                        </div>
                    );
                })}

            </div>

            {loading && hasFetchedOnce && (
                <div className="px-3 text-sm text-gray-500">
                    Loading aircrafts...
                </div>
            )}


            <Modal isOpen={editorOpen} centered size="lg" toggle={() => setEditorOpen(false)} onClosed={() => { if (!editorOpen) { setCreatingAircraft(null); setSelectedAircraft(null); } }}>
                <ModalHeader toggle={() => setEditorOpen(false)}>
                    {creatingAircraft ? "New aircraft" : "Edit aircraft"}
                </ModalHeader>
                <ModalBody>
                    {creatingAircraft
                        ? renderEditFields(creatingAircraft, setCreatingAircraft, "new")
                        : selectedAircraft && renderEditFields(selectedAircraft, setSelectedAircraft, selectedAircraft.idAircraft)}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={() => setEditorOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        color="success"
                        disabled={creatingAircraft
                            ? !creatingAircraft.aircraft || !creatingAircraft.capacity || !creatingAircraft.registrationNumber
                            : !selectedAircraft}
                        onClick={creatingAircraft ? createAircraft : () => editAircraft(selectedAircraft.idAircraft)}
                    >
                        Save
                    </Button>
                </ModalFooter>
            </Modal>

            <MessageModal
                isOpen={deleteConfirmModal.show}
                type="confirm"
                title="Confirm deletion"
                confirmLabel={loading ? "Deleting..." : "Delete aircraft"}
                confirmColor="danger"
                disabled={loading}
                onClose={() => setDeleteConfirmModal({ show: false, aircraft: null })}
                onConfirm={confirmDelete}
            >
                Are you sure you want to delete {deleteConfirmModal.aircraft?.aircraft}?
            </MessageModal>
        </div>
    );
}
