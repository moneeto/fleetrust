"use client";

import { useEffect, useState } from "react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { parseWeekdays } from "@/helpers/bookingConfig";
import { Button, Form, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Table } from "reactstrap";
import { useToast } from "@/components/ui/use-toast";
import { Check, EditIcon, Filter, TrashIcon } from "lucide-react";
import useIsMobile from "@/hooks/useIsMobile";
import MobileFiltersModal from "@/components/ui/MobileFiltersModal";
import MessageModal from "@/components/ui/MessageModal";
import Spinner from "@/components/ui/Spinner";
import styles from "@/components/ui/listing.module.css";
import form_ from "./services.module.css";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const STEPS = ["Service", "Prices", "Days and hours"];

function toMinutes(time) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function toTime(minutes) {
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function hourLabel(time) {
    const [h, m] = time.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function clockOptions(minutes) {
    const start = (9 * 60) % minutes;
    const list = [];
    for (let m = start; m < 24 * 60; m += minutes) list.push(toTime(m));
    return list;
}

function slots(from, to, minutes) {
    const list = [];
    const start = toMinutes(from);
    const end = toMinutes(to);
    for (let m = start; minutes > 0 && m + minutes <= end; m += minutes) list.push(toTime(m));
    return list;
}

function nearest(options, time) {
    if (!options.length) return time;
    if (options.includes(time)) return time;
    const target = toMinutes(time);
    return options.reduce((best, item) => (
        Math.abs(toMinutes(item) - target) < Math.abs(toMinutes(best) - target) ? item : best
    ));
}

function sameDays(a, b) {
    const left = a.slice().sort();
    const right = b.slice().sort();
    return left.length === right.length && left.every((day, index) => day === right[index]);
}

const DAY_PRESETS = [
    { label: "Weekdays", days: [1, 2, 3, 4, 5] },
    { label: "Weekdays + Saturday", days: [1, 2, 3, 4, 5, 6] },
    { label: "All days", days: [0, 1, 2, 3, 4, 5, 6] },
    { label: "Weekends", days: [0, 6] }
];

const ADVANCE = [
    { label: "No advance", days: 0 },
    { label: "At least one day", days: 1 },
    { label: "At least one week", days: 7 },
    { label: "At least one month", days: 30 }
];

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
    hours: [],
    addons: []
};

function toForm(row) {
    if (!row) return { ...emptyForm, prices: [{ passengers: "", price: "" }], hours: [], addons: [], allowedWeekdays: [0, 1, 2, 3, 4, 5, 6] };
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
        hours: (row.hours || []).map((h) => String(h).slice(0, 5)),
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
    const [rangeFrom, setRangeFrom] = useState("09:00");
    const [rangeTo, setRangeTo] = useState("17:00");
    const [pendingDelete, setPendingDelete] = useState(null);
    const [result, setResult] = useState(null);
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
        const code = String(form.code || "").trim();
        const title = String(form.title || "").trim();
        const minutes = Number(form.durationMinutes);
        const duplicate = rows.some((row) => (
            String(row.code || "").trim().toLowerCase() === code.toLowerCase()
            && Number(row.idService) !== Number(form.idService || 0)
        ));
        if (!code || !title || title.length > 32 || !Number.isInteger(minutes) || minutes <= 0) {
            setStep(0);
            toast({ variant: "destructive", title: "Missing data", description: "Code, title (max 32 characters) and duration are required." });
            return;
        }
        if (duplicate) {
            setStep(0);
            toast({ variant: "destructive", title: "Code already used", description: "Another service already has this code." });
            return;
        }
        if (!form.allowedWeekdays.length || !form.hours.length) {
            setStep(2);
            toast({ variant: "destructive", title: "Missing data", description: "Days of service and hours of service are required." });
            return;
        }
        try {
            setLoading(true);
            const body = {
                ...form,
                allowedWeekdays: form.allowedWeekdays
            };
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

    function openForm(row) {
        const next = toForm(row);
        setStep(0);
        setAdvanceCustom(!ADVANCE.some((preset) => preset.days === Number(next.minDaysAhead)));
        setRangeFrom("09:00");
        setRangeTo("17:00");
        setForm(next);
        setFormOpen(true);
    }

    function openStep(index) {
        const minutes = Number(form.durationMinutes);
        if (index === 2 && minutes > 0) {
            const options = clockOptions(minutes);
            const from = nearest(options, rangeFrom);
            const to = nearest(options, rangeTo);
            setRangeFrom(from);
            setRangeTo(to);
            if (form.hours.length === 0) setForm({ ...form, hours: slots(from, to, minutes) });
        }
        setStep(index);
    }

    function changeRange(from, to) {
        setRangeFrom(from);
        setRangeTo(to);
        const minutes = Number(form.durationMinutes);
        if (minutes > 0) setForm({ ...form, hours: slots(from, to, minutes) });
    }

    function setDuration(value) {
        const minutes = Number(value);
        const next = { ...form, durationMinutes: value };
        if (Number.isInteger(minutes) && minutes > 0 && (step === 2 || form.hours.length > 0)) {
            const options = clockOptions(minutes);
            const from = nearest(options, rangeFrom);
            const to = nearest(options, rangeTo);
            setRangeFrom(from);
            setRangeTo(to);
            next.hours = slots(from, to, minutes);
        }
        setForm(next);
    }

    function addRange() {
        const minutes = Number(form.durationMinutes);
        const from = toMinutes(rangeFrom);
        const to = toMinutes(rangeTo);
        const hours = form.hours.slice();
        for (let m = from; minutes > 0 && m + minutes <= to; m += minutes) {
            if (!hours.includes(toTime(m))) hours.push(toTime(m));
        }
        if (hours.length === form.hours.length) {
            toast({ variant: "destructive", title: "No hours added", description: "Check the duration and that the range fits at least one service." });
            return;
        }
        setForm({ ...form, hours: hours.sort() });
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
                        <th>Code</th>
                        <th>Title</th>
                        {/* <th>Visible</th> */}
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {visible.map((row) => (
                        <tr key={row.idService} className={row.deleted ? styles.deletedRow : ""}>
                            <td>{row.code}</td>
                            <td>{row.title}</td>
                            {/* <td><span className={`${styles.badge} ${row.visibleToClients ? styles.badgeOk : styles.badgeNo}`}>{row.visibleToClients ? "Visible" : "Hidden"}</span></td> */}
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
                            <div>
                                <span className={styles.cardMetaLabel}>Code</span>
                                {row.code}
                            </div>
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
                                    <div className="row">
                                        <div className="col-md-4">
                                            <FormGroup>
                                                <Label>Code</Label>
                                                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                                            </FormGroup>
                                        </div>
                                        <div className="col-md-8">
                                            <FormGroup>
                                                <Label>Title</Label>
                                                <Input maxLength={32} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                                            </FormGroup>
                                        </div>
                                    </div>
                                    <FormGroup>
                                        <Label>Description</Label>
                                        <Input type="textarea" rows={7} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Duration in minutes</Label>
                                        <Input type="number" min="1" step="1" placeholder="60" style={{ maxWidth: "200px" }} value={form.durationMinutes} onChange={(e) => setDuration(e.target.value)} />
                                        <small className="text-muted">note: the available hours are generated every <span style={{textDecoration: "underline"}}>this many minutes.</span></small>
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Addons included w/service</Label>
                                        <div className="d-flex flex-wrap gap-2">
                                            {addons.map((addon) => (
                                                <Button key={addon.idAddon} size="sm" className={form_.chip} color="primary" outline={!form.addons.includes(Number(addon.idAddon))} onClick={() => toggleAddon(addon.idAddon)}>
                                                    {addon.addon}
                                                </Button>
                                            ))}
                                        </div>
                                    </FormGroup>
                                </>
                            )}

                            {step === 1 && (
                                <>
                                    <div className={form_.title}>Prices</div>
                                    <div className={form_.subtitle}>Total price per passengers. (without addons)</div>
                                    <p className={form_.hint}>For an internal service, such as a manual booking or holding the aircraft for maintenance, you can leave the price empty.</p>
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
                                    <div className={form_.title}>Days and hours</div>
                                    <div className={form_.subtitle}>When customers can book this service.</div>
                                    <FormGroup>
                                        <Label>Days of service</Label>
                                        <div className={form_.dayGrid}>
                                            {WEEKDAYS.map((name, day) => (
                                                <button
                                                    type="button"
                                                    key={name}
                                                    className={`${form_.day} ${form.allowedWeekdays.includes(day) ? form_.dayOn : ""}`}
                                                    aria-pressed={form.allowedWeekdays.includes(day)}
                                                    onClick={() => toggleDay(day)}
                                                >
                                                    {name.slice(0, 3)}
                                                </button>
                                            ))}
                                        </div>
                                        <div className={form_.presetRow}>
                                            {DAY_PRESETS.map((preset) => (
                                                <button
                                                    type="button"
                                                    key={preset.label}
                                                    className={`${form_.preset} ${sameDays(form.allowedWeekdays, preset.days) ? form_.presetOn : ""}`}
                                                    onClick={() => setForm({ ...form, allowedWeekdays: preset.days })}
                                                >
                                                    {preset.label}
                                                </button>
                                            ))}
                                        </div>
                                    </FormGroup>

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

                                    <FormGroup>
                                        <Label>Hours of service</Label>
                                        <div className={form_.hoursBox}>
                                            <p className="text-muted mb-2">
                                                {Number(form.durationMinutes) > 0
                                                    ? `Pick a range. A start time is created every ${form.durationMinutes} minutes.`
                                                    : "Set the service duration in step 1 first."}
                                            </p>
                                            <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                                                <Input type="select" style={{ maxWidth: "150px" }} value={rangeFrom} disabled={!(Number(form.durationMinutes) > 0)} onChange={(e) => changeRange(e.target.value, rangeTo)}>
                                                    {clockOptions(Number(form.durationMinutes) || 30).map((time) => (
                                                        <option key={time} value={time}>{hourLabel(time)}</option>
                                                    ))}
                                                </Input>
                                                <span>to</span>
                                                <Input type="select" style={{ maxWidth: "150px" }} value={rangeTo} disabled={!(Number(form.durationMinutes) > 0)} onChange={(e) => changeRange(rangeFrom, e.target.value)}>
                                                    {clockOptions(Number(form.durationMinutes) || 30).map((time) => (
                                                        <option key={`to-${time}`} value={time}>{hourLabel(time)}</option>
                                                    ))}
                                                </Input>
                                                <Button color="primary" onClick={addRange}>Add hours</Button>
                                            </div>
                                            {form.hours.length === 0 ? (
                                                <p className="text-muted mb-0">No hours added yet.</p>
                                            ) : (
                                                <>
                                                    <div className="d-flex flex-wrap gap-2 mb-3">
                                                        {form.hours.map((hour) => (
                                                            <span key={hour} className={form_.hour}>
                                                                {hourLabel(hour)}
                                                                <button type="button" className={form_.hourRemove} aria-label={`Remove ${hourLabel(hour)}`} onClick={() => setForm({ ...form, hours: form.hours.filter((item) => item !== hour) })}>
                                                                    &times;
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <Button size="sm" color="danger" outline onClick={() => setForm({ ...form, hours: [] })}>Remove all</Button>
                                                </>
                                            )}
                                        </div>
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
