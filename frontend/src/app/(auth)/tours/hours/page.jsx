"use client";

import { useEffect, useState } from "react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { FormGroup, Label, Input, Table } from "reactstrap";
import { useToast } from "@/components/ui/use-toast";
import { CheckIcon, XIcon } from "lucide-react";
import styles from "./page.module.css";
import Spinner from "@/components/ui/Spinner";

function formatHour(hour) {
    return String(hour).substring(0, 5);
}

export default function HoursPage() {
    const [hours, setHours] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
    const [error, setError] = useState(null);
    const [savingHour, setSavingHour] = useState(null);

    const { toast } = useToast();

    async function fetchHours() {
        try {
            setLoading(true);
            setError(null);

            const res = await ApiComunicator(`/availableHours`, "GET");

            setHours(res.hours);
        } catch (err) {
            setError(err.message);
            setHours([]);
        } finally {
            setLoading(false);
            setHasFetchedOnce(true);
        }
    }

    useEffect(() => {
        fetchHours();
    }, []);

    const toggleHour = async (slot) => {
        const nextActive = slot.active ? 0 : 1;

        try {
            setSavingHour(slot.hour);
            await ApiComunicator(`/availableHours/edit`, "POST", {
                hour: slot.hour,
                active: nextActive
            });
            setHours((prev) =>
                prev.map((h) => (h.hour === slot.hour ? { ...h, active: nextActive } : h))
            );
        } catch (error) {
            let message = "Error updating hour";
            if (error.message) { message = error.message }
            toast({
                variant: "destructive",
                title: "Error",
                description: message
            });
        } finally {
            setSavingHour(null);
        }
    };

    if (!hasFetchedOnce && loading) {
        return <Spinner />;
    }

    return (
        <div className={styles.page}>
            {error && (
                <p className="text-sm text-red-600 px-3">
                    {error}
                </p>
            )}

            <div className={`${styles.tableCard} ${styles.desktopOnly}`}>
                <Table>
                    <thead style={{ background: "#f3f4f6" }} className="border-b">
                        <tr>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                Hour
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                Active
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y">
                        {hours.length === 0 && (
                            <tr>
                                <td colSpan={2} className="px-4 py-6 text-sm text-gray-500 text-center">
                                    No hours found.
                                </td>
                            </tr>
                        )}
                        {hours.map((slot) => (
                            <tr key={slot.hour} className="transition-colors duration-150 hover:bg-sky-100">
                                <td className="px-4 py-3 text-sm">
                                    {formatHour(slot.hour)}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <FormGroup switch className="mb-0">
                                        <Input
                                            type="switch"
                                            id={`active-${slot.hour}`}
                                            checked={!!slot.active}
                                            disabled={savingHour === slot.hour}
                                            style={{ cursor: "pointer" }}
                                            onChange={() => toggleHour(slot)}
                                        />
                                        <Label for={`active-${slot.hour}`} check>
                                            {slot.active ?
                                                <>
                                                    <CheckIcon color="green" size={16} /> Yes
                                                </>
                                                : <>
                                                    <XIcon color="red" size={16} /> No
                                                </>}
                                        </Label>
                                    </FormGroup>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            <div className={`${styles.mobileOnly} ${styles.cardsList}`}>
                {hours.length === 0 && (
                    <div className={styles.card}>
                        <p className="mb-0 text-sm text-gray-500 text-center">No hours found.</p>
                    </div>
                )}

                {hours.map((slot) => (
                    <div key={slot.hour} className={styles.card}>
                        <div className={styles.cardTitle}>
                            {formatHour(slot.hour)}
                        </div>
                        <FormGroup switch className="mb-0">
                            <Input
                                type="switch"
                                id={`active-mobile-${slot.hour}`}
                                checked={!!slot.active}
                                disabled={savingHour === slot.hour}
                                style={{ cursor: "pointer" }}
                                onChange={() => toggleHour(slot)}
                            />
                            <Label for={`active-mobile-${slot.hour}`} check>
                                Active
                            </Label>
                        </FormGroup>
                    </div>
                ))}
            </div>
        </div>
    );
}
