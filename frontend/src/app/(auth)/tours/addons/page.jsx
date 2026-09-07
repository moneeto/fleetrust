"use client";

import { useEffect, useState } from "react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { FormGroup, Label, Input, Button, Table, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { useToast } from "@/components/ui/use-toast";
import { CheckIcon, EditIcon, TrashIcon, XIcon } from "lucide-react";
import { FaExclamationCircle } from "react-icons/fa";
import styles from './page.module.css';
import Spinner from "@/components/ui/Spinner";

export default function AddonList() {
    const [addons, setAddons] = useState([]);
    const [selectedAddon, setSelectedAddon] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
    const [error, setError] = useState(null);
    const [creatingAddon, setCreatingAddon] = useState(null);
    const [deleteConfirmModal, setDeleteConfirmModal] = useState({ show: false, addon: null });

    const { toast } = useToast();

    async function fetchAddons() {
        try {
            setLoading(true);
            setError(null);

            const res = await ApiComunicator(`/addons`, 'GET');

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

    return (
        <div className={styles.page}>
            {error && (
                <p className="text-sm text-red-600 px-3">
                    {error}
                </p>
            )}

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
                        {addons.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-sm text-gray-500 text-center">
                                    No addons found.
                                </td>
                            </tr>
                        )}
                        {addons.map((r) =>
                            (selectedAddon && selectedAddon.idAddon === r.idAddon) ? (
                                <tr key={r.idAddon}>
                                    <td className="px-4 py-3 text-sm">
                                        <Input
                                            type="text"
                                            size="sm"
                                            defaultValue={selectedAddon.addon}
                                            onChange={(e) => setSelectedAddon({ ...selectedAddon, addon: e.target.value })}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <Input
                                            type="text"
                                            size="sm"
                                            defaultValue={selectedAddon.description}
                                            onChange={(e) => setSelectedAddon({ ...selectedAddon, description: e.target.value })}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <Input
                                            size="sm"
                                            type="number"
                                            defaultValue={selectedAddon.price}
                                            onChange={(e) => setSelectedAddon({ ...selectedAddon, price: e.target.value })}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <FormGroup switch>
                                            <Input
                                                type="switch"
                                                id={`active-${r.idAddon}`}
                                                checked={selectedAddon.active}
                                                style={{ cursor: 'pointer' }}
                                                onChange={(e) => setSelectedAddon({ ...selectedAddon, active: e.target.checked })}
                                            />
                                            <Label for={`active-${r.idAddon}`} />
                                        </FormGroup>
                                    </td>
                                    <td>
                                        <div className="d-flex gap-2 align-items-center">
                                            <Button
                                                color="success"
                                                size="sm"
                                                onClick={() => { editAddon(selectedAddon.idAddon) }}
                                            >
                                                Save
                                            </Button>
                                            <Button
                                                color="danger"
                                                size="sm"
                                                outline
                                                className="ml-2"
                                                onClick={() => { setSelectedAddon(null); }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <tr
                                    key={r.idAddon}
                                    className="transition-colors duration-150 hover:bg-sky-100"
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
                                            <Button
                                                color="danger"
                                                size="sm"
                                                outline
                                                onClick={(e) => openDeleteModal(r, e)}
                                            >
                                                <TrashIcon size={16} /> Delete
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        {creatingAddon && (
                            <tr>
                                <td className="px-4 py-3 text-sm">
                                    <Input
                                        size="sm"
                                        value={creatingAddon.addon}
                                        onChange={(e) =>
                                            setCreatingAddon({ ...creatingAddon, addon: e.target.value })
                                        }
                                    />
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <Input
                                        size="sm"
                                        value={creatingAddon.description}
                                        onChange={(e) =>
                                            setCreatingAddon({ ...creatingAddon, description: e.target.value })
                                        }
                                    />
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <Input
                                        size="sm"
                                        type="number"
                                        value={creatingAddon.price}
                                        onChange={(e) =>
                                            setCreatingAddon({ ...creatingAddon, price: e.target.value })
                                        }
                                    />
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <FormGroup switch>
                                        <Input
                                            type="switch"
                                            checked={creatingAddon.active}
                                            onChange={(e) =>
                                                setCreatingAddon({
                                                    ...creatingAddon,
                                                    active: e.target.checked
                                                })
                                            }
                                        />
                                        <Label />
                                    </FormGroup>
                                </td>
                                <td>
                                    <div className="d-flex gap-2">
                                        <Button
                                            color="success"
                                            size="sm"
                                            disabled={
                                                !creatingAddon.addon ||
                                                !creatingAddon.price
                                            }
                                            onClick={createAddon}
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            color="danger"
                                            size="sm"
                                            outline
                                            onClick={() => setCreatingAddon(null)}
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

            <div className={`${styles.mobileOnly} ${styles.cardsList}`}>
                {addons.length === 0 && !creatingAddon && (
                    <div className={styles.card}>
                        <p className="mb-0 text-sm text-gray-500 text-center">No addons found.</p>
                    </div>
                )}

                {addons.map((r) => {
                    const editing = selectedAddon && selectedAddon.idAddon === r.idAddon;
                    return (
                        <div key={r.idAddon} className={styles.card}>
                            {editing ? (
                                <>
                                    {renderEditFields(selectedAddon, setSelectedAddon, r.idAddon)}
                                    <div className={`${styles.cardActions} mt-3`}>
                                        <Button
                                            color="success"
                                            size="sm"
                                            onClick={() => editAddon(selectedAddon.idAddon)}
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            color="danger"
                                            size="sm"
                                            outline
                                            onClick={() => setSelectedAddon(null)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </>
                            ) : (
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
                                        <Button
                                            color="danger"
                                            size="sm"
                                            outline
                                            onClick={(e) => openDeleteModal(r, e)}
                                        >
                                            <TrashIcon size={16} /> Delete
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}

                {creatingAddon && (
                    <div className={styles.card}>
                        <p className="fw-semibold mb-3">New addon</p>
                        {renderEditFields(creatingAddon, setCreatingAddon, "new")}
                        <div className={`${styles.cardActions} mt-3`}>
                            <Button
                                color="success"
                                size="sm"
                                disabled={
                                    !creatingAddon.addon ||
                                    !creatingAddon.price
                                }
                                onClick={createAddon}
                            >
                                Save
                            </Button>
                            <Button
                                color="danger"
                                size="sm"
                                outline
                                onClick={() => setCreatingAddon(null)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
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
