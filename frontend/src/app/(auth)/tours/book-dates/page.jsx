// src/app/(auth)/book-dates/page.jsx
'use client';

import { useState } from 'react';
import SelectDateTime from '@/components/booking/SelectDateTime';
import { ApiComunicator } from '@/helpers/ApiComunicator';

export default function BookDatesPage() {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reservations, setReservations] = useState([]);

    async function handleSubmit() {
        try {
            setLoading(true);
            setError(null);

            const res = await ApiComunicator(
                `/reservations/createReservation`,
                'POST',
                { reservationDate: date, reservationTime: time }
            );

            setReservations(res.reservations || []);
        } catch (err) {
            setError(err.message || 'Error inesperado');
            setReservations([]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto d-flex flex-column gap-3">
            <SelectDateTime
                date={date}
                time={time}
                onDateChange={setDate}
                onTimeChange={setTime}
            />

            <div className="mt-6">
                <button
                    className="btn btn-primary"
                    disabled={!date || !time || loading}
                    onClick={handleSubmit}
                >
                    {loading ? 'Processing...' : 'Confirm booking'}
                </button>
            </div>

            {error && <p className="text-danger mt-3">{error}</p>}
        </div>
    );
}
