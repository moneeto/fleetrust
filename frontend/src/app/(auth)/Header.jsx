"use client";

import { usePathname } from "next/navigation";

const titleMap = {
  "/tours": "Tours",
  "/tours/book-dates": "Book Dates",
  "/tours/bookings": "Bookings",
  "/tours/users": "Users",
};

export default function Header() {
  const pathname = usePathname();
  const title = titleMap[pathname] ?? "Admin Panel";

  return (
    <header className="p-3">
      <h3 className="mb-0">{title}</h3>
    </header>
  );
}
