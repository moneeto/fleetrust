"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiComunicator } from "@/helpers/ApiComunicator";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
        await ApiComunicator("/auth/logout")
        router.replace('/login');
    } catch (err) {
        console.error('Logout failed', err);
        router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="btn btn-outline-light btn-sm w-100"
      type="button"
      disabled={loading}
    >
      {loading ? 'Logging out...' : 'Log out'}
    </button>
  );
}
