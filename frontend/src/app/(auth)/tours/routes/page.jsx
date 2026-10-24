"use client";

import { useEffect, useState } from "react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { parseWeekdays } from "@/helpers/bookingConfig";
import { Button, Form, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Table } from "reactstrap";
import { useToast } from "@/components/ui/use-toast";
import { EditIcon, Filter, TrashIcon } from "lucide-react";
import useIsMobile from "@/hooks/useIsMobile";
import MobileFiltersModal from "@/components/ui/MobileFiltersModal";
import MessageModal from "@/components/ui/MessageModal";
import Spinner from "@/components/ui/Spinner";
import styles from "@/components/ui/listing.module.css";

const emptyForm = {
    code: "",
    title: "",
    description: "",
    value2: "",
    value3: "",
    image: "",
    mapImage: "",
    duration: "",
    durationMinutes: "",
    visibleToClients: true,
    minDaysAhead: 1,
    maxDaysAhead: 31,
    allowedWeekdays: "0,1,2,3,4,5,6"
};

function toForm(row) {
    if (!row) return { ...emptyForm };
    return {
        ...row,
        description: row.description || "",
        value2: row.value2 ?? "",
        value3: row.value3 ?? "",
        image: row.image || "",
        mapImage: row.mapImage || "",
        duration: row.duration || "",
        durationMinutes: row.durationMinutes ?? "",
        visibleToClients: !!row.visibleToClients,
        allowedWeekdays: parseWeekdays(row.allowedWeekdays).join(",")
    };
}

function RouteFields({ form, setForm }) {
    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
    return (
        <>
            <FormGroup>
                <Label>Code</Label>
                <Input value={form.code} onChange={set("code")} />
            </FormGroup>
            <FormGroup>
                <Label>Title</Label>
                <Input value={form.title} onChange={set("title")} />
            </FormGroup>
            <FormGroup>
                <Label>Description</Label>
                <Input type="textarea" value={form.description} onChange={set("description")} />
            </FormGroup>
            <FormGroup>
                <Label>Price 2 passengers</Label>
                <Input type="number" value={form.value2} onChange={set("value2")} />
            </FormGroup>
            <FormGroup>
                <Label>Price 3 passengers</Label>
                <Input type="number" value={form.value3} onChange={set("value3")} />
            </FormGroup>
            <FormGroup>
                <Label>Duration</Label>
                <Input value={form.duration} onChange={set("duration")} />
            </FormGroup>
            <FormGroup>
                <Label>Duration minutes</Label>
                <Input type="number" value={form.durationMinutes} onChange={set("durationMinutes")} />
            </FormGroup>
            <FormGroup>
                <Label>Image</Label>
                <Input value={form.image} onChange={set("image")} />
            </FormGroup>
            <FormGroup>
                <Label>Map image</Label>
                <Input value={form.mapImage} onChange={set("mapImage")} />
            </FormGroup>
            <FormGroup>
                <Label>Min days ahead</Label>
                <Input type="number" value={form.minDaysAhead} onChange={set("minDaysAhead")} />
            </FormGroup>
            <FormGroup>
                <Label>Max days ahead</Label>
                <Input type="number" value={form.maxDaysAhead} onChange={set("maxDaysAhead")} />
            </FormGroup>
            <FormGroup>
                <Label>Allowed weekdays</Label>
                <Input value={form.allowedWeekdays} onChange={set("allowedWeekdays")} />
            </FormGroup>
            <FormGroup switch>
                <Input
                    type="switch"
                    checked={!!form.visibleToClients}
                    onChange={(e) => setForm({ ...form, visibleToClients: e.target.checked })}
                />
                <Label check>Visible to clients</Label>
            </FormGroup>
        </>
    );
}

