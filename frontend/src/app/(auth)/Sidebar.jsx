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
                    <p className="brand sidebar-brand">Fleetrust</p>
                    <nav className="nav flex-column gap-2">

                        <div>
                            <span className="nav-link fw-semibold px-0">
                                Operations
                            </span>

                            <nav className="nav flex-column submenu">
                                <Link
                                    href="/operations/calendar"
                                    className={pathname === "/operations/calendar" ? "nav-link active" : "nav-link"}
                                    onClick={onClose}
                                >
                                    Bookings Calendar
                                </Link>

                                <Link
                                    href="/operations/bookings"
                                    className={pathname === "/operations/bookings" ? "nav-link active" : "nav-link"}
                                    onClick={onClose}
                                >
                                    Bookings List
                                </Link>


                                <Link
                                    href="/operations/book-dates"
                                    className={pathname === "/operations/book-dates" ? "nav-link active" : "nav-link"}
                                    onClick={onClose}
                                >
                                    New Book
                                </Link>

                                <Link
                                    href="/operations/services"
                                    data-tour="services"
                                    className={pathname === "/operations/services" ? "nav-link active" : "nav-link"}
                                    onClick={onClose}
                                >
                                    Services
                                </Link>

                                <Link
                                    href="/operations/aircrafts"
                                    data-tour="aircrafts"
                                    className={pathname === "/operations/aircrafts" ? "nav-link active" : "nav-link"}
                                    onClick={onClose}
                                >
                                    Aircrafts
                                </Link>

                                <Link
                                    href="/operations/pilots"
                                    data-tour="pilots"
                                    className={pathname === "/operations/pilots" ? "nav-link active" : "nav-link"}
                                    onClick={onClose}
                                >
                                    Pilots
                                </Link>
                                <Link
                                    href="/operations/addons"
                                    data-tour="addons"
                                    className={pathname === "/operations/addons" ? "nav-link active" : "nav-link"}
                                    onClick={onClose}
                                >
                                    Addons
                                </Link>


                                {/* <Link
                                    href="/operations/gallery"
                                    className={pathname === "/operations/gallery" ? "nav-link active" : "nav-link"}
                                    onClick={onClose}
                                >
                                    Gallery
                                </Link> */}

                                {/* <Link
                                    href="/operations/qr-scan"
                                    className={pathname === "/operations/qr-scan" ? "nav-link active" : "nav-link"}
                                    onClick={onClose}
                                >
                                    QR scan
                                </Link> */}

                                {/* <Link
                                    href="/operations/reviews"
                                    className={pathname === "/operations/reviews" ? "nav-link active" : "nav-link"}
                                    onClick={onClose}
                                >
                                    Reviews
                                </Link> */}

                                {/* <Link
                                    href="/operations/social"
                                    className={pathname === "/operations/social" ? "nav-link active" : "nav-link"}
                                    onClick={onClose}
                                >
                                    Social media
                                </Link> */}

                            </nav>
                        </div>

                        {/* <div>
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
                        </div> */}
                    </nav>
                </div>

                <div className="auth-sidebar-bottom">
                    <nav className="nav flex-column submenu">
                        <Link
                            href="/settings"
                            className={pathname === "/settings" ? "nav-link active" : "nav-link"}
                            onClick={onClose}
                        >
                            Settings
                        </Link>
                        <Link
                            href="/faqs"
                            className={pathname === "/faqs" ? "nav-link active" : "nav-link"}
                            onClick={onClose}
                        >
                            FAQ's
                        </Link>
                    </nav>
                    <div className="auth-sidebar-footer">
                        <LogoutButton />
                    </div>
                </div>

            </aside>
        </>
    );
}
