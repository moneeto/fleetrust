"use client";

import { usePathname } from "next/navigation";

const titleMap = {
  "/tours": "Tours",
  "/tours/book-dates": "Book dates",
  "/tours/bookings": "Bookings",
  "/tours/users": "Usuarios",
};

export default function Header() {
  const pathname = usePathname();
  const title = titleMap[pathname] ?? "Panel administrativo";

  return (
    <header className="border-bottom p-3">
      <h5 className="mb-0">{title}</h5>
    </header>
  );
}
