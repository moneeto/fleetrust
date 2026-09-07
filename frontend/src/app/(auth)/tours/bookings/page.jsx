"use client";

import { Suspense, useEffect, useState, useRef, useMemo } from "react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { Form, FormGroup, Label, Input, Button, Table, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { FaEdit, FaExclamationCircle, FaEye, FaPrint, FaTimes } from "react-icons/fa";
import { Filter } from "lucide-react";
import moment from "moment";
import { useToast } from "@/components/ui/use-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import useIsMobile from "@/hooks/useIsMobile";
import MobileFiltersModal from "@/components/ui/MobileFiltersModal";
import styles from "./page.module.css";

/** ISO weeks (Mon–Sun) that have at least one day in the calendar month. */
function getIsoWeekRangesOverlappingMonth(yearMonth) {
    const monthStart = moment(`${yearMonth}-01`, "YYYY-MM-DD");
    if (!monthStart.isValid()) return [];
    const monthEnd = monthStart.clone().endOf("month");
    let monday = monthStart.clone().startOf("isoWeek");
    const weeks = [];
    while (monday.isSameOrBefore(monthEnd, "day")) {
        const sunday = monday.clone().endOf("isoWeek");
        const overlapsMonth =
            sunday.isSameOrAfter(monthStart, "day") &&
            monday.isSameOrBefore(monthEnd, "day");
        if (overlapsMonth) {
            weeks.push({
                from: monday.format("YYYY-MM-DD"),
                to: sunday.format("YYYY-MM-DD"),
            });
        }
        monday = monday.clone().add(1, "week");
    }
    return weeks;
}

function findWeekIndexForDate(dateStr, weeks) {
    const d = moment(dateStr, "YYYY-MM-DD");
    for (let i = 0; i < weeks.length; i++) {
        const { from, to } = weeks[i];
        if (d.isSameOrAfter(from, "day") && d.isSameOrBefore(to, "day")) return i;
    }
    return 0;
}

