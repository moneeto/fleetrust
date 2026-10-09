"use client";

import { useEffect, useState } from "react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { Form, FormGroup, Label, Input, Button, Table, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { useToast } from "@/components/ui/use-toast";
import { CheckIcon, EditIcon, Filter, TrashIcon, XIcon } from "lucide-react";
import { FaExclamationCircle } from "react-icons/fa";
import styles from './page.module.css';
import Spinner from "@/components/ui/Spinner";
import useIsMobile from "@/hooks/useIsMobile";
import MobileFiltersModal from "@/components/ui/MobileFiltersModal";

export default function AddonList() {
    const [addons, setAddons] = useState([]);
    const [selectedAddon, setSelectedAddon] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
    const [error, setError] = useState(null);
    const [creatingAddon, setCreatingAddon] = useState(null);
    const [deleteConfirmModal, setDeleteConfirmModal] = useState({ show: false, addon: null });
    const [showDeleted, setShowDeleted] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filters, setFilters] = useState({ addon: "", description: "", price: "", active: "all" });
    const isMobile = useIsMobile();

    const { toast } = useToast();

    async function fetchAddons() {
        try {
            setLoading(true);
            setError(null);

            const res = await ApiComunicator(`/addons?includeDeleted=1`, 'GET');

            setAddons(res.addons);
        } catch (err) {
            setError(err.message);
            setAddons([]);
        } finally {
            setLoading(false);
            setHasFetchedOnce(true);
        }
    }

    useEffect(() => {
        fetchAddons();
    }, []);

    const createAddon = async () => {
        try {
            setLoading(true);

            await ApiComunicator(`/addons/new`, "POST", creatingAddon);

            await fetchAddons();

            setCreatingAddon(null);
        } catch (error) {
            let message = "Error creating addon";
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

    const editAddon = async (id) => {
        try {
            setLoading(true)
            await ApiComunicator(`/addons/edit`, "POST", { idAddon: id, ...selectedAddon });
            await fetchAddons();
            setSelectedAddon(null);
        } catch (error) {
            let message = "An error occurred while editing addon's information. Please try again.";
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

    const openDeleteModal = (addon, e) => {
        e?.stopPropagation?.();
        setDeleteConfirmModal({ show: true, addon });
    };

    const confirmDelete = async () => {
        const { addon } = deleteConfirmModal;
        if (!addon) return;

        try {
            setLoading(true);
            const response = await ApiComunicator(`/addons/delete`, "POST", {
                idAddon: addon.idAddon
            });

            if (response.success) {
                setDeleteConfirmModal({ show: false, addon: null });
                if (selectedAddon?.idAddon === addon.idAddon) {
                    setSelectedAddon(null);
                }
                toast({
                    title: "Success",
                    description: "Addon deleted successfully"
                });
                await fetchAddons();
            }
        } catch (error) {
            let message = "An error occurred while deleting the addon.";
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

    function toggleEditAddon(addon, e) {
        e?.stopPropagation?.();
        setSelectedAddon(addon);
    }

    const renderEditFields = (addonState, setAddonState, idSuffix) => (
        <div className={styles.editFields}>
            <FormGroup className="mb-0">
                <Label for={`addon-${idSuffix}`}>Addon</Label>
                <Input
                    id={`addon-${idSuffix}`}
                    type="text"
                    value={addonState.addon}
                    onChange={(e) => setAddonState({ ...addonState, addon: e.target.value })}
                />
            </FormGroup>
            <FormGroup className="mb-0">
                <Label for={`description-${idSuffix}`}>Description</Label>
                <Input
                    id={`description-${idSuffix}`}
                    type="text"
                    value={addonState.description}
                    onChange={(e) => setAddonState({ ...addonState, description: e.target.value })}
                />
            </FormGroup>
            <FormGroup className="mb-0">
                <Label for={`price-${idSuffix}`}>Price</Label>
                <Input
                    id={`price-${idSuffix}`}
                    type="number"
                    value={addonState.price}
                    onChange={(e) => setAddonState({ ...addonState, price: e.target.value })}
                />
            </FormGroup>
            <FormGroup switch className="mb-0">
                <Input
                    type="switch"
                    id={`active-mobile-${idSuffix}`}
                    checked={!!addonState.active}
                    style={{ cursor: "pointer" }}
                    onChange={(e) => setAddonState({ ...addonState, active: e.target.checked })}
                />
                <Label for={`active-mobile-${idSuffix}`} check>
                    Active
                </Label>
            </FormGroup>
        </div>
    );

    if (!hasFetchedOnce && loading) {
        return <Spinner />
    }

    const visible = addons.filter((row) => {
        if (!showDeleted && row.deleted) return false;
        if (filters.addon && !String(row.addon || "").toLowerCase().includes(filters.addon.toLowerCase())) return false;
        if (filters.description && !String(row.description || "").toLowerCase().includes(filters.description.toLowerCase())) return false;
        if (filters.price && !String(row.price ?? "").includes(filters.price)) return false;
        if (filters.active === "yes" && !row.active) return false;
        if (filters.active === "no" && row.active) return false;
        return true;
    });
    const updateFilter = (field, value) => setFilters((prev) => ({ ...prev, [field]: value }));
    const resetFilters = () => {
        setFilters({ addon: "", description: "", price: "", active: "all" });
        setShowDeleted(false);
    };
    const activeFilterCount = [filters.addon, filters.description, filters.price].filter(Boolean).length + (filters.active !== "all" ? 1 : 0) + (showDeleted ? 1 : 0);
    const fieldMin = isMobile ? "100%" : undefined;
    const filterFields = (idPrefix = "") => (
        <>
            <FormGroup style={{ minWidth: fieldMin || "160px" }}>
                <Label for={`${idPrefix}filterAddon`}>Addon name</Label>
                <Input id={`${idPrefix}filterAddon`} value={filters.addon} onChange={(e) => updateFilter("addon", e.target.value)} />
            </FormGroup>
            <FormGroup style={{ minWidth: fieldMin || "180px" }}>
                <Label for={`${idPrefix}filterDescription`}>Description</Label>
                <Input id={`${idPrefix}filterDescription`} value={filters.description} onChange={(e) => updateFilter("description", e.target.value)} />
            </FormGroup>
            <FormGroup style={{ minWidth: fieldMin || "120px" }}>
                <Label for={`${idPrefix}filterPrice`}>Unit price</Label>
                <Input id={`${idPrefix}filterPrice`} value={filters.price} onChange={(e) => updateFilter("price", e.target.value)} />
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
                    <thead style={{ background: '#f3f4f6' }} className="border-b">
                        <tr>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                Addon Name
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                Description
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                Unit Price
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                Active
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y">
                        {visible.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-sm text-gray-500 text-center">
                                    No addons found.
                                </td>
                            </tr>
                        )}
                        {visible.map((r) =>(
                                <tr
                                    key={r.idAddon}
                                    className="transition-colors duration-150 hover:bg-sky-100"
                                    style={{ opacity: r.deleted ? 0.55 : 1 }}
                                >
                                    <td className="px-4 py-3 text-sm">
                                        {r.addon}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {r.description}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        ${r.price}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {r.active ?
                                            <>
                                                <CheckIcon color="green" size={16} /> Yes
                                            </>
                                            : <>
                                                <XIcon color="red" size={16} /> No
                                            </>}
                                    </td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <Button
                                                color="primary"
                                                size="sm"
                                                outline
                                                onClick={(e) => toggleEditAddon(r, e)}
                                            >
                                                <EditIcon size={16} /> Edit
                                            </Button>
                                            {!r.deleted && (
                                                <Button
                                                    color="danger"
                                                    size="sm"
                                                    outline
                                                    onClick={(e) => openDeleteModal(r, e)}
                                                >
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

            <div className={`${styles.mobileOnly} ${styles.cardsList}`}>
                {visible.length === 0 && !creatingAddon && (
                    <div className={styles.card}>
                        <p className="mb-0 text-sm text-gray-500 text-center">No addons found.</p>
                    </div>
                )}

                {visible.map((r) => {
                    return (
                        <div key={r.idAddon} className={styles.card}>
<>
                                    <div className={styles.cardTitle}>
                                        {r.addon}
                                    </div>
                                    <div className={styles.cardMeta}>
                                        <div>
                                            <span className={styles.cardMetaLabel}>Description</span>
                                            {r.description}
                                        </div>
                                        <div>
                                            <span className={styles.cardMetaLabel}>Price</span>
                                            ${r.price}
                                        </div>
                                    </div>
                                    <div className="mb-3 text-sm">
                                        {r.active ?
                                            <>
                                                <CheckIcon color="green" size={16} /> Active
                                            </>
                                            : <>
                                                <XIcon color="red" size={16} /> Inactive
                                            </>}
                                    </div>
                                    <div className={styles.cardActions}>
                                        <Button
                                            color="primary"
                                            size="sm"
                                            outline
                                            onClick={(e) => toggleEditAddon(r, e)}
                                        >
                                            <EditIcon size={16} /> Edit
                                        </Button>
                                        {!r.deleted && (
                                            <Button
                                                color="danger"
                                                size="sm"
                                                outline
                                                onClick={(e) => openDeleteModal(r, e)}
                                            >
                                                <TrashIcon size={16} /> Delete
                                            </Button>
                                        )}
                                    </div>
                                </>
                        </div>
                    );
                })}

            </div>

            <div className={styles.newBtnWrap}>
                <Button
                    color="primary"
                    size="sm"
                    onClick={() =>
                        setCreatingAddon({
                            addon: "",
                            description: "",
                            price: "",
                            active: true
                        })
                    }
                    disabled={!!creatingAddon || !!selectedAddon}
                >
                    + New addon
                </Button>
            </div>

            {loading && hasFetchedOnce && (
                <div className="px-3 text-sm text-gray-500">
                    Loading addons...
                </div>
            )}


            <Modal isOpen={!!creatingAddon || !!selectedAddon} centered size="lg" toggle={() => { setCreatingAddon(null); setSelectedAddon(null); }}>
                <ModalHeader toggle={() => { setCreatingAddon(null); setSelectedAddon(null); }}>
                    {creatingAddon ? "New addon" : "Edit addon"}
                </ModalHeader>
                <ModalBody>
                    {creatingAddon
                        ? renderEditFields(creatingAddon, setCreatingAddon, "new")
                        : selectedAddon && renderEditFields(selectedAddon, setSelectedAddon, selectedAddon.idAddon)}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={() => { setCreatingAddon(null); setSelectedAddon(null); }}>
                        Cancel
                    </Button>
                    <Button
                        color="success"
                        disabled={creatingAddon ? !creatingAddon.addon || !creatingAddon.price : !selectedAddon}
                        onClick={creatingAddon ? createAddon : () => editAddon(selectedAddon.idAddon)}
                    >
                        Save
                    </Button>
                </ModalFooter>
            </Modal>

            <Modal isOpen={deleteConfirmModal.show} centered>
                <ModalHeader
                    toggle={() => setDeleteConfirmModal({ show: false, addon: null })}
                    style={{ backgroundColor: '#721c24', color: 'white' }}
                >
                    <span style={{ color: 'white' }}>Confirm Deletion</span>
                </ModalHeader>
                <ModalBody>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <FaExclamationCircle style={{ color: '#dc3545', fontSize: '20px', marginTop: '4px', flexShrink: 0 }} />
                        <div>
                            <p style={{ marginBottom: '8px', color: '#333', fontWeight: '600' }}>
                                Are you sure you want to delete {deleteConfirmModal.addon?.addon}?
                            </p>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter style={{ backgroundColor: '#f8f9fa' }}>
                    <Button
                        style={{ fontSize: '13px', fontWeight: '600' }}
                        color="secondary"
                        outline
                        onClick={() => setDeleteConfirmModal({ show: false, addon: null })}
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
                        {loading ? 'Deleting...' : 'Delete Addon'}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
