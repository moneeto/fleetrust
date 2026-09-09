"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plane, Wrench } from "lucide-react";
import LogoutButton from "./components/LogoutButton";

export default function Sidebar({ open, onClose }) {
    const pathname = usePathname();

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
                                <Plane size={16} strokeWidth={1.75} />
                                Tours
                            </span>

                            <nav className="nav flex-column submenu">

                                <Link
                                    href="/tours/bookings"
                                    className={pathname === "/tours/bookings" ? "nav-link active" : "nav-link"}
                                    onClick={onClose}
                                >
                                    Bookings
                                </Link>

                                <Link
                                    href="/tours/book-dates"
                                    className={pathname === "/tours/book-dates" ? "nav-link active" : "nav-link"}
                                    onClick={onClose}
                                >
                                    Book dates
                                </Link>

                                <Link
                                    href="/tours/aircrafts"
                                    className={pathname === "/tours/aircrafts" ? "nav-link active" : "nav-link"}
                                    onClick={onClose}
                                >
                                    Aircrafts
                                </Link>

                                <Link
                                    href="/tours/addons"
                                    className={pathname === "/tours/addons" ? "nav-link active" : "nav-link"}
                                    onClick={onClose}
                                >
                                    Addons
                                </Link>

                                <Link
                                    href="/tours/pilots"
                                    className={pathname === "/tours/pilots" ? "nav-link active" : "nav-link"}
                                    onClick={onClose}
                                >
                                    Pilots
                                </Link>

                                <Link
                                    href="/tours/gallery"
                                    className={pathname === "/tours/gallery" ? "nav-link active" : "nav-link"}
                                    onClick={onClose}
                                >
                                    Gallery
                                </Link>

                                <Link
                                    href="/tours/qr-scan"
                                    className={pathname === "/tours/qr-scan" ? "nav-link active" : "nav-link"}
                                    onClick={onClose}
                                >
                                    QR scan
                                </Link>

                                <Link
                                    href="/tours/reviews"
                                    className={pathname === "/tours/reviews" ? "nav-link active" : "nav-link"}
                                    onClick={onClose}
                                >
                                    Reviews
                                </Link>

                                <Link
                                    href="/tours/social"
                                    className={pathname === "/tours/social" ? "nav-link active" : "nav-link"}
                                    onClick={onClose}
                                >
                                    Social media
                                </Link>

                            </nav>
                        </div>

                        <div>
                            <span className="nav-link fw-semibold px-0">
                                <Wrench size={16} strokeWidth={1.75} />
                                Maintenance
                            </span>

                            <nav className="nav flex-column submenu">
                                <Link
                                    href="/maintenance/gallery"
                                    className={pathname === "/maintenance/gallery" ? "nav-link active" : "nav-link"}
                                    onClick={onClose}
                                >
                                    Gallery
                                </Link>
                                <Link
                                    href="/maintenance/reviews"
                                    className={pathname === "/maintenance/reviews" ? "nav-link active" : "nav-link"}
                                    onClick={onClose}
                                >
                                    Reviews
                                </Link>
                                <Link
                                    href="/maintenance/social"
                                    className={pathname === "/maintenance/social" ? "nav-link active" : "nav-link"}
                                    onClick={onClose}
                                >
                                    Social media
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
