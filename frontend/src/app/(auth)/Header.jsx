"use client";

import { usePathname } from "next/navigation";

const titleMap = {
  "/tours": "Tours",
  "/tours/book-dates": "Book Dates",
  "/tours/bookings": "Bookings",
  "/tours/aircrafts": "Aircrafts",
  "/users": "Users",
  "/tours/qr-scan": "QR Scan",
};

export default function Header({ onMenuClick }) {
  const pathname = usePathname();
  const title = titleMap[pathname] ?? "Admin Panel";

  return (
    <header className="p-1 auth-header-content">
      <button
        className="mobile-menu-button"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        ☰
      </button>

      <h5 className="mb-0">{title}</h5>
    </header>
  );
}