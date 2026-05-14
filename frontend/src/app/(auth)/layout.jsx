import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "./Header";
import LogoutButton from "./components/LogoutButton";
import './layout.css';

export default async function AuthLayout({ children }) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token) redirect("/login");

    return (
        <div className="auth-layout">
            {/* Sidebar */}
            <aside className="auth-sidebar p-3">
                {/* Top */}
                <div>
                    <img src="/images/logo.svg" alt="Logo" className="mb-4" id="sidebar-logo"/>

                    <nav className="nav flex-column gap-2">
                        {/* Tours */}
                        <div>
                            <span className="nav-link fw-semibold px-0">
                                Tours
                            </span>

                            <nav className="nav flex-column submenu">
                                <Link href="/tours/bookings" className="nav-link">
                                    Bookings
                                </Link>
                                <Link href="/tours/book-dates" className="nav-link">
                                    Book dates
                                </Link>
                                <Link href="/tours/aircrafts" className="nav-link">
                                    Aircrafts
                                </Link>
                                <Link href="/tours/qr-scan" className="nav-link">
                                    QR scan
                                </Link>
                                {/* <Link href="/tours/schedule" className="nav-link">
                                    Schedule
                                </Link> */}
                            </nav>
                        </div>
                    </nav>
                </div>

                {/* Bottom */}
                <div className="auth-sidebar-footer">
                    <LogoutButton />
                </div>
            </aside>

            {/* Main */}
            <div className="auth-main">
                {/* Header */}
                <header className="auth-header">
                    <Header />
                </header>

                {/* Content */}
                <main className="auth-content">
                    {children}
                </main>
            </div>
        </div>
    );
}