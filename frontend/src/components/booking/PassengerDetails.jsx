'use client';

import React from 'react';

const Field = ({ col = 6, label, type = 'text', placeholder, value, onChange }) => (
    <div className={`col-12 col-md-${col}`}>
        {label && <label className="small fw-bold text-muted text-uppercase mb-1 d-block">{label}</label>}
        <input
            type={type}
            className="form-control"
            placeholder={placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);

const PassengerDetails = ({ count, passengersData, setPassengersData, reservationHolder, setReservationHolder }) => {
    const setHolder = (field) => (value) => setReservationHolder((prev) => ({ ...prev, [field]: value }));

    const setPassenger = (i, field) => (value) => {
        const updated = [...passengersData];
        updated[i] = { ...updated[i], [field]: value };
        setPassengersData(updated);
    };

    return (
        <div className="d-flex flex-column gap-4">
            <section>
                <h5 className="fw-bold mb-3">Reservation holder</h5>
                <div className="row g-2">
                    <Field label="First name" placeholder="John" value={reservationHolder?.firstName} onChange={setHolder('firstName')} />
                    <Field label="Last name" placeholder="Doe" value={reservationHolder?.lastName} onChange={setHolder('lastName')} />
                    <Field label="Email" type="email" placeholder="john.doe@example.com" value={reservationHolder?.email} onChange={setHolder('email')} />
                    <Field label="Phone" type="tel" placeholder="+1 (555) 123-4567" value={reservationHolder?.phone} onChange={setHolder('phone')} />
                </div>
            </section>

            <section>
                <h5 className="fw-bold mb-3">Passengers</h5>
                <div className="d-flex flex-column gap-2">
                    {Array.from({ length: count }).map((_, i) => (
                        <div key={i} className="row g-2 align-items-center">
                            <div className="col-auto fw-bold text-primary" style={{ width: '2.5rem' }}>#{i + 1}</div>
                            <Field col={5} placeholder="Name" value={passengersData[i]?.firstName} onChange={setPassenger(i, 'firstName')} />
                            <Field col={5} placeholder="Surname" value={passengersData[i]?.lastName} onChange={setPassenger(i, 'lastName')} />
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default PassengerDetails;
