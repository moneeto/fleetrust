"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import styles from "./SetupTour.module.css";

const steps = [
    { key: "services", title: "Create a service", text: "The experience you sell, with its prices and hours.", href: "/tours/services", required: true },
    { key: "aircrafts", title: "Add an aircraft", text: "The aircraft that flies the service and its capacity.", href: "/tours/aircrafts", required: true },
    { key: "pilots", title: "Add a pilot", text: "Who flies the bookings.", href: "/tours/pilots", required: true },
    { key: "addons", title: "Add an addon", text: "Extras a client can add to a booking.", href: "/tours/addons", required: false }
];

export default function SetupTour() {
    const pathname = usePathname();
    const [status, setStatus] = useState(null);
    const [rect, setRect] = useState(null);
    const [error, setError] = useState("");

    // Reload on every page change so the steps tick as soon as something is created.
    useEffect(() => {
        ApiComunicator("/auth/setup", "GET")
            .then((data) => setStatus(data && data.showSetupModal ? data : null))
            .catch(() => setStatus(null));
    }, [pathname]);

    const current = status
        ? steps.find((s) => s.required && Number(status[s.key]) === 0) || steps[3]
        : null;
    const requiredDone = status && steps.every((s) => !s.required || Number(status[s.key]) > 0);

    // Position the spotlight over the sidebar link of the current step (desktop only).
    useEffect(() => {
        if (!current) return;
        function measure() {
            const el = window.innerWidth >= 768 ? document.querySelector(`[data-tour="${current.key}"]`) : null;
            setRect(el ? el.getBoundingClientRect() : null);
        }
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [current?.key]);

    async function close() {
        setError("");
        try {
            await ApiComunicator("/auth/setup/dismiss", "POST", {});
            setStatus(null);
        } catch (e) {
            setError("Could not close the tutorial. Try again.");
        }
    }

    if (!status) return null;

    // On the module page the user is working: no dimming, card goes to the corner.
    const onModule = pathname === current.href;
    const beside = rect && !onModule;
    const besideStyle = beside
        ? { top: Math.max(16, Math.min(rect.top, window.innerHeight - 400)), left: rect.right + 24 }
        : undefined;

    return (
        <>
            {beside && (
                <div
                    className={styles.spotlight}
                    style={{ top: rect.top - 4, left: rect.left - 6, width: rect.width + 12, height: rect.height + 8 }}
                />
            )}

            <aside className={beside ? styles.cardBeside : styles.card} style={besideStyle} role="dialog" aria-label="Quick setup">
                <h2 className={styles.title}>Set up your account</h2>
                <p className={styles.sub}>Three steps and you can start taking bookings.</p>

                <ol className={styles.list}>
                    {steps.map((s) => {
                        const done = Number(status[s.key]) > 0;
                        return (
                            <li key={s.key} className={s.key === current.key ? styles.itemCurrent : styles.item}>
                                <span className={done ? styles.checkDone : styles.check}>
                                    {done && <Check size={12} strokeWidth={2.5} />}
                                </span>
                                <span>
                                    <span className={styles.itemTitle}>
                                        {s.title}{!s.required && " (optional)"}
                                    </span>
                                    {s.key === current.key && <span className={styles.itemText}>{s.text}</span>}
                                </span>
                            </li>
                        );
                    })}
                </ol>

                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.actions}>
                    <button type="button" className={styles.skip} onClick={close}>Skip tutorial</button>
                    {requiredDone ? (
                        <button type="button" className={styles.primary} onClick={close}>Finish setup</button>
                    ) : !onModule && (
                        <Link href={current.href} className={styles.primary}>Go to {current.key}</Link>
                    )}
                </div>
            </aside>
        </>
    );
}
