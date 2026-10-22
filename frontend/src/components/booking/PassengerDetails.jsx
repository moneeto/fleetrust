'use client';

import React from 'react';
import { User, Users } from 'lucide-react';
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
        <div className="d-flex flex-column gap-3">
            <section className={styles.section}>
                <h5 className={styles.title}>
                    <User size={18} /> Reservation holder
                    <span className={styles.hint}>Name and email required</span>
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
                    <Users size={18} /> Passengers
                    <span className={styles.hint}>Name required</span>
                </h5>
                <div className="d-flex flex-column gap-2">
                    {Array.from({ length: count }).map((_, i) => (
                        <div key={i} className={styles.passengerRow}>
                            <span className={styles.badge}>{i + 1}</span>
                            <div className="row g-2 flex-grow-1">
                                <Field col={6} placeholder="Name" value={passengersData[i]?.firstName} onChange={setPassenger(i, 'firstName')} />
                                <Field col={6} placeholder="Surname" value={passengersData[i]?.lastName} onChange={setPassenger(i, 'lastName')} />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default PassengerDetails;