function BookingsContent() {
    const today = moment().format("YYYY-MM-DD");
    const initialMonth = moment().format("YYYY-MM");
    const [referenceDate, setReferenceDate] = useState(today);
    const [referenceMonth, setReferenceMonth] = useState(initialMonth);
    const [referenceWeekIndex, setReferenceWeekIndex] = useState(() => {
        const wks = getIsoWeekRangesOverlappingMonth(initialMonth);
        return wks.length ? findWeekIndexForDate(today, wks) : 0;
    });
    const [view, setView] = useState("day");
    const [filterCode, setFilterCode] = useState("");
    const [filterClient, setFilterClient] = useState("");
    const [debouncedCode, setDebouncedCode] = useState("");
    const [debouncedClient, setDebouncedClient] = useState("");
    const [idAircraftFilter, setIdAircraftFilter] = useState("");
    const [idRouteFilter, setIdRouteFilter] = useState("");
    const [idPilotFilter, setIdPilotFilter] = useState("");
    const [aircrafts, setAircrafts] = useState([]);
    const [pilots, setPilots] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [modalDetail, setModalDetail] = useState({ show: false, reservation: null });
    const tableRef = useRef(null);
    const { toast } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [reservation, setReservation] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editFormData, setEditFormData] = useState(null);
    const [errorModal, setErrorModal] = useState({ show: false, message: '' });
    const [deleteConfirmModal, setDeleteConfirmModal] = useState({ show: false, idReservation: null });
    const [cancellationReasons, setCancellationReasons] = useState([]);
    const [selectedCancellationReason, setSelectedCancellationReason] = useState(null);
    const [cancellationDetail, setCancellationDetail] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const isMobile = useIsMobile();

    /** URL tiene prioridad hasta que el efecto sincronice estado y quite la query (evita fetch día sin filtro). */
    const effectiveView = useMemo(() => {
        const p = searchParams.get("period");
        if (p === "month" || p === "week" || p === "day") return p;
        return view;
    }, [searchParams, view]);

    const effectiveIdAircraft = useMemo(() => {
        const fromState = idAircraftFilter && idAircraftFilter !== "all" ? idAircraftFilter : "";
        if (fromState) return fromState;
        const fromUrl = searchParams.get("idAircraft");
        return fromUrl ? String(fromUrl) : "";
    }, [idAircraftFilter, searchParams]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filterCode) count += 1;
        if (filterClient) count += 1;
        if (effectiveIdAircraft) count += 1;
        if (idRouteFilter) count += 1;
        if (idPilotFilter) count += 1;
        if (effectiveView !== "day") count += 1;
        return count;
    }, [filterCode, filterClient, effectiveIdAircraft, idRouteFilter, idPilotFilter, effectiveView]);

    const weekRangesInRefMonth = useMemo(
        () => getIsoWeekRangesOverlappingMonth(referenceMonth),
        [referenceMonth]
    );

    const dateRange = useMemo(() => {
        if (effectiveView === "day") {
            return { from: referenceDate, to: referenceDate };
        }
        if (effectiveView === "month") {
            const m = moment(`${referenceMonth}-01`, "YYYY-MM-DD");
            if (!m.isValid()) {
                return { from: today, to: today };
            }
            return {
                from: m.clone().startOf("month").format("YYYY-MM-DD"),
                to: m.clone().endOf("month").format("YYYY-MM-DD"),
            };
        }
        if (effectiveView === "week") {
            if (!weekRangesInRefMonth.length) {
                return { from: referenceDate, to: referenceDate };
            }
            const idx = Math.min(
                referenceWeekIndex,
                Math.max(0, weekRangesInRefMonth.length - 1)
            );
            const w = weekRangesInRefMonth[idx];
            return { from: w.from, to: w.to };
        }
        return { from: referenceDate, to: referenceDate };
    }, [
        effectiveView,
        referenceDate,
        referenceMonth,
        referenceWeekIndex,
        weekRangesInRefMonth,
        today,
    ]);

    useEffect(() => {
        if (effectiveView !== "week" || !weekRangesInRefMonth.length) return;
        if (referenceWeekIndex >= weekRangesInRefMonth.length) {
            setReferenceWeekIndex(weekRangesInRefMonth.length - 1);
        }
    }, [effectiveView, referenceMonth, weekRangesInRefMonth.length, referenceWeekIndex]);

    useEffect(() => {
        const idAc = searchParams.get("idAircraft");
        const period = searchParams.get("period");
        let applied = false;
        if (period === "month" || period === "week" || period === "day") {
            setView(period);
            applied = true;
        }
        if (idAc) {
            setIdAircraftFilter(String(idAc));
            applied = true;
        }
        if (applied) {
            router.replace(pathname, { scroll: false });
        }
    }, [searchParams, pathname, router]);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedCode(filterCode), 400);
        return () => clearTimeout(t);
    }, [filterCode]);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedClient(filterClient), 400);
        return () => clearTimeout(t);
    }, [filterClient]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [rRoutes, rAc, rReasons, rPilots] = await Promise.all([
                    ApiComunicator(`/routes/getRoutes`, "GET"),
                    ApiComunicator(`/aircrafts`, "GET"),
                    ApiComunicator(`/reservations/cancellationReasons`, "GET"),
                    ApiComunicator(`/pilots`, "GET"),
                ]);
                if (cancelled) return;
                setRoutes(rRoutes.routes || []);
                setAircrafts(rAc.aircrafts || []);
                setCancellationReasons(rReasons.cancellationReasons);
                setPilots(rPilots.pilots);
            } catch {
                if (!cancelled) {
                    setRoutes([]);
                    setAircrafts([]);
                }
            }
        })();
        return () => { cancelled = true; };
    }, []);

    function handlePrint() {
        // generate a tailored table for printing: pax instead of passengers, plus flight type and notes
        const buildTable = () => {
            const headerCols = [
                'Code', 'Starts at', 'Ends', 'Pax', 'Client', 'Email', 'Flight Type', 'Aircraft', 'Notes'
            ];

            const ths = headerCols.map(c => `<th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">${c}</th>`).join('');

            const rows = reservations.map(r => {
                const showStartDay =
                    effectiveView !== "day" ||
                    moment(r.startDate).format("YYYY-MM-DD") !== referenceDate;
                const start =
                    moment(r.startDate).format("HH:mm") +
                    (showStartDay ? ` ${moment(r.startDate).format("MMMM DD")}` : "");
                const end =
                    moment(r.endDate).format("HH:mm") +
                    (moment(r.endDate).format("YYYY-MM-DD") !==
                    moment(r.startDate).format("YYYY-MM-DD")
                        ? ` ${moment(r.endDate).format("MMMM DD")}`
                        : "");
                const aircraftLabel = r.aircraft
                    ? `${r.aircraft}${r.registrationNumber ? ` (${r.registrationNumber})` : ""}`
                    : "-";
                const pax = r.passengers ? r.passengers : '-';
                const client = r.name && r.lastname ? `${r.name} ${r.lastname}` : '-';
                const email = r.email ? r.email : '-';
                const flightType = r.route ? r.route : '-';
                const notes = r.notes ? r.notes : '-';
                return `<tr>
                    <td class="px-4 py-3 text-sm">#${r.codeReservation}</td>
                    <td class="px-4 py-3 text-sm">${start}</td>
                    <td class="px-4 py-3 text-sm">${end}</td>
                    <td class="px-4 py-3 text-sm">${pax}</td>
                    <td class="px-4 py-3 text-sm">${client}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${email}</td>
                    <td class="px-4 py-3 text-sm">${flightType}</td>
                    <td class="px-4 py-3 text-sm">${aircraftLabel}</td>
                    <td class="px-4 py-3 text-sm">${notes}</td>
                </tr>`;
            }).join('');

            return `<table>
                    <thead style="background: #f3f4f6" class="border-b"><tr>${ths}</tr></thead>
                    <tbody class="divide-y">${rows}</tbody>
                </table>`;
        };

        const tableHTML = buildTable();
        const printWindow = window.open("", "_blank", "width=900,height=650");

        printWindow.document.open();
        printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Reservations</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
        <style>
          body {
            font-family: Arial, Helvetica, sans-serif;
            padding: 24px;
            color: #111;
            background-color: white !important;
          }

          h1 {
            margin-bottom: 4px;
            font-size: 20px;
          }

          .subtitle {
            font-size: 13px;
            color: #555;
            margin-bottom: 20px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-top: 10px;
          }

          thead {
            background-color: #f3f4f6 !important;
            -webkit-print-color-adjust: exact;
          }

          th, td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
            text-align: left;
          }

          th {
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.03em;
          }

          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>Bookings — ${
            dateRange.from === dateRange.to
                ? moment(dateRange.from).format("MMMM DD, YYYY")
                : `${moment(dateRange.from).format("MMM DD, YYYY")} — ${moment(dateRange.to).format("MMM DD, YYYY")}`
        }</h1>
        <div class="subtitle">
          Generated on ${new Date().toLocaleDateString()}
        </div>
        ${tableHTML}
        <script>
          window.onload = function() {
            setTimeout(() => {
                window.focus();
                window.print();
            }, 250);
          };
        </script>
      </body>
    </html>
  `);

        printWindow.document.close();
    }

    async function fetchReservations() {
        try {
            setListLoading(true);
            setError(null);

            const q = new URLSearchParams();
            q.set("dateFrom", dateRange.from);
            q.set("dateTo", dateRange.to);
            if (debouncedCode.trim()) q.set("code", debouncedCode.trim());
            if (debouncedClient.trim()) q.set("client", debouncedClient.trim());
            if (effectiveIdAircraft && effectiveIdAircraft !== "all") {
                q.set("idAircraft", String(effectiveIdAircraft));
            }
            if (idRouteFilter && idRouteFilter !== "all") q.set("idRoute", idRouteFilter);
            if (idPilotFilter && idPilotFilter !== "all") q.set("idPilot", idPilotFilter);

            const res = await ApiComunicator(
                `/reservations/reservationsByDate?${q.toString()}`
            );

            setReservations(res.reservations);
        } catch (err) {
            const msg =
                err?.message ||
                err?.mensaje ||
                (typeof err === "string" ? err : "Error loading bookings");
            setError(msg);
            setReservations([]);
        } finally {
            setListLoading(false);
            setHasFetchedOnce(true);
        }
    }

    useEffect(() => {
        if (!dateRange.from || !dateRange.to) return;
        fetchReservations();
    }, [
        dateRange.from,
        dateRange.to,
        debouncedCode,
        debouncedClient,
        effectiveIdAircraft,
        idRouteFilter,
        idPilotFilter,
        searchParams.toString(),
    ]);

    const getReservationById = async (id) => {
        try {
            setLoading(true)
            let reserv = await ApiComunicator(`/reservations/getReservationById`, "POST", { id });
            setReservation(reserv)
            setEditFormData(reserv)
        } catch (error) {
            let message = "An error occurred while getting the reservation details.";
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

    const handleSaveReservation = async () => {
        try {
            setLoading(true);
            const updateData = {
                idReservation: editFormData.idReservation,
                name: editFormData.name,
                lastname: editFormData.lastname,
                email: editFormData.email,
                phoneNumber: editFormData.phoneNumber,
                notes: editFormData.notes,
                startDate: editFormData.startDate,
                endDate: editFormData.endDate,
                idRoute: editFormData.idRoute,
                idExperience: editFormData.idExperience,
                idAircraft: editFormData.idAircraft,
                idPilot: editFormData.idPilot
            };

            const response = await ApiComunicator(`/reservations/updateReservation`, "POST", updateData);

            if (response.success) {
                await getReservationById(editFormData.idReservation);
                setIsEditMode(false);
                toast({
                    variant: "default",
                    title: "Success",
                    description: "Reservation updated successfully"
                });
                fetchReservations();
            }
        } catch (error) {
            let errorMessage = "An error occurred while updating the reservation.";

            console.log(error);

            if (error?.mensaje) {
                errorMessage = error.mensaje;
            } else if (error?.message) {
                errorMessage = error.message;
            } else if (typeof error === "string") {
                errorMessage = error;
            }

            setErrorModal({ show: true, message: errorMessage });
        } finally {
            setLoading(false);
        }
    }

    const handleEditChange = (field, value) => {
        setEditFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }

    const cancel = () => {
        setSelectedCancellationReason(null);
        setCancellationDetail("");
        setDeleteConfirmModal({ show: true, idReservation: reservation?.idReservation });
    }

    const confirmDelete = async () => {
        try {
            setLoading(true);
            const response = await ApiComunicator(`/reservations/deleteReservation`, "POST", {
                idReservation: deleteConfirmModal.idReservation,
                idCancellationReason: selectedCancellationReason.idCancellationReason,
                cancellationDetail: selectedCancellationReason.cancellationReason.toUpperCase() === 'OTHER' ? cancellationDetail : null
            });

            if (response.success) {
                setDeleteConfirmModal({ show: false, idReservation: null });
                setSelectedCancellationReason(null);
                setCancellationDetail("");
                setModalDetail({ show: false, reservation: null });
                setIsEditMode(false);
                setEditFormData(null);
                toast({
                    variant: "default",
                    title: "Success",
                    description: "Reservation deleted successfully"
                });
                fetchReservations()
            }
        } catch (error) {
            console.log(error);
            let errorMessage = "An error occurred while deleting the reservation.";

            if (error && error.message) {
                errorMessage = error.message;
            } else if (error && typeof error === 'string') {
                errorMessage = error;
            }

            setErrorModal({ show: true, message: errorMessage });
        } finally {
            setLoading(false);
        }
    }

    const handlePeriodChange = (next) => {
        if (next === "week") {
            const m =
                effectiveView === "month"
                    ? referenceMonth
                    : moment(referenceDate).format("YYYY-MM");
            const wks = getIsoWeekRangesOverlappingMonth(m);
            setReferenceMonth(m);
            const idx = wks.length
                ? findWeekIndexForDate(referenceDate, wks)
                : 0;
            setReferenceWeekIndex(
                wks.length ? Math.min(idx, wks.length - 1) : 0
            );
        }
        if (next === "month") {
            const ym =
                effectiveView === "week"
                    ? referenceMonth
                    : moment(referenceDate).format("YYYY-MM");
            setReferenceMonth(ym);
        }
        if (next === "day") {
            setReferenceDate((d) => d || today);
        }
        setView(next);
        if (searchParams.toString()) {
            router.replace(pathname, { scroll: false });
        }
    };

    const resetFilters = () => {
        setView("day");
        setReferenceDate(today);
        setReferenceMonth(initialMonth);
        const wks = getIsoWeekRangesOverlappingMonth(initialMonth);
        setReferenceWeekIndex(wks.length ? findWeekIndexForDate(today, wks) : 0);
        setFilterCode("");
        setFilterClient("");
        setIdAircraftFilter("");
        setIdRouteFilter("");
        setIdPilotFilter("");
        if (searchParams.toString()) {
            router.replace(pathname, { scroll: false });
        }
    };

    const fieldMin = isMobile ? "100%" : undefined;

    const filterFields = (idPrefix = "") => (
        <>
            <FormGroup style={{ minWidth: fieldMin || "200px" }}>
                <Label for={`${idPrefix}view`}>Period</Label>
                <Input
                    id={`${idPrefix}view`}
                    type="select"
                    value={effectiveView}
                    onChange={(e) => handlePeriodChange(e.target.value)}
                >
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                </Input>
            </FormGroup>
            {effectiveView === "day" && (
                <FormGroup style={{ minWidth: fieldMin || "200px" }}>
                    <Label for={`${idPrefix}referenceDate`}>Reference date</Label>
                    <Input
                        id={`${idPrefix}referenceDate`}
                        type="date"
                        value={referenceDate}
                        onChange={(e) => setReferenceDate(e.target.value)}
                    />
                </FormGroup>
            )}
            {effectiveView === "week" && (
                <>
                    <FormGroup style={{ minWidth: fieldMin || "200px" }}>
                        <Label for={`${idPrefix}referenceMonthWeek`}>Reference month</Label>
                        <Input
                            id={`${idPrefix}referenceMonthWeek`}
                            type="month"
                            value={referenceMonth}
                            onChange={(e) => {
                                const ym = e.target.value;
                                setReferenceMonth(ym);
                                const wks = getIsoWeekRangesOverlappingMonth(ym);
                                setReferenceWeekIndex(0);
                                if (wks.length) {
                                    const idx = findWeekIndexForDate(today, wks);
                                    if (ym === moment().format("YYYY-MM")) {
                                        setReferenceWeekIndex(
                                            Math.min(idx, wks.length - 1)
                                        );
                                    }
                                }
                            }}
                        />
                    </FormGroup>
                    <FormGroup style={{ minWidth: fieldMin || "200px" }}>
                        <Label for={`${idPrefix}referenceWeek`}>Reference week</Label>
                        <Input
                            id={`${idPrefix}referenceWeek`}
                            type="select"
                            value={String(
                                Math.min(
                                    referenceWeekIndex,
                                    Math.max(0, weekRangesInRefMonth.length - 1)
                                )
                            )}
                            onChange={(e) =>
                                setReferenceWeekIndex(Number(e.target.value))
                            }
                            disabled={!weekRangesInRefMonth.length}
                        >
                            {!weekRangesInRefMonth.length ? (
                                <option value="0">—</option>
                            ) : (
                                weekRangesInRefMonth.map((_, i) => (
                                    <option key={i} value={String(i)}>
                                        Week {i + 1}
                                    </option>
                                ))
                            )}
                        </Input>
                    </FormGroup>
                </>
            )}
            {effectiveView === "month" && (
                <FormGroup style={{ minWidth: fieldMin || "200px" }}>
                    <Label for={`${idPrefix}referenceMonthOnly`}>Reference month</Label>
                    <Input
                        id={`${idPrefix}referenceMonthOnly`}
                        type="month"
                        value={referenceMonth}
                        onChange={(e) => setReferenceMonth(e.target.value)}
                    />
                </FormGroup>
            )}
            <FormGroup style={{ minWidth: fieldMin || "120px" }}>
                <Label for={`${idPrefix}filterCode`}>Code</Label>
                <Input
                    id={`${idPrefix}filterCode`}
                    type="text"
                    value={filterCode}
                    onChange={(e) => setFilterCode(e.target.value)}
                />
            </FormGroup>
            <FormGroup style={{ minWidth: fieldMin || "160px" }}>
                <Label for={`${idPrefix}filterClient`}>Client</Label>
                <Input
                    id={`${idPrefix}filterClient`}
                    type="text"
                    value={filterClient}
                    onChange={(e) => setFilterClient(e.target.value)}
                />
            </FormGroup>
            <FormGroup style={{ minWidth: fieldMin || "180px" }}>
                <Label for={`${idPrefix}idAircraftFilter`}>Aircraft</Label>
                <Input
                    id={`${idPrefix}idAircraftFilter`}
                    type="select"
                    value={effectiveIdAircraft || "all"}
                    onChange={(e) => {
                        const v = e.target.value === "all" ? "" : e.target.value;
                        setIdAircraftFilter(v);
                        if (searchParams.get("idAircraft")) {
                            router.replace(pathname, { scroll: false });
                        }
                    }}
                >
                    <option value="all">All aircraft</option>
                    {aircrafts.map((a) => (
                        <option key={a.idAircraft} value={a.idAircraft}>
                            {a.aircraft}
                            {a.registrationNumber ? ` (${a.registrationNumber})` : ""}
                        </option>
                    ))}
                </Input>
            </FormGroup>
            <FormGroup style={{ minWidth: fieldMin || "180px" }}>
                <Label for={`${idPrefix}idRouteFilter`}>Flight type</Label>
                <Input
                    id={`${idPrefix}idRouteFilter`}
                    type="select"
                    value={idRouteFilter || "all"}
                    onChange={(e) =>
                        setIdRouteFilter(e.target.value === "all" ? "" : e.target.value)
                    }
                >
                    <option value="all">All types</option>
                    {routes.map((rt) => (
                        <option key={rt.idRoute} value={rt.idRoute}>
                            {rt.title || rt.code}
                        </option>
                    ))}
                </Input>
            </FormGroup>
            <FormGroup style={{ minWidth: fieldMin || "180px" }}>
                <Label for={`${idPrefix}idPilotFilter`}>Pilot</Label>
                <Input
                    id={`${idPrefix}idPilotFilter`}
                    type="select"
                    value={idPilotFilter || "all"}
                    onChange={(e) =>
                        setIdPilotFilter(e.target.value === "all" ? "" : e.target.value)
                    }
                >
                    <option value="all">All pilots</option>
                    {pilots.map((p) => (
                        <option key={p.idPilot} value={p.idPilot}>
                            {p.pilotName}
                        </option>
                    ))}
                </Input>
            </FormGroup>
        </>
    );

    const periodSummary = (
        <>
            Showing{" "}
            {dateRange.from === dateRange.to
                ? moment(dateRange.from).format("MMM D, YYYY")
                : `${moment(dateRange.from).format("MMM D")} — ${moment(dateRange.to).format("MMM D, YYYY")}`}
            {listLoading && hasFetchedOnce ? " · Updating…" : ""}
        </>
    );

    if (!hasFetchedOnce && listLoading) {
        return <Spinner />;
    }

    let addonsTotal = 0;
    if (reservation) {
        for (let i = 0; i < reservation.addons.length; i++) {
            addonsTotal += reservation.addons[i].price * reservation.addons[i].quantity;
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.mobileToolbar}>
                <div className={styles.toolbarRow}>
                    <Button
                        color="primary"
                        outline
                        className={styles.filtersBtn}
                        type="button"
                        onClick={() => setFiltersOpen(true)}
                    >
                        <Filter size={16} />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className={styles.filtersBadge}>{activeFilterCount}</span>
                        )}
                    </Button>
                    {reservations && reservations.length > 0 && (
                        <Button
                            color="primary"
                            type="button"
                            onClick={() => handlePrint()}
                        >
                            <FaPrint color="white" /> Print
                        </Button>
                    )}
                </div>
            </div>

            <div className={styles.summary + " " + styles.mobileOnly}>
                {periodSummary}
            </div>

            <Form className={`${styles.filtersCard} ${styles.desktopOnly}`}>
                <div className="d-flex flex-wrap gap-3 align-items-end">
                    {filterFields()}
                    {reservations && reservations.length > 0 && (
                        <FormGroup>
                            <Label className="d-block invisible">Print</Label>
                            <Button
                                color="primary"
                                style={{ color: "white" }}
                                type="button"
                                onClick={() => handlePrint()}
                            >
                                <FaPrint color="white" /> Print
                            </Button>
                        </FormGroup>
                    )}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                    {periodSummary}
                </div>
            </Form>

            <MobileFiltersModal
                isOpen={filtersOpen}
                toggle={() => setFiltersOpen(false)}
                onApply={() => setFiltersOpen(false)}
                onReset={resetFilters}
            >
                {filterFields("mobile-")}
            </MobileFiltersModal>

            {error && (
                <p className="text-sm text-red-600 px-3">
                    {error}
                </p>
            )}

            {/* Tabla desktop */}
            {reservations.length > 0 && (
                <div
                    className={`${styles.tableCard} ${styles.desktopOnly}`}
                    style={{ opacity: listLoading ? 0.65 : 1 }}
                >
                    <Table innerRef={tableRef}>
                        <thead style={{ background: '#f3f4f6' }} className="border-b">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Code
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Starts at
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Ends
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Passengers
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Client
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Email
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Phone
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Flight type
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Aircraft
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {reservations.map((r) => {
                                const showStartDay =
                                    effectiveView !== "day" ||
                                    moment(r.startDate).format("YYYY-MM-DD") !== referenceDate;
                                return (
                                <tr
                                    key={r.idReservation}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-4 py-3 text-sm">
                                        #{r.codeReservation}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {moment(r.startDate).format('HH:mm')}
                                        {showStartDay ?
                                            ` ${moment(r.startDate).format('MMMM DD')}` : ``}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {moment(r.endDate).format('HH:mm')}
                                        {moment(r.endDate).format('YYYY-MM-DD') !== moment(r.startDate).format('YYYY-MM-DD') ?
                                            ` ${moment(r.endDate).format('MMMM DD')}` : ``}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {r.passengers ? r.passengers : `-`}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {r.name && r.lastname ? `${r.name} ${r.lastname}` : `-`}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {r.email ? r.email : `-`}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {r.phoneNumber ? r.phoneNumber : `-`}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {r.route ? r.route : `-`}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {r.aircraft
                                            ? `${r.aircraft}${r.registrationNumber ? ` (${r.registrationNumber})` : ""}`
                                            : `-`}
                                    </td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <Button
                                                color="secondary"
                                                size="sm"
                                                onClick={() => { setModalDetail({ show: true }); getReservationById(r.idReservation) }}
                                            >
                                                <FaEye /> View more
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </div>
            )}

            {/* Cards mobile */}
            {reservations.length > 0 && (
                <div
                    className={`${styles.mobileOnly} ${styles.cardsList}`}
                    style={{ opacity: listLoading ? 0.65 : 1 }}
                >
                    {reservations.map((r) => {
                        const showStartDay =
                            effectiveView !== "day" ||
                            moment(r.startDate).format("YYYY-MM-DD") !== referenceDate;
                        const startLabel =
                            moment(r.startDate).format("HH:mm") +
                            (showStartDay ? ` ${moment(r.startDate).format("MMM DD")}` : "");
                        const endLabel =
                            moment(r.endDate).format("HH:mm") +
                            (moment(r.endDate).format("YYYY-MM-DD") !== moment(r.startDate).format("YYYY-MM-DD")
                                ? ` ${moment(r.endDate).format("MMM DD")}`
                                : "");
                        return (
                            <div key={r.idReservation} className={styles.card}>
                                <div className={styles.cardCode}>#{r.codeReservation}</div>
                                <div className={styles.cardMeta}>
                                    <div>
                                        <span className={styles.cardMetaLabel}>Starts</span>
                                        {startLabel}
                                    </div>
                                    <div>
                                        <span className={styles.cardMetaLabel}>Ends</span>
                                        {endLabel}
                                    </div>
                                    <div className={styles.cardMetaFull}>
                                        <span className={styles.cardMetaLabel}>Client</span>
                                        {r.name && r.lastname ? `${r.name} ${r.lastname}` : "—"}
                                    </div>
                                    <div>
                                        <span className={styles.cardMetaLabel}>Aircraft</span>
                                        {r.aircraft
                                            ? `${r.aircraft}${r.registrationNumber ? ` (${r.registrationNumber})` : ""}`
                                            : "—"}
                                    </div>
                                    <div>
                                        <span className={styles.cardMetaLabel}>Flight type</span>
                                        {r.route || "—"}
                                    </div>
                                </div>
                                <div className={styles.cardActions}>
                                    <Button
                                        color="secondary"
                                        size="sm"
                                        onClick={() => {
                                            setModalDetail({ show: true });
                                            getReservationById(r.idReservation);
                                        }}
                                    >
                                        <FaEye /> View more
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Sin resultados */}
            {!listLoading && reservations.length === 0 && (
                <div className={styles.emptyCard}>
                    <div
                        className={styles.emptyMobile}
                        style={{
                            minHeight: "220px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            padding: "40px 20px",
                            gap: "18px"
                        }}
                    >
                        <div
                            style={{
                                fontSize: "14px",
                                color: "#6b7280",
                                fontWeight: 500
                            }}
                        >
                            No bookings for the selected period or filters
                        </div>

                        <Button
                            color="primary"
                            size="lg"
                            style={{
                                fontWeight: 600,
                                padding: "12px 28px",
                                borderRadius: "999px",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                            }}
                            onClick={() => {
                                router.push("/tours/book-dates");
                            }}
                        >
                            Start booking 
                        </Button>
                    </div>
                </div>
            )}
            <Modal isOpen={modalDetail.show} centered size="lg">
                {/* Header with dark background to match your table */}
                <ModalHeader
                    toggle={() => {
                        setModalDetail({ ...modalDetail, show: false, reservation: null });
                        setIsEditMode(false);
                        setEditFormData(null);
                    }}
                    style={{ backgroundColor: '#1e1e1e', color: 'white' }}
                >
                    <span style={{ color: 'white' }}>Booking #{reservation?.codeReservation}</span>
                </ModalHeader>

                <ModalBody style={{ padding: '0' }}>
                    {reservation && editFormData ? (
                        <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>

                            {!isEditMode ? (
                                <>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '20px',
                                        borderBottom: '1px solid #f0f0f0',
                                        paddingBottom: '15px'
                                    }}>
                                        <div style={{ textAlign: 'left' }}>
                                            <span style={{ fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>Start</span>
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                                                {moment(reservation?.startDate).format("MMM DD, YYYY - HH:mm")}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'left' }}>
                                            <span style={{ fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>End</span>
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                                                {moment(reservation?.endDate).format("MMM DD, YYYY - HH:mm")}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div style={{
                                        display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #f0f0f0',
                                        paddingBottom: '15px'
                                    }}>
                                        <div style={{ flex: '1 1 40%' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Flight Type</label>
                                            <span style={{ fontWeight: '600', color: '#222' }}>{reservation?.route}</span>
                                        </div>
                                        <div style={{ flex: '1 1 40%' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>PREMIUM EXPERIENCE</label>
                                            <span style={{ fontWeight: '600', color: '#222' }}>{reservation?.experience || "-"}</span>
                                        </div>
                                        <div style={{ flex: '1 1 40%' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Passengers</label>
                                            <span style={{ fontWeight: '600', color: '#222' }}>{reservation?.passengers ? ` ${reservation?.passengers.length} passengers` : ` - `}</span>
                                        </div>
                                        <div style={{ flex: '1 1 40%' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Client Name</label>
                                            <span style={{ fontWeight: '600', color: '#222' }}>{reservation?.name} {reservation?.lastname}</span>
                                        </div>
                                        <div style={{ flex: '1 1 40%' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Phone Number</label>
                                            <span style={{ fontWeight: '600', color: '#222' }}>{reservation?.phoneNumber ? `${reservation.phoneNumber}` : `-`}</span>
                                        </div>
                                        <div style={{ flex: '1 1 40%' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Aircraft</label>
                                            <span style={{ fontWeight: '600', color: '#222' }}>{`${reservation.aircraft} (${reservation.registrationNumber})`}</span>
                                        </div>
                                        <div style={{ flex: '1 1 40%' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Email Address</label>
                                            <span style={{ fontWeight: '600', color: '#222' }}>{reservation?.email ? `${reservation.email}` : `-`}</span>
                                        </div>
                                        <div style={{ flex: '1 1 40%' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Pilot</label>
                                            <span style={{ fontWeight: '600', color: '#222' }}>{reservation.pilotName ? reservation.pilotName : "-"}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
                                        {reservation?.passengers && reservation?.passengers?.length > 0 &&
                                            reservation?.passengers.map((passenger, index) => (
                                                <div key={'pssgr-' + index}>
                                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                        Passenger #{index + 1}
                                                    </label>
                                                    <span style={{ fontWeight: '600', color: '#222' }}>{passenger.name} {passenger.lastname}</span>
                                                </div>
                                            ))
                                        }
                                    </div>

                                    {reservation?.notes && (
                                        <>
                                            <div style={{ borderBottom: '1px solid #f0f0f0', marginBottom: '20px' }}></div>
                                            <div style={{
                                                backgroundColor: '#b8d1ffff',
                                                borderLeft: '5px solid #007bff',
                                                padding: '16px',
                                                borderRadius: '4px',
                                                marginTop: '20px',
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    marginBottom: '8px',
                                                    fontWeight: 'bold',
                                                    color: "#000000ff",
                                                    fontSize: '11px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    CUSTOMER NOTES
                                                </div>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: '14px',
                                                    color: '#000000',
                                                    lineHeight: '1.5',
                                                    fontStyle: 'italic',
                                                    fontWeight: '500'
                                                }}>
                                                    "{reservation.notes}"
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* Edit Mode */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
                                        <div style={{ flex: '1 1 45%', minWidth: '200px' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>Start Date & Time</label>
                                            <input
                                                type="datetime-local"
                                                value={editFormData?.startDate ? moment(editFormData.startDate).format('YYYY-MM-DDTHH:mm') : ''}
                                                onChange={(e) => handleEditChange('startDate', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    fontSize: '14px',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 45%', minWidth: '200px' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>End Date & Time</label>
                                            <input
                                                type="datetime-local"
                                                value={editFormData?.endDate ? moment(editFormData.endDate).format('YYYY-MM-DDTHH:mm') : ''}
                                                onChange={(e) => handleEditChange('endDate', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    fontSize: '14px',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 45%', minWidth: '200px' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>First Name</label>
                                            <input
                                                type="text"
                                                value={editFormData?.name || ''}
                                                onChange={(e) => handleEditChange('name', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    fontSize: '14px',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 45%', minWidth: '200px' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>Last Name</label>
                                            <input
                                                type="text"
                                                value={editFormData?.lastname || ''}
                                                onChange={(e) => handleEditChange('lastname', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    fontSize: '14px',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 45%', minWidth: '200px' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>Email</label>
                                            <input
                                                type="email"
                                                value={editFormData?.email || ''}
                                                onChange={(e) => handleEditChange('email', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    fontSize: '14px',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 45%', minWidth: '200px' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>Phone Number</label>
                                            <input
                                                type="tel"
                                                value={editFormData?.phoneNumber || ''}
                                                onChange={(e) => handleEditChange('phoneNumber', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    fontSize: '14px',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 45%', minWidth: '200px' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>Pilot</label>
                                            <select
                                                value={editFormData.idPilot ? editFormData.idPilot : ""}
                                                onChange={(e) => handleEditChange('idPilot', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    fontSize: '14px',
                                                    fontFamily: 'inherit'
                                                }}
                                            >
                                                <option value="">Select a pilot</option>
                                                {pilots.map((p) => (
                                                    <option key={p.idPilot} value={p.idPilot}>
                                                        {p.pilotName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{ flex: '1 1 100%' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>Notes</label>
                                            <textarea
                                                value={editFormData?.notes || ''}
                                                onChange={(e) => handleEditChange('notes', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    fontSize: '14px',
                                                    fontFamily: 'inherit',
                                                    minHeight: '80px',
                                                    resize: 'vertical'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                        </div>
                    ) : (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                            <p>Loading reservation details...</p>
                        </div>
                    )}
                </ModalBody>

                {reservation && (
                    <ModalFooter style={{ backgroundColor: '#fff', display: 'block', textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', color: '#333', marginBottom: '6px' }}>
                            <span>{reservation.experience ? reservation.experience : reservation.route}</span>
                            <span style={{ marginLeft: '16px' }}>${reservation.totalValue - addonsTotal}</span>
                        </div>
                        {reservation.addons.map((addon) => (
                            <div key={addon.idAddon} style={{ fontSize: '14px', color: '#333', marginBottom: '6px' }}>
                                <span>{addon.addon} x{addon.quantity}</span>
                                <span style={{ marginLeft: '16px' }}>
                                    {Number(addon.price) === 0 ? 'Included' : `$${addon.price * addon.quantity}`}
                                </span>
                            </div>
                        ))}
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#111', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                            <span>Total</span>
                            <span style={{ marginLeft: '16px' }}>${reservation.totalValue}</span>
                        </div>
                    </ModalFooter>
                )}

                <ModalFooter style={{ backgroundColor: '#f8f9fa' }}>
                    {!isEditMode ? (
                        <>
                            <Button
                                style={{ fontSize: '13px', fontWeight: '600' }}
                                color="danger"
                                onClick={() => cancel()}
                            >
                                <FaTimes /> Cancel reservation
                            </Button>
                            <Button
                                style={{ fontSize: '13px', fontWeight: '600' }}
                                color="primary"
                                onClick={() => setIsEditMode(true)}
                            >
                                <FaEdit /> Edit
                            </Button>
                            <Button
                                style={{ fontSize: '13px', fontWeight: '600' }}
                                color="secondary"
                                outline
                                onClick={() => {
                                    setModalDetail({ ...modalDetail, show: false, reservation: null });
                                    setIsEditMode(false);
                                    setEditFormData(null);
                                }}
                            >
                                Close
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                style={{ fontSize: '13px', fontWeight: '600' }}
                                color="success"
                                onClick={handleSaveReservation}
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button
                                style={{ fontSize: '13px', fontWeight: '600' }}
                                color="secondary"
                                outline
                                onClick={() => {
                                    setIsEditMode(false);
                                    setEditFormData(reservation);
                                }}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                        </>
                    )}
                </ModalFooter>
            </Modal>

            {/* Error Modal */}
            <Modal isOpen={errorModal.show} centered>
                <ModalHeader
                    toggle={() => setErrorModal({ show: false, message: '' })}
                    style={{ backgroundColor: '#dc3545', color: 'white' }}
                >
                    <span style={{ color: 'white' }}>Error Updating Reservation</span>
                </ModalHeader>
                <ModalBody>
                    <p style={{ marginBottom: '0', color: "#dc3545", fontSize: '16px' }}>
                        <FaExclamationCircle /> Error: {errorModal.message}
                    </p>
                </ModalBody>
                <ModalFooter style={{ backgroundColor: '#f8f9fa' }}>
                    <Button
                        style={{ fontSize: '13px', fontWeight: '600' }}
                        color="secondary"
                        outline
                        onClick={() => setErrorModal({ show: false, message: '' })}
                    >
                        Close
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteConfirmModal.show} centered>
                <ModalHeader
                    toggle={() => {
                        setDeleteConfirmModal({ show: false, idReservation: null });
                        setSelectedCancellationReason(null);
                        setCancellationDetail("");
                    }}
                    style={{ backgroundColor: '#721c24', color: 'white' }}
                >
                    <span style={{ color: 'white' }}>Confirm Deletion</span>
                </ModalHeader>
                <ModalBody>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <FaExclamationCircle style={{ color: '#dc3545', fontSize: '20px', marginTop: '4px', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <p style={{ marginBottom: '8px', color: '#333', fontWeight: '600' }}>
                                Are you sure you want to cancel this reservation?
                            </p>
                            <p style={{ marginBottom: '16px', color: '#666', fontSize: '13px' }}>
                                This action will cancel the reservation and make the slot available again.
                            </p>
                            <FormGroup>
                                <Label for="cancellationReason">Cancellation reason</Label>
                                <Input
                                    id="cancellationReason"
                                    type="select"
                                    value={selectedCancellationReason ? selectedCancellationReason.idCancellationReason : ""}
                                    onChange={(e) => {
                                        const selected = cancellationReasons.find(r => r.idCancellationReason == e.target.value);
                                        setSelectedCancellationReason(selected);
                                        setCancellationDetail("");
                                    }}
                                >
                                    <option value="">Select a reason</option>
                                    {cancellationReasons.map((r) => (
                                        <option key={r.idCancellationReason} value={r.idCancellationReason}>
                                            {r.cancellationReason}
                                        </option>
                                    ))}
                                </Input>
                            </FormGroup>
                            {selectedCancellationReason && selectedCancellationReason.cancellationReason.toUpperCase() === 'OTHER' && (
                                <FormGroup>
                                    <Label for="cancellationDetail">Detail</Label>
                                    <Input
                                        id="cancellationDetail"
                                        type="textarea"
                                        value={cancellationDetail}
                                        onChange={(e) => setCancellationDetail(e.target.value)}
                                    />
                                </FormGroup>
                            )}
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter style={{ backgroundColor: '#f8f9fa' }}>
                    <Button
                        style={{ fontSize: '13px', fontWeight: '600' }}
                        color="secondary"
                        outline
                        onClick={() => {
                            setDeleteConfirmModal({ show: false, idReservation: null });
                            setSelectedCancellationReason(null);
                            setCancellationDetail("");
                        }}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        style={{ fontSize: '13px', fontWeight: '600' }}
                        color="danger"
                        onClick={confirmDelete}
                        disabled={
                            loading ||
                            !selectedCancellationReason ||
                            (selectedCancellationReason.cancellationReason.toUpperCase() === 'OTHER' && !cancellationDetail)
                        }
                    >
                        {loading ? 'Canceling...' : 'Cancel Reservation'}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>

    );
}

export default function BookingsPage() {
    return (
        <Suspense fallback={<Spinner />}>
            <BookingsContent />
        </Suspense>
    );
}
