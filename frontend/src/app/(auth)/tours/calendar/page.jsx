"use client";

import { useEffect, useState } from "react";
import { Scheduler } from "calendarkit-pro";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { reservationQueryRange, toCalendarEvent } from "./reservationEvent";
import "./calendar.bundle.css";

export default function Calendar() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const { dateFrom, dateTo } = reservationQueryRange();
        let cancelled = false;

        ApiComunicator(`/reservations/reservationsByDate?dateFrom=${dateFrom}&dateTo=${dateTo}`)
            .then((res) => {
                if (cancelled) return;
                const rows = Array.isArray(res?.reservations) ? res.reservations : [];
                setEvents(rows.map(toCalendarEvent).filter(Boolean));
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err?.message || "Error loading reservations");
                setEvents([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div>
            {error && <p className="text-sm text-red-600 px-3 mb-2">{error}</p>}
            <div className="calendar-root" style={{ height: "calc(100vh - 8.5rem)", minHeight: 560 }}>
                <Scheduler events={events} readOnly isLoading={loading} />
            </div>
        </div>
    );
}
