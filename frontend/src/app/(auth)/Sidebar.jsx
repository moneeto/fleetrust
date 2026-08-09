"use client";

import Link from "next/link";
import LogoutButton from "./components/LogoutButton";

export default function Sidebar({ open, onClose }) {
    return (
        <>
            {open && (
                <div
                    className="sidebar-overlay"
                    onClick={onClose}
                />
            )}

            <aside className={`auth-sidebar p-3 ${open ? "open" : ""}`}>

                <div>
                    <img
                        src="/images/logo.svg"
                        alt="Logo"
                        className="mb-4"
                        id="sidebar-logo"
                    />

                    <nav className="nav flex-column gap-2">

                        <div>
                            <span className="nav-link fw-semibold px-0">
                                Tours
                            </span>

                            <nav className="nav flex-column submenu">

                                <Link
                                    href="/tours/bookings"
                                    className="nav-link"
                                    onClick={onClose}
                                >
                                    Bookings
                                </Link>

                                <Link
                                    href="/tours/book-dates"
                                    className="nav-link"
                                    onClick={onClose}
                                >
                                    Book dates
                                </Link>

                                <Link
                                    href="/tours/aircrafts"
                                    className="nav-link"
                                    onClick={onClose}
                                >
                                    Aircrafts
                                </Link>

                                <Link
                                    href="/tours/qr-scan"
                                    className="nav-link"
                                    onClick={onClose}
                                >
                                    QR scan
                                </Link>

                            </nav>
                        </div>

                    </nav>
                </div>

                <div className="auth-sidebar-footer">
                    <LogoutButton />
                </div>

            </aside>
        </>
    );
}