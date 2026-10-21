"use client";

import { useEffect, useState } from "react";
import { Scheduler } from "calendarkit-pro";
import { Button, Modal, ModalBody, ModalHeader } from "reactstrap";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import MessageModal from "@/components/ui/MessageModal";
import BookingDetailModal from "@/components/booking/BookingDetailModal";
import BookDatesPage from "../book-dates/page";
import { colorForReservation, expandRange, orderEvents, reservationQueryRange, toCalendarEvent } from "./reservationEvent";
import "./calendar.bundle.css";

function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function monthGrid(date) {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - ((first.getDay() + 6) % 7));
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const end = new Date(last);
    end.setDate(last.getDate() + (6 - ((last.getDay() + 6) % 7)));
    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push(new Date(d));
    return days;
}

// ponytail: CalendarKit does not render the reservation id. Walk up to DraggableEvent's `event`. If the fiber key changes, this stops linking slices; stamp the id from the library instead.
function eventFrom(el) {
    const key = Object.keys(el).find((name) => name.startsWith("__reactFiber"));
    let fiber = key ? el[key] : null;
    for (let i = 0; i < 12 && fiber; i++) {
        const event = fiber.memoizedProps?.event;
        if (event?.row) return event;
        fiber = fiber.return;
    }
    return null;
}

function eventId(el) {
    const key = Object.keys(el).find((name) => name.startsWith("__reactFiber"));
    let fiber = key ? el[key] : null;
    for (let i = 0; i < 12 && fiber; i++) {
        const id = fiber.memoizedProps?.event?.id;
        if (id) return String(id);
        fiber = fiber.return;
    }
    return "";
}

function sqlDate(date) {
    const p = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}:00`;
}

function bookParts(date) {
    const p = (n) => String(n).padStart(2, "0");
    return {
        initialDate: `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`,
        initialTime: `${p(date.getHours())}:${p(date.getMinutes())}`,
    };
}

function formatWhen(start, end) {
    if (!start || !end) return "";
    const dateOpts = { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };
    if (sameDay(start, end)) {
        return `${start.toLocaleString(undefined, dateOpts)} – ${end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
    }
    return `${start.toLocaleString(undefined, dateOpts)} – ${end.toLocaleString(undefined, dateOpts)}`;
}

function CalendarCreate({ isOpen, event, initialDate, onClose, onCreate }) {
    useEffect(() => {
        if (!isOpen || event) return;
        onCreate(initialDate || new Date());
        onClose();
    }, [isOpen, event]);
    return null;
}

