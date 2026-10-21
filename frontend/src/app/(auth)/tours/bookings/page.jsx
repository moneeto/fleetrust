"use client";

import { Suspense, useEffect, useState, useRef, useMemo } from "react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { Form, FormGroup, Label, Input, Button, Table } from "reactstrap";
import { FaEye, FaPrint } from "react-icons/fa";
import BookingDetailModal from "@/components/booking/BookingDetailModal";
import { Filter } from "lucide-react";
import moment from "moment";
import { useToast } from "@/components/ui/use-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import useIsMobile from "@/hooks/useIsMobile";
import MobileFiltersModal from "@/components/ui/MobileFiltersModal";
import styles from "@/components/ui/listing.module.css";
import local from "./page.module.css";

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
    const [services, setServices] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
    const [error, setError] = useState(null);
    const [openReservationId, setOpenReservationId] = useState(null);
    const tableRef = useRef(null);
    const { toast } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
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
                const [rServices, rAc, rPilots] = await Promise.all([
                    ApiComunicator(`/services/getServices`, "GET"),
                    ApiComunicator(`/aircrafts`, "GET"),
                    ApiComunicator(`/pilots`, "GET"),
                ]);
                if (cancelled) return;
                setServices(rServices.services || []);
                setAircrafts(rAc.aircrafts || []);
                setPilots(rPilots.pilots);
            } catch {
                if (!cancelled) {
                    setServices([]);
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
                const flightType = r.service || r.route || '-';
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
            if (idRouteFilter && idRouteFilter !== "all") q.set("idService", idRouteFilter);
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

    const periodFields = (idPrefix = "") => (
        <>
            <FormGroup>
                <Label>Period</Label>
                <div className={local.segmented} role="group" aria-label="Period">
                    {["day", "week", "month"].map((p) => (
                        <button
                            key={p}
                            type="button"
                            aria-pressed={effectiveView === p}
                            className={effectiveView === p ? local.segmentedActive : ""}
                            onClick={() => handlePeriodChange(p)}
                        >
                            {p === "day" ? "Day" : p === "week" ? "Week" : "Month"}
                        </button>
                    ))}
                </div>
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
        </>
    );

    const bookingFields = (idPrefix = "") => (
        <>
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
                    {services.map((rt) => (
                        <option key={rt.idService} value={rt.idService}>
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


    if (!hasFetchedOnce && listLoading) {
        return <Spinner />;
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


            <Form className={`${styles.filtersCard} ${styles.desktopOnly}`}>
                <div className={local.filterGroups}>
                    <div className={local.group}>
                        {periodFields()}
                    </div>
                    <div className={local.group}>
                        {bookingFields()}
                        {reservations && reservations.length > 0 && (
                            <div className={local.groupActions}>
                                <Button
                                    color="primary"
                                    style={{ color: "white" }}
                                    type="button"
                                    onClick={() => handlePrint()}
                                >
                                    <FaPrint color="white" /> Print
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </Form>

            <MobileFiltersModal
                isOpen={filtersOpen}
                toggle={() => setFiltersOpen(false)}
                onApply={() => setFiltersOpen(false)}
                onReset={resetFilters}
            >
                <h2 className={local.groupTitle}>Period</h2>
                {periodFields("mobile-")}
                <h2 className={local.groupTitle}>Bookings</h2>
                {bookingFields("mobile-")}
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
                                        {r.service || r.route || `-`}
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
                                                onClick={() => setOpenReservationId(r.idReservation)}
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
                                <div className={styles.cardHead}>
                                    <h3 className={styles.cardTitle}>#{r.codeReservation}</h3>
                                </div>
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
                                        {r.service || r.route || "—"}
                                    </div>
                                </div>
                                <div className={styles.cardActions}>
                                    <Button
                                        color="secondary"
                                        size="sm"
                                        onClick={() => setOpenReservationId(r.idReservation)}
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
                    <div>
                        <div className={local.emptyTitle}>No bookings found</div>
                        <div className={local.emptyText}>Try again changing the filters.</div>
                        <Button
                            color="primary"
                            size="lg"
                            className={`mt-3 ${local.startBooking}`}
                            onClick={() => {
                                router.push("/tours/book-dates");
                            }}
                        >
                            Start booking
                        </Button>
                    </div>
                </div>
            )}
            <BookingDetailModal
                idReservation={openReservationId}
                onClose={() => setOpenReservationId(null)}
                onChanged={fetchReservations}
            />
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
