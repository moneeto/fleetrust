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
        description: details.join(" · "),
    };
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
    const range = reservationQueryRange(new Date(2026, 9, 8));
    if (range.dateFrom !== "2025-11-08" || range.dateTo !== "2027-10-08") throw new Error(JSON.stringify(range));
}
