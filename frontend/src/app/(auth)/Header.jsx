"use client";

import { usePathname } from "next/navigation";

const titleMap = {
  "/tours": "Tours",
  "/tours/book-dates": "Book Dates",
  "/tours/bookings": "Bookings",
  "/tours/aircrafts": "Aircrafts",
  "/tours/addons": "Addons",
  "/tours/pilots": "Pilots",
  "/tours/gallery": "Gallery",
  "/users": "Users",
  "/tours/qr-scan": "QR Scan",
  "/tours/reviews": "Tours Reviews",
  "/tours/social": "Tours Social media",
  "/maintenance/gallery": "Gallery",
  "/maintenance/reviews": "Maintenance Reviews",
  "/maintenance/social": "Maintenance Social media",
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