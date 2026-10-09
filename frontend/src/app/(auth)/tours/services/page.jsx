"use client";

import { useEffect, useState } from "react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { parseWeekdays } from "@/helpers/bookingConfig";
import { Button, Form, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Table } from "reactstrap";
import { useToast } from "@/components/ui/use-toast";
import { EditIcon, Filter, TrashIcon } from "lucide-react";
import useIsMobile from "@/hooks/useIsMobile";
import MobileFiltersModal from "@/components/ui/MobileFiltersModal";
import { FaExclamationCircle } from "react-icons/fa";
import Spinner from "@/components/ui/Spinner";
import styles from "../addons/page.module.css";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const emptyForm = {
    code: "",
    title: "",
    description: "",
    image: "",
    duration: "",
    durationMinutes: "",
    visibleToClients: true,
    minDaysAhead: 1,
    maxDaysAhead: 31,
    allowedWeekdays: [0, 1, 2, 3, 4, 5, 6],
    prices: [{ passengers: "", price: "" }],
    hours: [""],
    addons: []
};

function toForm(row) {
    if (!row) return { ...emptyForm, prices: [{ passengers: "", price: "" }], hours: [""], addons: [], allowedWeekdays: [0, 1, 2, 3, 4, 5, 6] };
    return {
        idService: row.idService,
        code: row.code || "",
        title: row.title || "",
        description: row.description || "",
        image: row.image || "",
        duration: row.duration || "",
        durationMinutes: row.durationMinutes ?? "",
        visibleToClients: row.visibleToClients === 1 || row.visibleToClients === true,
        minDaysAhead: row.minDaysAhead ?? 1,
        maxDaysAhead: row.maxDaysAhead ?? 31,
        allowedWeekdays: parseWeekdays(row.allowedWeekdays),
        prices: row.prices && row.prices.length ? row.prices.map((p) => ({ passengers: p.passengers, price: p.price })) : [{ passengers: "", price: "" }],
        hours: row.hours && row.hours.length ? row.hours.slice() : [""],
        addons: (row.addons || []).map(Number)
    };
}