export default function RouteList() {
    const [rows, setRows] = useState([]);
    const [form, setForm] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
    const [error, setError] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [filters, setFilters] = useState({ code: "", title: "", duration: "", visible: "all" });
    const [showDeleted, setShowDeleted] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const { toast } = useToast();
    const isMobile = useIsMobile();

    async function fetchRows() {
        try {
            setLoading(true);
            setError(null);
            const res = await ApiComunicator("/routes/getRoutes?includeDeleted=1", "GET");
            setRows(res.routes || []);
        } catch (err) {
            setError(err.message || "Error loading routes");
            setRows([]);
        } finally {
            setLoading(false);
            setHasFetchedOnce(true);
        }
    }

    useEffect(() => {
        fetchRows();
    }, []);

    async function save() {
        try {
            setLoading(true);
            const body = {
                ...form,
                allowedWeekdays: parseWeekdays(form.allowedWeekdays)
            };
            const path = form.idRoute ? "/routes/edit" : "/routes/new";
            await ApiComunicator(path, "POST", body);
            setFormOpen(false);
            await fetchRows();
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "Error saving route"
            });
        } finally {
            setLoading(false);
        }
    }

    async function confirmDelete() {
        try {
            setLoading(true);
            await ApiComunicator("/routes/delete", "POST", { idRoute: pendingDelete.idRoute });
            setPendingDelete(null);
            await fetchRows();
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "Error deleting route"
            });
        } finally {
            setLoading(false);
        }
    }

    const visible = rows.filter((row) => {
        if (!showDeleted && row.deleted) return false;
        if (filters.code && !String(row.code || "").toLowerCase().includes(filters.code.toLowerCase())) return false;
        if (filters.title && !String(row.title || "").toLowerCase().includes(filters.title.toLowerCase())) return false;
        if (filters.duration && !String(row.duration || "").toLowerCase().includes(filters.duration.toLowerCase())) return false;
        if (filters.visible === "yes" && !row.visibleToClients) return false;
        if (filters.visible === "no" && row.visibleToClients) return false;
        return true;
    });

    const updateFilter = (field, value) => setFilters((prev) => ({ ...prev, [field]: value }));
    const resetFilters = () => {
        setFilters({ code: "", title: "", duration: "", visible: "all" });
        setShowDeleted(false);
    };
    const activeFilterCount = [filters.code, filters.title, filters.duration].filter(Boolean).length + (filters.visible !== "all" ? 1 : 0) + (showDeleted ? 1 : 0);
    const fieldMin = isMobile ? "100%" : undefined;

    const filterFields = (idPrefix = "") => (
        <>
            <FormGroup style={{ minWidth: fieldMin || "120px" }}>
                <Label for={`${idPrefix}filterCode`}>Code</Label>
                <Input id={`${idPrefix}filterCode`} value={filters.code} onChange={(e) => updateFilter("code", e.target.value)} />
            </FormGroup>
            <FormGroup style={{ minWidth: fieldMin || "180px" }}>
                <Label for={`${idPrefix}filterTitle`}>Title</Label>
                <Input id={`${idPrefix}filterTitle`} value={filters.title} onChange={(e) => updateFilter("title", e.target.value)} />
            </FormGroup>
            <FormGroup style={{ minWidth: fieldMin || "140px" }}>
                <Label for={`${idPrefix}filterDuration`}>Duration</Label>
                <Input id={`${idPrefix}filterDuration`} value={filters.duration} onChange={(e) => updateFilter("duration", e.target.value)} />
            </FormGroup>
            <FormGroup style={{ minWidth: fieldMin || "140px" }}>
                <Label for={`${idPrefix}filterVisible`}>Visible</Label>
                <Input id={`${idPrefix}filterVisible`} type="select" value={filters.visible} onChange={(e) => updateFilter("visible", e.target.value)}>
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

    if (!hasFetchedOnce && loading) return <Spinner />;

    return (
        <div className={styles.page}>
            {error && <p className="text-sm text-red-600 px-3">{error}</p>}

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

            <div className={styles.tableCard}>
                <Table>
                    <thead style={{ background: "#f3f4f6" }} className="border-b">
                        <tr>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">Code</th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">Title</th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">Duration</th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">Visible</th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {visible.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-sm text-gray-500 text-center">No routes found.</td>
                            </tr>
                        )}
                        {visible.map((row) => (
                            <tr key={row.idRoute} className={row.deleted ? styles.deletedRow : ""}>
                                <td className="px-4 py-3 text-sm">{row.code}</td>
                                <td className="px-4 py-3 text-sm">{row.title}</td>
                                <td className="px-4 py-3 text-sm">{row.duration}</td>
                                <td className="px-4 py-3 text-sm">{row.visibleToClients ? "Yes" : "No"}</td>
                                <td>
                                    <div className="d-flex gap-2">
                                        <Button color="primary" size="sm" outline onClick={() => { setForm(toForm(row)); setFormOpen(true); }}>
                                            <EditIcon size={16} /> Edit
                                        </Button>
                                        <Button color="danger" size="sm" outline onClick={() => setPendingDelete(row)}>
                                            <TrashIcon size={16} /> Delete
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            <div className={styles.newBtnWrap}>
                <Button color="primary" size="sm" onClick={() => { setForm({ ...emptyForm }); setFormOpen(true); }} disabled={formOpen}>
                    + New route
                </Button>
            </div>

            <Modal isOpen={formOpen} centered toggle={() => setFormOpen(false)} onClosed={() => { if (!formOpen) setForm(null); }}>
                <ModalHeader toggle={() => setFormOpen(false)}>
                    {form?.idRoute ? "Edit route" : "New route"}
                </ModalHeader>
                <ModalBody>
                    {form && <RouteFields form={form} setForm={setForm} />}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={() => setFormOpen(false)}>Cancel</Button>
                    <Button color="success" onClick={save} disabled={!form?.code || !form?.title || loading}>
                        Save
                    </Button>
                </ModalFooter>
            </Modal>

            <MessageModal
                isOpen={!!pendingDelete}
                type="confirm"
                title="Confirm deletion"
                confirmLabel="Delete"
                confirmColor="danger"
                disabled={loading}
                onClose={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
            >
                Are you sure you want to delete {pendingDelete?.title}?
            </MessageModal>
        </div>
    );
}
