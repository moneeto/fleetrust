// ponytail: 10 colors, so reservations 10 ids apart look the same. A stored color is the upgrade.
const EVENT_COLORS = ["#E11D48", "#F97316", "#EAB308", "#84CC16", "#22C55E", "#14B8A6", "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899"];

export function colorForReservation(id) {
    const n = Math.abs(Number(id)) || 0;
    return EVENT_COLORS[n % EVENT_COLORS.length];
}

function ymd(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

export function parseReservationDate(value) {
    if (value == null || value === "") return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const s = String(value);
    if (/[zZ]$/.test(s) || /[+-]\d{2}:\d{2}$/.test(s)) {
        const parsed = new Date(s);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const match = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!match) {
        const parsed = new Date(s);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return new Date(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +(match[6] || 0));
}

export function toCalendarEvent(row) {
    const start = parseReservationDate(row.startDate);
    if (!start) return null;
    let end = parseReservationDate(row.endDate);
    if (!end || end <= start) end = new Date(start.getTime() + 60 * 60 * 1000);
    const client = [row.name, row.lastname].filter(Boolean).join(" ").trim();
    const what = row.service || row.experience || row.route || "Reservation";
    const title = client ? `${client} · ${what}` : what;
    const details = [];
    if (row.codeReservation != null && row.codeReservation !== "") details.push(`#${row.codeReservation}`);
    if (row.aircraft) details.push(row.aircraft);
    if (row.registrationNumber) details.push(row.registrationNumber);
    return {
        id: String(row.idReservation),
        title,
        start,
        end,
        color: colorForReservation(row.idReservation),
        calendarId: row.idAircraft != null && row.idAircraft !== "" ? String(row.idAircraft) : "",
        fullTitle: title,
        originStart: start,
        originEnd: end,
        description: details.join(" · "),
        row,
    };
}

function startOfLocalDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// CalendarKit week/day/month views only render an event on event.start's day.
// A multi-day booking has to be one slice per day or the days after the start stay empty.
// ponytail: slices stop at 400 days; a longer reservation would need a real span renderer.
export function expandRange(event) {
    const slices = [];
    let day = startOfLocalDay(event.start);
    let guard = 0;
    while (day < event.end && guard < 400) {
        const next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
        const sliceStart = event.start > day ? event.start : day;
        const sliceEnd = event.end < next ? event.end : next;
        if (sliceEnd > sliceStart) {
            slices.push({
                ...event,
                start: sliceStart,
                end: sliceEnd,
                originStart: event.start,
                title: slices.length ? "" : event.title,
                description: slices.length ? "" : event.description,
            });
        }
        day = next;
        guard += 1;
    }
    return slices.length ? slices : [event];
}

// Continuations first, then by the reservation's real departure. Month view keeps this order.
export function orderEvents(events) {
    return [...events].sort((a, b) => {
        const group = (a.title ? 1 : 0) - (b.title ? 1 : 0);
        if (group) return group;
        const time = (a.originStart || a.start) - (b.originStart || b.start);
        if (time) return time;
        return String(a.id).localeCompare(String(b.id));
    });
}

// ponytail: one request covering 11 months back through the API max (today + 1 year).
// Navigating outside that window shows nothing until this range is widened or refetched per view.
export function reservationQueryRange(now = new Date()) {
    const from = new Date(now.getFullYear(), now.getMonth() - 11, now.getDate());
    const to = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    return { dateFrom: ymd(from), dateTo: ymd(to) };
}

export function assertReservationEvent() {
    const event = toCalendarEvent({
        idReservation: 7,
        startDate: "2026-10-08 14:30:00",
        endDate: "2026-10-08 14:00:00",
        name: "Ada",
        lastname: "Lovelace",
        service: "Scenic",
        codeReservation: 42,
        aircraft: "Cessna",
    });
    if (!event || event.title !== "Ada Lovelace · Scenic") throw new Error("title");
    if (event.id !== "7") throw new Error("id");
    if (event.start.getHours() !== 14 || event.start.getMinutes() !== 30) throw new Error("start");
    if (event.end.getTime() - event.start.getTime() !== 60 * 60 * 1000) throw new Error("end");
    if (event.description !== "#42 · Cessna") throw new Error("description");
    if (!/^#[0-9a-f]{6}$/i.test(event.color)) throw new Error("color");
    if (event.row.idReservation !== 7 || event.row.service !== "Scenic") throw new Error("row");
    const other = toCalendarEvent({
        idReservation: 8,
        startDate: "2026-10-08 14:30:00",
        endDate: "2026-10-08 16:00:00",
        service: "Other",
    });
    if (other.color === event.color) throw new Error("color collision");
    const range = reservationQueryRange(new Date(2026, 9, 8));
    if (range.dateFrom !== "2025-11-08" || range.dateTo !== "2027-10-08") throw new Error(JSON.stringify(range));
    const slices = expandRange(toCalendarEvent({
        idReservation: 9,
        idAircraft: 3,
        startDate: "2026-10-08 07:00:00",
        endDate: "2026-10-10 07:00:00",
        service: "Manual",
    }));
    if (slices.length !== 3) throw new Error("slices " + slices.length);
    if (slices[0].start.getDate() !== 8 || slices[0].start.getHours() !== 7) throw new Error("slice0 start");
    if (slices[0].end.getDate() !== 9 || slices[0].end.getHours() !== 0) throw new Error("slice0 end");
    if (slices[1].start.getDate() !== 9 || slices[1].end.getDate() !== 10 || slices[1].end.getHours() !== 0) throw new Error("slice1");
    if (slices[2].start.getDate() !== 10 || slices[2].start.getHours() !== 0) throw new Error("slice2 start");
    if (slices[2].end.getDate() !== 10 || slices[2].end.getHours() !== 7) throw new Error("slice2 end");
    if (slices[0].title !== "Manual" || slices[1].title !== "" || slices[2].title !== "") throw new Error("continuation title");
    if (slices[1].description || slices[0].color !== slices[2].color) throw new Error("continuation");
    if (slices[1].fullTitle !== "Manual" || slices[2].calendarId !== "3") throw new Error("meta");
    if (slices[2].originEnd.getDate() !== 10 || slices[2].originEnd.getHours() !== 7) throw new Error("origin end");
    if (expandRange(event).length !== 1) throw new Error("same day");
    if (slices[2].originStart.getTime() !== slices[0].start.getTime()) throw new Error("origin");
    const early = toCalendarEvent({
        idReservation: 10,
        startDate: "2026-10-10 07:00:00",
        endDate: "2026-10-10 08:00:00",
        service: "Early",
    });
    const late = toCalendarEvent({
        idReservation: 11,
        startDate: "2026-10-10 11:30:00",
        endDate: "2026-10-10 12:30:00",
        service: "Late",
    });
    const ordered = orderEvents([late, slices[2], early]);
    if (ordered[0] !== slices[2] || ordered[1] !== early || ordered[2] !== late) throw new Error("order");
}
