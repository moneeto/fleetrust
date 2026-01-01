"use client";

import { useEffect, useState } from "react";
import { ApiComunicator } from "@/helpers/ApiComunicator";


export default function ToursPage() {
    const [date, setDate] = useState("");
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!date) return;

        async function fetchReservations() {
            try {
                setLoading(true);
                setError(null);

                const res = await ApiComunicator(
                    `/reservations/reservationsByDate?date=${date}`
                );

                setReservations(res.reservations || []);
            } catch (err) {
                setError(err.message || "Error inesperado");
                setReservations([]);
            } finally {
                setLoading(false);
            }
        }

        fetchReservations();
    }, [date]);
    console.log(reservations);
    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-semibold">Reservas por día</h1>

            {/* Filtro por fecha */}
            <div className="flex items-center gap-4">
                <label className="font-medium">Fecha:</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border rounded px-3 py-1"
                />
            </div>

            {/* Estados */}
            {loading && <p>Cargando reservas...</p>}
            {error && <p className="text-red-600">{error}</p>}

            {/* Listado */}
            {!loading && reservations.length > 0 && (
                <div className="overflow-x-auto">
                    <table>
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border px-3 py-2 text-left">Hora</th>
                                <th className="border px-3 py-2 text-left">Cliente</th>
                                <th className="border px-3 py-2 text-left">Pasajeros</th>
                                <th className="border px-3 py-2 text-left">Tour</th>
                                <th className="border px-3 py-2 text-left">Email</th>
                                <th className="border px-3 py-2 text-left">Teléfono</th>
                                <th className="border px-3 py-2 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservations.map((r) => (
                                <tr key={r.idReservation} className="hover:bg-gray-50">
                                    <td className="border px-3 py-2">{r.reservationTime.slice(0, 5)}</td>
                                    <td className="border px-3 py-2">{r.name} {r.lastname}</td>
                                    <td className="border px-3 py-2">{r.passengers}</td>
                                    <td className="border px-3 py-2">#{r.idTourType}</td>
                                    <td className="border px-3 py-2">{r.email}</td>
                                    <td className="border px-3 py-2">{r.phoneNumber}</td>
                                    <td className="border px-3 py-2 text-right">${r.totalValue}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && date && reservations.length === 0 && (
                <p>No hay reservas para la fecha seleccionada.</p>
            )}
        </div>
    );
}
