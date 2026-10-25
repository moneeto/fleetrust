"use client";

import { usePathname } from "next/navigation";

const titleMap = {
  "/tours": "Tours",
  "/operations/book-dates": "Book Dates",
  "/operations/bookings": "Bookings",
  "/operations/calendar": "Calendar",
  "/operations/services": "Services",
  "/operations/aircrafts": "Aircrafts",
  "/operations/addons": "Addons",
  "/operations/pilots": "Pilots",
  "/operations/gallery": "Gallery",
  "/users": "Users",
  "/settings": "Settings",
  "/settings/users": "Users",
  "/operations/qr-scan": "QR Scan",
  "/operations/reviews": "Tours Reviews",
  "/operations/social": "Tours Social media",
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