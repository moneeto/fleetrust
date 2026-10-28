"use client";

import { useEffect, useState } from "react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { Button, Input } from "reactstrap";
import { useToast } from "@/components/ui/use-toast";
import Spinner from "@/components/ui/Spinner";
import listing from "@/components/ui/listing.module.css";
import styles from "./page.module.css";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function emptyDays() {
    return WEEKDAYS.map((_, day) => ({ day, available: 0, intervals: [] }));
}

function fromRows(rows) {
    const days = emptyDays();
    for (const row of rows || []) {
        const day = days[Number(row.day)];
        if (!day) continue;
        if (Number(row.available) === 1) day.available = 1;
        day.intervals.push({
            hourFrom: String(row.hourFrom || "").slice(0, 5),
            hourTo: String(row.hourTo || "").slice(0, 5)
        });
    }
    return days;
}

function setDay(days, day, patch) {
    return days.map((item) => (item.day === day ? { ...item, ...patch } : item));
}

export default function AvailabilityPage() {
    const { toast } = useToast();
    const [isAdmin, setIsAdmin] = useState(false);
    const [ready, setReady] = useState(false);
    const [days, setDays] = useState(emptyDays);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Promise.all([
            ApiComunicator("/auth/profile", "GET"),
            ApiComunicator("/business-hours", "GET")
        ]).then(([profile, hours]) => {
            setIsAdmin(profile.code === "ADM");
            setDays(fromRows(hours.hours));
        }).catch((err) => {
            toast({ variant: "destructive", title: "Could not load availability", description: err.message || String(err) });
        }).finally(() => setReady(true));
    }, [toast]);

    function toggle(day, on) {
        setDays((current) => current.map((item) => {
            if (item.day !== day) return item;
            if (!on) return { ...item, available: 0 };
            const intervals = item.intervals.length ? item.intervals : [{ hourFrom: "09:00", hourTo: "17:00" }];
            return { ...item, available: 1, intervals };
        }));
    }

    function changeInterval(day, index, field, value) {
        setDays((current) => current.map((item) => {
            if (item.day !== day) return item;
            const intervals = item.intervals.map((interval, i) => (i === index ? { ...interval, [field]: value } : interval));
            return { ...item, intervals };
        }));
    }

    function addInterval(day) {
        setDays((current) => setDay(current, day, {
            available: 1,
            intervals: current.find((item) => item.day === day).intervals.concat({ hourFrom: "09:00", hourTo: "17:00" })
        }));
    }

    function removeInterval(day, index) {
        setDays((current) => current.map((item) => {
            if (item.day !== day) return item;
            const intervals = item.intervals.filter((_, i) => i !== index);
            return { day: item.day, available: intervals.length ? item.available : 0, intervals };
        }));
    }

    async function save() {
        try {
            setSaving(true);
            await ApiComunicator("/business-hours", "POST", { days });
            toast({ title: "Availability saved" });
        } catch (err) {
            const message = typeof err === "string" ? err : (err && err.message) || "Error saving availability";
            toast({ variant: "destructive", title: "Could not save", description: message });
        } finally {
            setSaving(false);
        }
    }

    if (!ready) return <Spinner />;

    return (
        <div className={listing.page}>
            <div className={styles.header}>
                <h1>Availability</h1>
                <p>Weekly hours for this account. Bookable times follow these intervals and each service duration.</p>
            </div>
            {!isAdmin && <p className="text-muted mb-0">Only an administrator can change availability.</p>}
            <div className={styles.list}>
                {days.map((day) => (
                    <div className={styles.day} key={day.day}>
                        <div className={`form-check form-switch ${styles.switch}`}>
                            <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                checked={day.available === 1}
                                disabled={!isAdmin}
                                aria-label={WEEKDAYS[day.day]}
                                onChange={(e) => toggle(day.day, e.target.checked)}
                            />
                        </div>
                        <div className={styles.name}>{WEEKDAYS[day.day]}</div>
                        {day.available === 1 ? (
                            <div className={styles.intervals}>
                                {day.intervals.map((interval, index) => (
                                    <div className={styles.interval} key={index}>
                                        <Input
                                            type="time"
                                            value={interval.hourFrom}
                                            disabled={!isAdmin}
                                            onChange={(e) => changeInterval(day.day, index, "hourFrom", e.target.value)}
                                        />
                                        <span>to</span>
                                        <Input
                                            type="time"
                                            value={interval.hourTo}
                                            disabled={!isAdmin}
                                            onChange={(e) => changeInterval(day.day, index, "hourTo", e.target.value)}
                                        />
                                        {isAdmin && (
                                            <button type="button" className={styles.remove} aria-label="Remove interval" onClick={() => removeInterval(day.day, index)}>×</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.off}><span className={listing.badge}>Unavailable</span></div>
                        )}
                        {isAdmin && (
                            <Button size="sm" outline className={styles.add} onClick={() => addInterval(day.day)}>+ Add interval</Button>
                        )}
                    </div>
                ))}
            </div>
            {isAdmin && (
                <div className={styles.actions}>
                    <Button color="primary" onClick={save} disabled={saving}>Save</Button>
                </div>
            )}
        </div>
    );
}
