"use client";

import { useEffect, useState, useRef } from "react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { Form, FormGroup, Label, Input, Button } from "reactstrap";
import { FaPrint } from "react-icons/fa";
import moment from "moment";

export default function ToursPage() {
    let today = moment().format("YYYY-MM-DD");
    const [date, setDate] = useState(today);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const tableRef = useRef(null);

    function handlePrint() {
        if (!tableRef.current) return;

        const tableHTML = tableRef.current.outerHTML;
        const printWindow = window.open("", "_blank", "width=900,height=650");

        printWindow.document.open();
        printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Reservations</title>
        <style>
          body {
            font-family: Arial, Helvetica, sans-serif;
            padding: 24px;
            color: #111;
          }

          h1 {
            margin-bottom: 4px;
            font-size: 20px;
          }

          .subtitle {
            font-size: 13px;
            color: #555;
            margin-bottom: 20px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }

          thead {
            background-color: #f3f4f6;
          }

          th, td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
            text-align: left;
          }

          th {
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.03em;
          }

          tbody tr:nth-child(even) {
            background-color: #fafafa;
          }

          td:last-child, th:last-child {
            text-align: right;
          }

          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <h1>Bookings for ${moment(date).format("MMMM DD, YYYY")}</h1>
        <div class="subtitle">
          Generated on ${new Date().toLocaleDateString()}
        </div>
        ${tableHTML}
      </body>
    </html>
  `);

        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }


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

    return (
        <div className="p-6 space-y-6">

            {/* Filtro */}
            <Form className="bg-white rounded-lg shadow-sm border p-4 d-flex gap-3 align-items-end">
                <FormGroup style={{ maxWidth: '250px' }}>
                    <Label for="date">
                        Search by date
                    </Label>

                    <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </FormGroup>
                {reservations && reservations.length > 0 &&
                    <FormGroup>
                        <Button
                            color="primary"
                            style={{ color: 'white' }}
                            onClick={() => handlePrint()}
                        >
                            <FaPrint color="white" /> Print
                        </Button>
                    </FormGroup>}
            </Form>

            {/* Estados */}
            {loading && (
                <p className="text-sm text-gray-500">
                    Loading bookings...
                </p>
            )}

            {error && (
                <p className="text-sm text-red-600">
                    {error}
                </p>
            )}

            {/* Tabla */}
            {!loading && reservations.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
                    <table className="min-w-full border-collapse" ref={tableRef}>
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Time
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Client
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Passengers
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Code
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Email
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Phone
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-right">
                                    Total
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {reservations.map((r) => (
                                <tr
                                    key={r.idReservation}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-4 py-3 text-sm">
                                        {r.reservationTime.slice(0, 5)}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {r.name} {r.lastname}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {r.passengers}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        #{r.codeReservation}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {r.email}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {r.phoneNumber}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-right">
                                        ${r.totalValue}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Sin resultados */}
            {!loading && date && reservations.length === 0 && (
                <div className="bg-white rounded-lg border p-4 text-sm text-gray-500">
                    No bookings for selected date.
                </div>
            )}
        </div>

    );
}