export default function Calendar() {
    const [events, setEvents] = useState([]);
    const [aircrafts, setAircrafts] = useState([]);
    const [aircraftId, setAircraftId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [view, setView] = useState("week");
    const [cursor, setCursor] = useState(() => new Date());
    const [detailId, setDetailId] = useState(null);
    const [day, setDay] = useState(null);
    const [dayOpen, setDayOpen] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [move, setMove] = useState(null);
    const [moveError, setMoveError] = useState("");
    const [savingMove, setSavingMove] = useState(false);
    const [newBook, setNewBook] = useState(null);
    const [bookOpen, setBookOpen] = useState(false);

    const shown = aircraftId ? events.filter((event) => event.calendarId === aircraftId) : events;
    const calendars = aircrafts.map((aircraft) => ({
        id: String(aircraft.idAircraft),
        label: aircraft.registrationNumber ? `${aircraft.aircraft} · ${aircraft.registrationNumber}` : aircraft.aircraft,
        color: colorForReservation(aircraft.idAircraft),
        active: aircraftId == null || aircraftId === String(aircraft.idAircraft),
    }));

    useEffect(() => {
        const root = document.querySelector(".calendar-root");
        if (!root) return;
        // Week and day blocks arrive at about 8% (`#color15`). Month chips use `#color20` (32/255).
        // Paint week/day with that same mix. The color lives on the left border the library draws.
        const monthMix = 0x20 / 255;
        const toFill = (color) => {
            const hex = String(color).match(/#([0-9a-f]{6})/i);
            if (hex) {
                const n = parseInt(hex[1], 16);
                return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${monthMix})`;
            }
            if (String(color).startsWith("rgb(")) return color.replace("rgb(", "rgba(").replace(")", `, ${monthMix})`);
            return "";
        };
        const paint = () => {
            root.querySelectorAll(".glass").forEach((el) => {
                const bg = getComputedStyle(el).backgroundColor;
                const alpha = bg.startsWith("rgba") ? parseFloat(bg.split(",")[3]) : 1;
                if (!(alpha > 0.1 && alpha < 0.2)) {
                    const next = toFill(el.style.borderLeftColor) || toFill(el.style.backgroundColor);
                    if (next) el.style.backgroundColor = next;
                }
                if (el.style.borderLeftColor) el.style.color = el.style.borderLeftColor;
                el.classList.toggle("can-stretch", eventFrom(el)?.row?.serviceCode === "MANUAL");
            });
            root.querySelectorAll(".glass, .rounded-lg.truncate").forEach((el) => {
                const id = eventId(el);
                if (id && el.dataset.rid !== id) el.dataset.rid = id;
            });
            if (view !== "month") return;
            const days = monthGrid(cursor);
            root.querySelectorAll(".h-\\[130px\\]").forEach((cell, index) => {
                const day = days[index];
                const countEl = [...cell.querySelectorAll(".rounded-full")].find((el) => el.className.includes("text-[10px]"));
                const list = cell.querySelector(".flex-1");
                const count = countEl ? Number(countEl.textContent) : 0;
                if (count > 2 && countEl && list && day) {
                    if (countEl.dataset.big === "1") return;
                    list.style.display = "none";
                    cell.style.position = "relative";
                    countEl.dataset.big = "1";
                    countEl.style.cssText = "position:absolute;left:50%;top:58%;transform:translate(-50%,-50%);width:3.25rem;height:3.25rem;display:flex;align-items:center;justify-content:center;margin:0;padding:0;border-radius:9999px;background:#dc2626;font-size:1.35rem;font-weight:600;color:#fff;cursor:pointer;z-index:2;";
                    countEl.onclick = (event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        setDetailId(null);
                        setDay(new Date(day));
                        setDayOpen(true);
                    };
                    return;
                }
                if (countEl?.dataset.big) {
                    countEl.dataset.big = "";
                    countEl.style.cssText = "";
                    countEl.onclick = null;
                    if (list) list.style.display = "";
                }
            });
        };
        paint();
        const mark = (id) => {
            root.querySelectorAll("[data-rid]").forEach((el) => {
                el.classList.toggle("is-same", id !== "" && el.dataset.rid === id);
            });
        };
        const onOver = (event) => {
            const block = event.target.closest(".glass, .rounded-lg.truncate");
            mark(block?.dataset.rid || "");
        };
        const onLeave = () => mark("");
        root.addEventListener("mouseover", onOver);
        root.addEventListener("mouseleave", onLeave);
        const obs = new MutationObserver(paint);
        obs.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ["style"] });
        return () => {
            obs.disconnect();
            root.removeEventListener("mouseover", onOver);
            root.removeEventListener("mouseleave", onLeave);
        };
    }, [events, aircraftId, view, cursor]);

    useEffect(() => {
        const { dateFrom, dateTo } = reservationQueryRange();
        let cancelled = false;

        ApiComunicator(`/reservations/reservationsByDate?dateFrom=${dateFrom}&dateTo=${dateTo}`)
            .then((res) => {
                if (cancelled) return;
                const rows = Array.isArray(res?.reservations) ? res.reservations : [];
                setEvents(orderEvents(rows.flatMap((row) => {
                    const event = toCalendarEvent(row);
                    return event ? expandRange(event) : [];
                })));
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err?.message || "Error loading reservations");
                setEvents([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        ApiComunicator("/aircrafts")
            .then((res) => {
                if (!cancelled) setAircrafts(Array.isArray(res?.aircrafts) ? res.aircrafts : []);
            })
            .catch(() => {
                if (!cancelled) setAircrafts([]);
            });

        return () => {
            cancelled = true;
        };
    }, [reloadKey]);

    useEffect(() => {
        const root = document.querySelector(".calendar-root");
        if (!root) return;
        let drag = null;
        const onClick = (event) => {
            const slot = event.target.closest?.(".bg-transparent.cursor-pointer");
            if (!slot || slot.closest(".glass") || !root.contains(slot)) return;
            event.preventDefault();
            event.stopPropagation();
        };
        const onDown = (event) => {
            const block = event.target.closest?.(".glass");
            if (!block || !root.contains(block)) return;
            const rect = block.getBoundingClientRect();
            const fromTop = event.clientY - rect.top;
            const fromBottom = rect.bottom - event.clientY;
            const side = fromTop <= 8 ? "top" : fromBottom <= 8 ? "bottom" : "";
            if (!side) return;
            const booking = eventFrom(block);
            if (booking?.row?.serviceCode !== "MANUAL") return;
            event.preventDefault();
            event.stopPropagation();
            let box = block;
            while (box && box !== root && getComputedStyle(box).position !== "absolute") box = box.parentElement;
            drag = {
                side,
                y: event.clientY,
                booking,
                box,
                top: box.offsetTop,
                height: box.offsetHeight,
                hourHeight: view === "day" ? 80 : 60,
                snapped: 0,
            };
        };
        const onMove = (event) => {
            if (!drag) return;
            const snap = drag.hourHeight / 4;
            const snapped = Math.round((event.clientY - drag.y) / snap) * snap;
            drag.snapped = snapped;
            if (drag.side === "bottom") {
                drag.box.style.height = `${Math.max(snap, drag.height + snapped)}px`;
                return;
            }
            const nextHeight = Math.max(snap, drag.height - snapped);
            drag.box.style.top = `${drag.top + (drag.height - nextHeight)}px`;
            drag.box.style.height = `${nextHeight}px`;
        };
        const onUp = () => {
            if (!drag) return;
            const { booking, box, hourHeight, snapped, side } = drag;
            drag = null;
            box.style.height = "";
            box.style.top = "";
            if (!snapped) return;
            const start = new Date(booking.originStart || booking.start);
            const end = new Date(booking.originEnd || booking.end);
            const minutes = (snapped / hourHeight) * 60;
            if (side === "bottom") end.setMinutes(end.getMinutes() + minutes);
            else start.setMinutes(start.getMinutes() + minutes);
            if (!(end > start)) return;
            setMoveError("");
            setMove({ row: booking.row, start, end });
        };
        root.addEventListener("click", onClick, true);
        root.addEventListener("pointerdown", onDown, true);
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        return () => {
            root.removeEventListener("click", onClick, true);
            root.removeEventListener("pointerdown", onDown, true);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
        };
    }, [view]);

    function openDetail(event) {
        setDay(null);
        setDayOpen(false);
        setDetailId(event.id);
    }

    function moveEvent(updated) {
        if (!updated?.title || !updated.row) return;
        const start = new Date(updated.start);
        const from = new Date(updated.originStart || updated.row.startDate);
        const to = new Date(updated.originEnd || updated.row.endDate);
        const moved = Math.abs(start.getTime() - from.getTime()) >= 60 * 1000;
        const end = moved ? new Date(start.getTime() + (to - from)) : new Date(updated.end);
        if (!(end > from)) return;
        setMoveError("");
        setMove({ row: updated.row, start: moved ? start : from, end });
    }

    async function confirmMove() {
        setSavingMove(true);
        setMoveError("");
        try {
            const response = await ApiComunicator("/reservations/updateReservation", "POST", {
                ...move.row,
                startDate: sqlDate(move.start),
                endDate: sqlDate(move.end),
            });
            if (!response?.success) {
                setMoveError(response?.message || "Could not move the reservation.");
                return;
            }
            setMove(null);
            setReloadKey((n) => n + 1);
        } catch (err) {
            setMoveError(err?.message || "Could not move the reservation.");
        } finally {
            setSavingMove(false);
        }
    }

    const dayEvents = day ? shown.filter((item) => sameDay(item.start, day)) : [];

    return (
        <div>
            {error && <p className="text-sm text-red-600 px-3 mb-2">{error}</p>}
            <div className="calendar-root" style={{ height: "calc(100vh - 8.5rem)", minHeight: 560 }}>
                <style>{`
                  .calendar-root .glass,
                  .calendar-root .rounded-lg.truncate { border: 0 !important; box-shadow: none !important; user-select: none; }
                  .calendar-root .glass * { color: inherit !important; }
                  .calendar-root .glass { backdrop-filter: none; -webkit-backdrop-filter: none; position: relative; }
                  .calendar-root .glass.can-stretch::before,
                  .calendar-root .glass.can-stretch::after { content: ""; position: absolute; left: 0; right: 0; height: 8px; cursor: ns-resize; z-index: 3; }
                  .calendar-root .glass.can-stretch::before { top: 0; }
                  .calendar-root .glass.can-stretch::after { bottom: 0; }
                  .calendar-root .cursor-ns-resize { display: none; }
                  .calendar-root .glass:has(.font-semibold:empty) .flex-col > :not(.absolute) { display: none; }
                  .calendar-root .rounded-lg.truncate:has(> span.font-medium:empty) { min-height: 1.75rem; }
                  .calendar-root .mt-auto { display: none; }
                  .calendar-root .min-h-\\[400px\\] { display: none; }
                  .calendar-root .glass.cursor-default,
                  .calendar-root .rounded-lg.truncate { cursor: pointer; }
                  .calendar-root .glass:hover,
                  .calendar-root .glass.is-same,
                  .calendar-root .rounded-lg.truncate:hover,
                  .calendar-root .rounded-lg.truncate.is-same { filter: brightness(1.18); }
                  .calendar-root button {
                    appearance: none;
                    -webkit-appearance: none;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.375rem;
                    background-color: transparent;
                    background-image: none;
                    border: 0;
                    box-shadow: none;
                    color: #111827;
                    font: inherit;
                    cursor: pointer;
                    line-height: 1;
                    border-radius: 0.75rem;
                    padding: 0;
                  }
                  .calendar-root button[class~="h-10"] { height: 2.5rem; width: 2.5rem; }
                  .calendar-root button[class~="h-9"] { height: 2.25rem; }
                  .calendar-root button[class~="h-8"] { height: 2rem; }
                  .calendar-root button[class~="w-8"] { width: 2rem; }
                  .calendar-root button[class~="h-7"] { height: 1.75rem; width: 1.75rem; }
                  .calendar-root button[class~="px-5"] { padding-left: 1.25rem; padding-right: 1.25rem; }
                  .calendar-root button[class~="px-3"] { padding-left: 0.75rem; padding-right: 0.75rem; }
                  .calendar-root button:hover { background-color: #f3f4f6; }
                  .calendar-root button[class~="text-xs"] { font-size: 0.75rem; }
                  .calendar-root button[class~="text-sm"] { font-size: 0.875rem; }
                  .calendar-root button[class~="border-[0.5px]"] {
                    border: 1px solid #e5e7eb;
                    background-color: #fff;
                  }
                  .calendar-root button[class~="bg-background"] {
                    background-color: #fff;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
                  }
                  .calendar-root button[class~="bg-primary"] {
                    background-color: hsl(221 83% 53%);
                    color: #fff;
                  }
                  .calendar-root button[class~="bg-primary/10"] {
                    background-color: hsl(221 83% 53% / 0.12);
                    color: hsl(221 83% 53%);
                  }
                  @media (max-width: 639px) {
                    .calendar-root .bg-muted\\/50 button svg { display: none; }
                    .calendar-root .bg-muted\\/50 button span { display: inline; }
                  }
                  @media (max-width: 767px) {
                    .calendar-root .min-w-\\[800px\\] { min-width: 0; }
                    .calendar-root .w-9.h-9 { width: 1.75rem; height: 1.75rem; }
                    .calendar-root .h-\\[130px\\].p-2 { padding: 0.25rem !important; }
                  }
                `}</style>
                <Scheduler
                    events={shown}
                    isLoading={loading}
                    date={cursor}
                    onDateChange={setCursor}
                    view={view}
                    onViewChange={setView}
                    calendars={calendars}
                    onCalendarToggle={(id) => setAircraftId((current) => current === String(id) ? null : String(id))}
                    translations={{ calendars: "Aircraft" }}
                    onEventClick={openDetail}
                    onEventUpdate={moveEvent}
                    renderEventForm={(props) => (
                        <CalendarCreate
                            {...props}
                            onCreate={(date) => { setNewBook(date); setBookOpen(true); }}
                        />
                    )}
                />
            </div>
            <Modal isOpen={dayOpen && !detailId} toggle={() => setDayOpen(false)} onClosed={() => { if (!dayOpen) setDay(null); }} centered>
                <ModalHeader toggle={() => setDayOpen(false)}>
                    {day?.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                </ModalHeader>
                <ModalBody>
                    {dayEvents.map((event) => (
                        <Button
                            key={`${event.id}-${event.start.toISOString()}`}
                            color="light"
                            className="w-100 text-start mb-2"
                            style={{ borderLeft: `4px solid ${event.color}` }}
                            onClick={() => setDetailId(event.id)}
                        >
                            <div style={{ fontWeight: 600 }}>{event.fullTitle || "Booking"}</div>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>
                                {formatWhen(event.originStart || event.start, event.originEnd || event.end)}
                            </div>
                        </Button>
                    ))}
                </ModalBody>
            </Modal>
            <MessageModal
                isOpen={!!move}
                type="confirm"
                title="Update reservation"
                confirmLabel={savingMove ? "Saving..." : "Confirm"}
                confirmColor="primary"
                disabled={savingMove}
                onClose={() => { if (!savingMove) setMove(null); }}
                onConfirm={confirmMove}
            >
                <div style={{ fontWeight: 600 }}>{move?.row && ([move.row.name, move.row.lastname].filter(Boolean).join(" ") || "Booking")}</div>
                <div style={{ fontSize: 14, marginTop: 8 }}>{move && formatWhen(move.start, move.end)}</div>
                {moveError && <p className="text-danger mt-3 mb-0">{moveError}</p>}
            </MessageModal>
            <Modal isOpen={bookOpen} toggle={() => setBookOpen(false)} onClosed={() => { if (!bookOpen) setNewBook(null); }} size="xl" scrollable>
                <ModalHeader toggle={() => setBookOpen(false)}>New Book</ModalHeader>
                <ModalBody>
                    {newBook && (
                        <BookDatesPage
                            {...bookParts(newBook)}
                            onDone={() => { setBookOpen(false); setReloadKey((n) => n + 1); }}
                        />
                    )}
                </ModalBody>
            </Modal>
            <BookingDetailModal
                idReservation={detailId}
                onClose={() => { setDetailId(null); setDay(null); setDayOpen(false); }}
                onBack={day ? () => setDetailId(null) : undefined}
                onChanged={() => setReloadKey((n) => n + 1)}
            />
        </div>
    );
}
