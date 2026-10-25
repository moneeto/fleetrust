'use client';

import React from 'react';
import styles from './PassengerDetails.module.css';

const Field = ({ col = 6, label, type = 'text', placeholder, value, onChange }) => (
    <div className={`col-12 col-md-${col}`}>
        {label && <label className="small fw-bold text-muted text-uppercase mb-1 d-block">{label}</label>}
        <input
            type={type}
            className="form-control rounded-3"
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
            <section className={styles.section}>
                <h5 className={styles.title}>
                    Reservation holder
                    <span className={styles.hint}>First name and email required</span>
                </h5>
                <div className="row g-3">
                    <Field label="First name" placeholder="John" value={reservationHolder?.firstName} onChange={setHolder('firstName')} />
                    <Field label="Last name" placeholder="Doe" value={reservationHolder?.lastName} onChange={setHolder('lastName')} />
                    <Field label="Email" type="email" placeholder="john.doe@example.com" value={reservationHolder?.email} onChange={setHolder('email')} />
                    <Field label="Phone" type="tel" placeholder="+1 (555) 123-4567" value={reservationHolder?.phone} onChange={setHolder('phone')} />
                </div>
            </section>

            <section className={styles.section}>
                <h5 className={styles.title}>
                    Passengers
                    <span className={styles.hint}>First name required</span>
                </h5>
                <div className="d-flex flex-column gap-3">
                    {Array.from({ length: count }).map((_, i) => (
                        <div key={i} className={styles.passengerRow}>
                            <div className="fw-bold small mb-2">Passenger {i + 1}</div>
                            <div className="row g-3">
                                <Field label="First name" value={passengersData[i]?.firstName} onChange={setPassenger(i, 'firstName')} />
                                <Field label="Last name" value={passengersData[i]?.lastName} onChange={setPassenger(i, 'lastName')} />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default PassengerDetails;