export default function ServiceList() {
    const [rows, setRows] = useState([]);
    const [addons, setAddons] = useState([]);
    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
    const [error, setError] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [filters, setFilters] = useState({ code: "", title: "" });
    const [showDeleted, setShowDeleted] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const { toast } = useToast();
    const isMobile = useIsMobile();

    async function fetchRows() {
        try {
            setLoading(true);
            setError(null);
            const res = await ApiComunicator("/services/getServices?includeDeleted=1", "GET");
            setRows(res.services || []);
        } catch (err) {
            setError(err.message || "Error loading services");
            setRows([]);
        } finally {
            setLoading(false);
            setHasFetchedOnce(true);
        }
    }

    async function fetchAddons() {
        try {
            const res = await ApiComunicator("/addons", "GET");
            setAddons(res.addons || []);
        } catch (err) {
            setAddons([]);
        }
    }

    useEffect(() => {
        fetchRows();
        fetchAddons();
    }, []);

    async function save() {
        try {
            setLoading(true);
            const body = {
                ...form,
                allowedWeekdays: form.allowedWeekdays
            };
            const path = form.idService ? "/services/edit" : "/services/new";
            await ApiComunicator(path, "POST", body);
            setForm(null);
            await fetchRows();
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "Error saving service"
            });
        } finally {
            setLoading(false);
        }
    }

    async function confirmDelete() {
        try {
            setLoading(true);
            await ApiComunicator("/services/delete", "POST", { idService: pendingDelete.idService });
            setPendingDelete(null);
            await fetchRows();
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "Error deleting service"
            });
        } finally {
            setLoading(false);
        }
    }

    const visible = rows.filter((row) => {
        if (!showDeleted && row.deleted) return false;
        if (filters.code && !String(row.code || "").toLowerCase().includes(filters.code.toLowerCase())) return false;
        if (filters.title && !String(row.title || "").toLowerCase().includes(filters.title.toLowerCase())) return false;
        return true;
    });

    const updateFilter = (field, value) => setFilters((prev) => ({ ...prev, [field]: value }));
    const resetFilters = () => {
        setFilters({ code: "", title: "" });
        setShowDeleted(false);
    };
    const activeFilterCount = [filters.code, filters.title].filter(Boolean).length + (showDeleted ? 1 : 0);
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
                {isMobile ? <Label for={`${idPrefix}showDeleted`}>Show deleted</Label> : <Label className="d-block invisible">Show deleted</Label>}
                <div className="d-flex align-items-center" style={{ minHeight: "38px" }}>
                    <Input id={`${idPrefix}showDeleted`} type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />
                    {!isMobile && <Label for={`${idPrefix}showDeleted`} check className="ms-2 mb-0">Show deleted</Label>}
                </div>
            </FormGroup>
        </>
    );

    function toggleDay(day) {
        const days = form.allowedWeekdays.includes(day)
            ? form.allowedWeekdays.filter((item) => item !== day)
            : form.allowedWeekdays.concat(day);
        setForm({ ...form, allowedWeekdays: days });
    }

    function setPrice(index, field, value) {
        const prices = form.prices.map((row, i) => (i === index ? { ...row, [field]: value } : row));
        setForm({ ...form, prices });
    }

    function setHour(index, value) {
        const hours = form.hours.map((hour, i) => (i === index ? value : hour));
        setForm({ ...form, hours });
    }

    function toggleAddon(idAddon) {
        const id = Number(idAddon);
        const next = form.addons.includes(id)
            ? form.addons.filter((item) => item !== id)
            : form.addons.concat(id);
        setForm({ ...form, addons: next });
    }

    if (!hasFetchedOnce && loading) return <Spinner />;

    return (
        <div className="p-3">
            {error && <p className="text-danger">{error}</p>}

            <div className={`${styles.filtersCard} ${styles.desktopOnly}`}>
                <Form className="d-flex flex-wrap gap-3 align-items-end">{filterFields()}</Form>
            </div>

            <div className={`${styles.mobileToolbar} ${styles.mobileOnly}`}>
                <Button color="primary" outline className={styles.filtersBtn} onClick={() => setFiltersOpen(true)}>
                    <Filter size={16} />
                    Filters
                    {activeFilterCount > 0 && <span className={styles.filtersBadge}>{activeFilterCount}</span>}
                </Button>
            </div>

            <MobileFiltersModal isOpen={filtersOpen} toggle={() => setFiltersOpen(false)} onClear={resetFilters}>
                <Form>{filterFields("m-")}</Form>
            </MobileFiltersModal>

            <Table responsive>
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Title</th>
                        <th>Visible</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {visible.map((row) => (
                        <tr key={row.idService} className={row.deleted ? styles.deletedRow : ""}>
                            <td>{row.code}</td>
                            <td>{row.title}</td>
                            <td>{row.visibleToClients ? "Yes" : "No"}</td>
                            <td>
                                <Button color="primary" size="sm" outline className="me-2" onClick={() => setForm(toForm(row))}>
                                    <EditIcon size={16} /> Edit
                                </Button>
                                {!row.deleted && (
                                    <Button color="danger" size="sm" outline onClick={() => setPendingDelete(row)}>
                                        <TrashIcon size={16} /> Delete
                                    </Button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Button color="primary" size="sm" onClick={() => setForm(toForm(null))}>+ New service</Button>

            <Modal isOpen={!!form} toggle={() => setForm(null)} size="lg">
                <ModalHeader toggle={() => setForm(null)}>{form && form.idService ? "Edit service" : "New service"}</ModalHeader>
                <ModalBody>
                    {form && (
                        <>
                            <div className="row">
                                <div className="col-md-6">
                                    <FormGroup>
                                        <Label>Code</Label>
                                        <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Title</Label>
                                        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Description</Label>
                                        <Input type="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Image</Label>
                                        <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Duration</Label>
                                        <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                                    </FormGroup>
                                </div>
                                <div className="col-md-6">
                                    <FormGroup>
                                        <Label>Book from (days from today)</Label>
                                        <Input type="number" value={form.minDaysAhead} onChange={(e) => setForm({ ...form, minDaysAhead: e.target.value })} />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Book until (days from today)</Label>
                                        <Input type="number" value={form.maxDaysAhead} onChange={(e) => setForm({ ...form, maxDaysAhead: e.target.value })} />
                                    </FormGroup>
                                    <FormGroup check>
                                        <Input type="checkbox" id="visibleToClients" checked={form.visibleToClients} onChange={(e) => setForm({ ...form, visibleToClients: e.target.checked })} />
                                        <Label check for="visibleToClients">Visible to clients</Label>
                                    </FormGroup>
                                </div>
                            </div>

                            <FormGroup className="mt-2">
                                <Label>Days</Label>
                                <div className="d-flex flex-wrap gap-3">
                                    {WEEKDAYS.map((name, day) => (
                                        <FormGroup check key={name} className="mb-0">
                                            <Input type="checkbox" id={`day-${day}`} checked={form.allowedWeekdays.includes(day)} onChange={() => toggleDay(day)} />
                                            <Label check for={`day-${day}`}>{name}</Label>
                                        </FormGroup>
                                    ))}
                                </div>
                            </FormGroup>

                            <FormGroup>
                                <Label>Prices</Label>
                                {form.prices.map((row, index) => (
                                    <div className="d-flex gap-2 mb-2" key={index}>
                                        <Input type="number" placeholder="Passengers" value={row.passengers} onChange={(e) => setPrice(index, "passengers", e.target.value)} />
                                        <Input type="number" placeholder="Price" value={row.price} onChange={(e) => setPrice(index, "price", e.target.value)} />
                                    </div>
                                ))}
                                <Button size="sm" outline onClick={() => setForm({ ...form, prices: form.prices.concat({ passengers: "", price: "" }) })}>
                                    Add price
                                </Button>
                            </FormGroup>

                            <FormGroup>
                                <Label>Addons</Label>
                                <div className="d-flex flex-wrap gap-3">
                                    {addons.map((addon) => (
                                        <FormGroup check key={addon.idAddon} className="mb-0">
                                            <Input type="checkbox" id={`addon-${addon.idAddon}`} checked={form.addons.includes(Number(addon.idAddon))} onChange={() => toggleAddon(addon.idAddon)} />
                                            <Label check for={`addon-${addon.idAddon}`}>{addon.addon}</Label>
                                        </FormGroup>
                                    ))}
                                </div>
                            </FormGroup>

                            <FormGroup>
                                <Label>Hours</Label>
                                {form.hours.map((hour, index) => (
                                    <Input key={index} className="mb-2" type="time" value={hour} onChange={(e) => setHour(index, e.target.value)} />
                                ))}
                                <Button size="sm" outline onClick={() => setForm({ ...form, hours: form.hours.concat("") })}>
                                    Add hour
                                </Button>
                            </FormGroup>
                        </>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setForm(null)}>Cancel</Button>
                    <Button color="primary" onClick={save} disabled={loading}>Save</Button>
                </ModalFooter>
            </Modal>

            <Modal isOpen={!!pendingDelete} centered>
                <ModalHeader toggle={() => setPendingDelete(null)}>
                    <FaExclamationCircle className="me-2" /> Delete service
                </ModalHeader>
                <ModalBody>This hides the service from the catalog. Existing bookings stay as they are.</ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button>
                    <Button color="danger" onClick={confirmDelete}>Delete</Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
