"use client";

import { useEffect, useState } from "react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { Button, Form, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Table } from "reactstrap";
import { useToast } from "@/components/ui/use-toast";
import { Check, EditIcon, Filter, TrashIcon } from "lucide-react";
import useIsMobile from "@/hooks/useIsMobile";
import MobileFiltersModal from "@/components/ui/MobileFiltersModal";
import MessageModal from "@/components/ui/MessageModal";
import Spinner from "@/components/ui/Spinner";
import styles from "@/components/ui/listing.module.css";
import form_ from "./services.module.css";

const STEPS = ["Service", "Prices", "Advance"];

const ADVANCE = [
    { label: "No advance", days: 0 },
    { label: "At least one day", days: 1 },
    { label: "At least one week", days: 7 },
    { label: "At least one month", days: 30 }
];

function money(amount) {
    const n = Math.round(amount * 100) / 100;
    return `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

function durationLabel(minutes) {
    const n = Number(minutes);
    if (!Number.isInteger(n) || n <= 0) return "—";
    return `${n} min`;
}

function priceRange(prices) {
    const each = [];
    for (const row of prices || []) {
        const passengers = Number(row.passengers);
        const price = Number(row.price);
        if (!(passengers > 0) || !Number.isFinite(price)) continue;
        each.push(Math.round((price / passengers) * 100) / 100);
    }
    if (!each.length) return "—";
    const low = Math.min(...each);
    const high = Math.max(...each);
    return low === high ? money(low) : `${money(low)} – ${money(high)}`;
}

function advanceLabel(days) {
    if (days == null || days === "") return "—";
    const n = Number(days);
    if (!Number.isFinite(n)) return "—";
    const preset = ADVANCE.find((item) => item.days === n);
    return preset ? preset.label : `${n} days`;
}

function serviceFacts(row) {
    return [
        ["Duration", durationLabel(row.durationMinutes)],
        ["Price / person", priceRange(row.prices)],
        ["Advance", advanceLabel(row.minDaysAhead)]
    ];
}

const emptyForm = {
    title: "",
    description: "",
    image: "",
    duration: "",
    durationMinutes: "",
    visibleToClients: true,
    minDaysAhead: 1,
    maxDaysAhead: 31,
    prices: [{ passengers: "", price: "" }],
    addons: []
};

function toForm(row) {
    if (!row) return { ...emptyForm, prices: [{ passengers: "", price: "" }], addons: [] };
    return {
        idService: row.idService,
        title: row.title || "",
        description: row.description || "",
        image: row.image || "",
        duration: row.duration || "",
        durationMinutes: row.durationMinutes ?? "",
        visibleToClients: row.visibleToClients === 1 || row.visibleToClients === true,
        minDaysAhead: row.minDaysAhead ?? 1,
        maxDaysAhead: row.maxDaysAhead ?? 31,
        prices: row.prices && row.prices.length ? row.prices.map((p) => ({ passengers: p.passengers, price: p.price })) : [{ passengers: "", price: "" }],
        addons: (row.addons || []).map(Number)
    };
}

export default function ServiceList() {
    const [rows, setRows] = useState([]);
    const [addons, setAddons] = useState([]);
    const [form, setForm] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
    const [error, setError] = useState(null);
    const [step, setStep] = useState(0);
    const [advanceCustom, setAdvanceCustom] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [result, setResult] = useState(null);
    const [filters, setFilters] = useState({ title: "" });
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
        const title = String(form.title || "").trim();
        const minutes = Number(form.durationMinutes);
        if (!title || title.length > 32 || !Number.isInteger(minutes) || minutes <= 0) {
            setStep(0);
            toast({ variant: "destructive", title: "Missing data", description: "Title (max 32 characters) and duration are required." });
            return;
        }
        try {
            setLoading(true);
            const body = { ...form };
            const path = form.idService ? "/services/edit" : "/services/new";
            await ApiComunicator(path, "POST", body);
            await fetchRows();
            setResult({ ok: true });
        } catch (err) {
            const message = typeof err === "string" ? err : (err && err.message) || "Error saving service";
            setResult({ ok: false, message });
        } finally {
            setLoading(false);
        }
    }

    function closeForm() {
        setFormOpen(false);
    }

    function closeResult() {
        if (result && result.ok) closeForm();
        setResult(null);
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
        if (filters.title && !String(row.title || "").toLowerCase().includes(filters.title.toLowerCase())) return false;
        return true;
    });

    const updateFilter = (field, value) => setFilters((prev) => ({ ...prev, [field]: value }));
    const resetFilters = () => {
        setFilters({ title: "" });
        setShowDeleted(false);
    };
    const activeFilterCount = (filters.title ? 1 : 0) + (showDeleted ? 1 : 0);
    const fieldMin = isMobile ? "100%" : undefined;

    const filterFields = (idPrefix = "") => (
        <>
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

    function setPrice(index, field, value) {
        const prices = form.prices.map((row, i) => (i === index ? { ...row, [field]: value } : row));
        setForm({ ...form, prices });
    }

    function openForm(row) {
        const next = toForm(row);
        setStep(0);
        setAdvanceCustom(!ADVANCE.some((preset) => preset.days === Number(next.minDaysAhead)));
        setForm(next);
        setFormOpen(true);
    }

    function openStep(index) {
        setStep(index);
    }

    function setDuration(value) {
        setForm({ ...form, durationMinutes: value });
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
        <div className={styles.page}>
            <div className={styles.pageActions}>
                <Button color="primary" size="sm" onClick={() => openForm(null)}>+ New service</Button>
            </div>

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

            <MobileFiltersModal isOpen={filtersOpen} toggle={() => setFiltersOpen(false)} onApply={() => setFiltersOpen(false)} onReset={resetFilters}>
                <Form>{filterFields("m-")}</Form>
            </MobileFiltersModal>

            <div className={`${styles.tableCard} ${styles.desktopOnly}`}>
            <Table>
                <thead>
                    <tr>
                        <th>Title</th>
                        {serviceFacts({}).map(([label]) => <th key={label}>{label}</th>)}
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {visible.map((row) => (
                        <tr key={row.idService} className={row.deleted ? styles.deletedRow : ""}>
                            <td>{row.title}</td>
                            {serviceFacts(row).map(([label, value]) => <td key={label} style={{ whiteSpace: "nowrap" }}>{value}</td>)}
                            <td>
                                <Button color="primary" size="sm" outline className="me-2" onClick={() => openForm(row)}>
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
            </div>

            <div className={`${styles.cardsList} ${styles.mobileOnly}`}>
                {visible.length === 0 && (
                    <div className={styles.emptyCard}>
                        <p className="mb-0 text-sm text-gray-500">No services found.</p>
                    </div>
                )}
                {visible.map((row) => (
                    <div key={row.idService} className={`${styles.card} ${row.deleted ? styles.cardDeleted : ""}`}>
                        <div className={styles.cardHead}>
                            <h3 className={styles.cardTitle}>{row.title}</h3>
                            <span className={`${styles.badge} ${row.visibleToClients ? styles.badgeOk : styles.badgeNo}`}>{row.visibleToClients ? "Visible" : "Hidden"}</span>
                        </div>
                        <div className={styles.cardMeta}>
                            {serviceFacts(row).map(([label, value]) => (
                                <div key={label} className={label === "Hours" || label === "Advance" ? styles.cardMetaFull : ""}>
                                    <span className={styles.cardMetaLabel}>{label}</span>
                                    {value}
                                </div>
                            ))}
                        </div>
                        <div className={styles.cardActions}>
                            <Button color="primary" size="sm" outline onClick={() => openForm(row)}>
                                <EditIcon size={16} /> Edit
                            </Button>
                            {!row.deleted && (
                                <Button color="danger" size="sm" outline onClick={() => setPendingDelete(row)}>
                                    <TrashIcon size={16} /> Delete
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={formOpen} toggle={closeForm} onClosed={() => { if (!formOpen) setForm(null); }} size="lg" centered>
                <ModalHeader toggle={closeForm}>{form && form.idService ? "Edit service" : "New service"}</ModalHeader>
                <ModalBody className="px-4 py-4">
                    {form && (
                        <>
                            <div className={form_.stepper}>
                                {STEPS.map((name, index) => (
                                    <button
                                        type="button"
                                        key={name}
                                        className={`${form_.step} ${index === step ? form_.stepActive : ""} ${index < step ? form_.stepDone : ""}`}
                                        onClick={() => openStep(index)}
                                    >
                                        <span className={form_.circle}>{index < step ? <Check size={16} /> : index + 1}</span>
                                        {name}
                                    </button>
                                ))}
                            </div>

                            {step === 0 && (
                                <>
                                    <div className={form_.title}>Service details</div>
                                    <div className={form_.subtitle}>General settings of the service.</div>
                                    <FormGroup>
                                        <Label>Title</Label>
                                        <Input maxLength={32} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Description</Label>
                                        <Input type="textarea" rows={7} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Duration in minutes</Label>
                                        <Input type="number" min="1" step="1" placeholder="60" style={{ maxWidth: "200px" }} value={form.durationMinutes} onChange={(e) => setDuration(e.target.value)} />
                                        <small className="text-muted">Each booking lasts this long. The next one can start when it ends.</small>
                                    </FormGroup>
                                    
                                    {addons && addons.length > 0 && 
                                    <FormGroup>
                                        <Label>Addons included w/service</Label>
                                        <div className="d-flex flex-wrap gap-2">
                                            {addons.map((addon) => (
                                                <button
                                                    type="button"
                                                    key={addon.idAddon}
                                                    className={`${form_.chip} ${form.addons.includes(Number(addon.idAddon)) ? form_.chipOn : ""}`}
                                                    aria-pressed={form.addons.includes(Number(addon.idAddon))}
                                                    onClick={() => toggleAddon(addon.idAddon)}
                                                >
                                                    {addon.addon}
                                                </button>
                                            ))}
                                        </div>
                                    </FormGroup>}
                                    
                                </>
                            )}

                            {step === 1 && (
                                <>
                                    <div className={form_.title}>Prices</div>
                                    <div className={form_.subtitle}>Total price per passengers. (without addons)</div>
                                    {/* <p className={form_.hint}>For an internal service, such as a manual booking or holding the aircraft for maintenance, you can leave the price empty.</p> */}
                                    {form.prices.map((row, index) => (
                                        <div className={form_.priceRow} key={index}>
                                            <Input type="number" min="1" placeholder="Passengers" value={row.passengers} onChange={(e) => setPrice(index, "passengers", e.target.value)} />
                                            <Input type="number" min="0" placeholder="Price" value={row.price} onChange={(e) => setPrice(index, "price", e.target.value)} />
                                            <Button color="danger" outline disabled={form.prices.length === 1} onClick={() => setForm({ ...form, prices: form.prices.filter((_, i) => i !== index) })}>
                                                <TrashIcon size={16} />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button size="sm" outline onClick={() => setForm({ ...form, prices: form.prices.concat({ passengers: "", price: "" }) })}>
                                        + Add price
                                    </Button>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <div className={form_.title}>Advance</div>
                                    <div className={form_.subtitle}>How early customers can book this service. Opening hours are set in Availability.</div>
                                    <FormGroup>
                                        <Label>Days in advance to book</Label>
                                        <div className={form_.advanceRow}>
                                            {ADVANCE.map((preset) => (
                                                <button
                                                    type="button"
                                                    key={preset.label}
                                                    className={`${form_.preset} ${!advanceCustom && Number(form.minDaysAhead) === preset.days ? form_.presetOn : ""}`}
                                                    onClick={() => {
                                                        setAdvanceCustom(false);
                                                        setForm({ ...form, minDaysAhead: preset.days });
                                                    }}
                                                >
                                                    {preset.label}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                className={`${form_.preset} ${advanceCustom ? form_.presetOn : ""}`}
                                                onClick={() => setAdvanceCustom(true)}
                                            >
                                                Custom
                                            </button>
                                        </div>
                                        {advanceCustom && (
                                            <Input className="mt-2" type="number" min="0" style={{ maxWidth: "160px" }} placeholder="Days" value={form.minDaysAhead} onChange={(e) => setForm({ ...form, minDaysAhead: e.target.value })} />
                                        )}
                                    </FormGroup>
                                </>
                            )}
                        </>
                    )}
                </ModalBody>
                <ModalFooter className="d-flex justify-content-between">
                    <div>
                        {step > 0 && <Button color="primary" outline onClick={() => openStep(step - 1)}>Back</Button>}
                    </div>
                    <div className="d-flex gap-2">
                        <Button color="danger" onClick={closeForm}>Cancel</Button>
                        {step < STEPS.length - 1
                            ? <Button color="primary" onClick={() => openStep(step + 1)}>Next</Button>
                            : <Button color="primary" onClick={save} disabled={loading}>Save</Button>}
                    </div>
                </ModalFooter>
            </Modal>

            <MessageModal
                isOpen={!!result}
                type={result && result.ok ? "success" : "error"}
                title={result && result.ok ? "Service saved" : "Could not save"}
                onClose={closeResult}
            >
                {result && result.ok ? "The service was saved." : result && result.message}
            </MessageModal>

            <MessageModal
                isOpen={!!pendingDelete}
                type="confirm"
                title="Delete service"
                confirmLabel="Delete"
                confirmColor="danger"
                disabled={loading}
                onClose={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
            >
                This hides the service from the catalog. Existing bookings stay as they are.
            </MessageModal>
        </div>
    );
}
