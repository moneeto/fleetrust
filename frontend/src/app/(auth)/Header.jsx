"use client";

import { usePathname } from "next/navigation";

const titleMap = {
  "/tours": "Tours",
  "/tours/book-dates": "Book Dates",
  "/tours/bookings": "Bookings",
  "/tours/aircrafts": "Aircrafts",
  "/users": "Users",
};

export default function Header() {
  const pathname = usePathname();
  const title = titleMap[pathname] ?? "Admin Panel";

  return (
    <header className="p-1">
      <h5 className="mb-0">{title}</h5>
    </header>
  );
}
