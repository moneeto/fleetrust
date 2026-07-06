"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { FormGroup, Label, Input, Button, Table, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { useToast } from "@/components/ui/use-toast";
import { ArrowRightCircle, CheckIcon, EditIcon, TrashIcon, XIcon } from "lucide-react";
import { FaExclamationCircle } from "react-icons/fa";
import styles from './page.module.css';
import Spinner from "@/components/ui/Spinner";

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

export default function AircraftList() {
    const [aircrafts, setAircrafts] = useState([]);
    const [selectedAircraft, setSelectedAircraft] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
    const [error, setError] = useState(null);
    const [creatingAircraft, setCreatingAircraft] = useState(null);
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [showDeleted, setShowDeleted] = useState(false);
    const [deleteConfirmModal, setDeleteConfirmModal] = useState({ show: false, aircraft: null });

    const { toast } = useToast();
    const router = useRouter();

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

    const createAircraft = async () => {
        try {
            setLoading(true);

            await ApiComunicator(`/aircrafts/new`, "POST", creatingAircraft);

            await fetchAircrafts();

            setCreatingAircraft(null);
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
            setSelectedAircraft(null);
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
        e.stopPropagation();
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
                    setSelectedAircraft(null);
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

    function toggleEditAircraft(aircraft, e) {
        e?.stopPropagation?.();
        setSelectedAircraft(aircraft);
    }

    if (!hasFetchedOnce && loading) {
        return <Spinner />
    }

    return (
        <div className="p-6 space-y-6">
            {error && (
                <p className="text-sm text-red-600">
                    {error}
                </p>
            )}

            <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="d-flex flex-wrap gap-3 align-items-end">
                    <FormGroup style={{ minWidth: "180px" }}>
                        <Label for="filterAircraft">Aircraft</Label>
                        <Input
                            id="filterAircraft"
                            type="text"
                            value={filters.aircraft}
                            onChange={(e) => updateFilter("aircraft", e.target.value)}
                        />
                    </FormGroup>
                    <FormGroup style={{ minWidth: "120px" }}>
                        <Label for="filterCapacity">Capacity</Label>
                        <Input
                            id="filterCapacity"
                            type="text"
                            value={filters.capacity}
                            onChange={(e) => updateFilter("capacity", e.target.value)}
                        />
                    </FormGroup>
                    <FormGroup style={{ minWidth: "180px" }}>
                        <Label for="filterRegistration">Registration number</Label>
                        <Input
                            id="filterRegistration"
                            type="text"
                            value={filters.registrationNumber}
                            onChange={(e) => updateFilter("registrationNumber", e.target.value)}
                        />
                    </FormGroup>
                    <FormGroup style={{ minWidth: "140px" }}>
                        <Label for="filterAvailable">Available</Label>
                        <Input
                            id="filterAvailable"
                            type="select"
                            value={filters.available}
                            onChange={(e) => updateFilter("available", e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                        </Input>
                    </FormGroup>
                    <FormGroup style={{ minWidth: "180px" }}>
                        <Label for="filterPlannedBookings">Has planned bookings</Label>
                        <Input
                            id="filterPlannedBookings"
                            type="select"
                            value={filters.plannedBookings}
                            onChange={(e) => updateFilter("plannedBookings", e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                        </Input>
                    </FormGroup>
                    <FormGroup style={{ minWidth: "140px" }}>
                        <Label className="d-block invisible">Show deleted</Label>
                        <div className="d-flex align-items-center" style={{ minHeight: "38px" }}>
                            <Input
                                id="showDeleted"
                                type="checkbox"
                                checked={showDeleted}
                                onChange={(e) => setShowDeleted(e.target.checked)}
                            />
                            <Label for="showDeleted" check className="ms-2 mb-0">
                                Show deleted
                            </Label>
                        </div>
                    </FormGroup>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
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
                        {filteredAircrafts.map((r) =>
                            (selectedAircraft && selectedAircraft.idAircraft === r.idAircraft) ? (
                                <tr key={r.idAircraft} className={styles.customRow}>
                                    <td className="px-4 py-3 text-sm">
                                        <Input
                                            type="text"
                                            size="sm"
                                            defaultValue={selectedAircraft.aircraft}
                                            onChange={(e) => setSelectedAircraft({ ...selectedAircraft, aircraft: e.target.value })}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <Input
                                            size="sm"
                                            type="number"
                                            defaultValue={selectedAircraft.capacity}
                                            onChange={(e) => setSelectedAircraft({ ...selectedAircraft, capacity: e.target.value })}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <Input
                                            size="sm"
                                            type="text"
                                            defaultValue={selectedAircraft.registrationNumber}
                                            onChange={(e) => setSelectedAircraft({ ...selectedAircraft, registrationNumber: e.target.value })}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <FormGroup switch>
                                            <Input
                                                type="switch"
                                                id={`available-${r.idAircraft}`}
                                                checked={selectedAircraft.available}
                                                style={{ cursor: 'pointer' }}
                                                onChange={(e) => setSelectedAircraft({ ...selectedAircraft, available: e.target.checked })}
                                            />
                                            <Label for={`available-${r.idAircraft}`} />
                                        </FormGroup>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-400">
                                        —
                                    </td>
                                    <td>
                                        <div className="d-flex gap-2 align-items-center">
                                            <Button
                                                color="success"
                                                size="sm"
                                                onClick={() => { editAircraft(selectedAircraft.idAircraft) }}
                                            >
                                                Save
                                            </Button>
                                            <Button
                                                color="danger"
                                                size="sm"
                                                outline
                                                className="ml-2"
                                                onClick={() => { setSelectedAircraft(null); }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <tr
                                    key={r.idAircraft}
                                    className={`${styles.customRow} ${isDeleted(r) ? styles.deletedRow : "transition-colors duration-150 hover:bg-sky-100"}`}
                                    style={{ cursor: isDeleted(r) ? "default" : "pointer" }}
                                    onClick={() => {
                                        if (isDeleted(r)) return;
                                        router.push(
                                            `/tours/bookings?idAircraft=${encodeURIComponent(
                                                String(r.idAircraft)
                                            )}&period=month`
                                        );
                                    }}
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
                                    <td className="px-4 py-3 text-sm">
                                        {r.available ?
                                            <>
                                                <CheckIcon color="green" size={16} /> Yes
                                            </>
                                            : <>
                                                <XIcon color="red" size={16} /> No
                                            </>}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {hasPlannedBookings(r) ? (
                                            <>
                                                <CheckIcon color="green" size={16} /> Yes
                                            </>
                                        ) : (
                                            <>
                                                <XIcon color="red" size={16} /> No
                                            </>
                                        )}
                                    </td>
                                    <td>
                                        {!isDeleted(r) && (
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
                        {creatingAircraft && (
                            <tr className={styles.customRow}>
                                <td className="px-4 py-3 text-sm">
                                    <Input
                                        size="sm"
                                        value={creatingAircraft.aircraft}
                                        onChange={(e) =>
                                            setCreatingAircraft({ ...creatingAircraft, aircraft: e.target.value })
                                        }
                                    />
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <Input
                                        size="sm"
                                        type="number"
                                        value={creatingAircraft.capacity}
                                        onChange={(e) =>
                                            setCreatingAircraft({ ...creatingAircraft, capacity: e.target.value })
                                        }
                                    />
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <Input
                                        size="sm"
                                        value={creatingAircraft.registrationNumber}
                                        onChange={(e) =>
                                            setCreatingAircraft({
                                                ...creatingAircraft,
                                                registrationNumber: e.target.value
                                            })
                                        }
                                    />
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <FormGroup switch>
                                        <Input
                                            type="switch"
                                            checked={creatingAircraft.available}
                                            onChange={(e) =>
                                                setCreatingAircraft({
                                                    ...creatingAircraft,
                                                    available: e.target.checked
                                                })
                                            }
                                        />
                                        <Label />
                                    </FormGroup>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-400">
                                    —
                                </td>
                                <td>
                                    <div className="d-flex gap-2">
                                        <Button
                                            color="success"
                                            size="sm"
                                            disabled={
                                                !creatingAircraft.aircraft ||
                                                !creatingAircraft.capacity ||
                                                !creatingAircraft.registrationNumber
                                            }
                                            onClick={createAircraft}
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            color="danger"
                                            size="sm"
                                            outline
                                            onClick={() => setCreatingAircraft(null)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>

            <div className="d-flex justify-content-end mt-3">
                <Button
                    color="primary"
                    size="sm"
                    onClick={() =>
                        setCreatingAircraft({
                            aircraft: "",
                            capacity: "",
                            registrationNumber: "",
                            available: true
                        })
                    }
                    disabled={!!creatingAircraft || !!selectedAircraft}
                >
                    + New aircraft
                </Button>
            </div>

            {loading && hasFetchedOnce && (
                <div className="bg-white rounded-lg border p-4 text-sm text-gray-500">
                    Loading aircrafts...
                </div>
            )}

            <Modal isOpen={deleteConfirmModal.show} centered>
                <ModalHeader
                    toggle={() => setDeleteConfirmModal({ show: false, aircraft: null })}
                    style={{ backgroundColor: '#721c24', color: 'white' }}
                >
                    <span style={{ color: 'white' }}>Confirm Deletion</span>
                </ModalHeader>
                <ModalBody>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <FaExclamationCircle style={{ color: '#dc3545', fontSize: '20px', marginTop: '4px', flexShrink: 0 }} />
                        <div>
                            <p style={{ marginBottom: '8px', color: '#333', fontWeight: '600' }}>
                                Are you sure you want to delete {deleteConfirmModal.aircraft?.aircraft}?
                            </p>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter style={{ backgroundColor: '#f8f9fa' }}>
                    <Button
                        style={{ fontSize: '13px', fontWeight: '600' }}
                        color="secondary"
                        outline
                        onClick={() => setDeleteConfirmModal({ show: false, aircraft: null })}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        style={{ fontSize: '13px', fontWeight: '600' }}
                        color="danger"
                        onClick={confirmDelete}
                        disabled={loading}
                    >
                        {loading ? 'Deleting...' : 'Delete Aircraft'}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
