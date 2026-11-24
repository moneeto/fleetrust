'use client';

import React from 'react';
import { Table } from 'reactstrap';
import styles from '@/components/ui/listing.module.css';

const COLUMNS = [
    ['firstName', 'First name', 'text'],
    ['lastName', 'Last name', 'text'],
    ['email', 'Email', 'email'],
    ['phone', 'Phone', 'tel'],
    ['weight', 'Weight', 'number'],
    ['birthdate', 'Birth date', 'date'],
    ['document', 'Document', 'text']
];

// Una fila por asiento. people[0] es el reservation holder.
// Tabla en desktop y tarjetas en mobile, igual que el resto de los listados (se renderizan las dos, CSS muestra una).
const PassengerDetails = ({ capacity, people, setPeople }) => {
    const setField = (i, field) => (e) => setPeople((prev) => {
        const next = Array.from({ length: capacity }, (_, k) => prev[k] || {});
        next[i] = { ...next[i], [field]: e.target.value };
        return next;
    });

    const seats = Array.from({ length: capacity }, (_, i) => i);
    // El color va en las celdas/tarjeta: el fondo de la <tr> queda tapado por el de cada <td>
    const tint = (i) => (i === 0 ? { background: '#e8f1ff' } : undefined);
    const input = (i, [field, label, type]) => (
        <input
            type={type}
            aria-label={`${label} ${i + 1}`}
            className="form-control form-control-sm"
            style={{ minWidth: 110 }}
            value={people[i]?.[field] || ''}
            onChange={setField(i, field)}
            {...(type === 'number' ? { min: 0, step: '0.1' } : {})}
        />
    );

    return (
        <div>
            <p className="small fw-bold">Passengers list</p>
            <div className={`${styles.tableCard} ${styles.desktopOnly}`}>
                <Table>
                    <thead>
                        <tr>
                            <th></th>
                            {COLUMNS.map(([field, label]) => <th key={field}>{label}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {seats.map((i) => (
                            <tr key={i}>
                                <td className={i === 0 ? 'fw-bold' : ''} style={tint(i)}>{i === 0 ? 'Holder' : ''}</td>
                                {COLUMNS.map((col) => <td key={col[0]} style={tint(i)}>{input(i, col)}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            <div className={`${styles.cardsList} ${styles.mobileOnly}`}>
                {seats.map((i) => (
                    <div key={i} className={styles.card} style={tint(i)}>
                        <div className={styles.cardHead}>
                            <h3 className={styles.cardTitle}>{i === 0 ? 'Holder' : `Passenger ${i + 1}`}</h3>
                        </div>
                        <div className={styles.cardMeta} style={{ marginBottom: 0 }}>
                            {COLUMNS.map((col) => (
                                <div key={col[0]} className={col[0] === 'email' ? styles.cardMetaFull : ''}>
                                    <span className={styles.cardMetaLabel}>{col[1]}</span>
                                    {input(i, col)}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PassengerDetails;
