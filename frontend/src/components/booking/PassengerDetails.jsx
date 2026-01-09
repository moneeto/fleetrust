'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

const PassengerDetails = ({ count, passengersData, setPassengersData, notes, setNotes, reservationHolder, setReservationHolder }) => {
    
    // Manejador para los campos del Titular
    const handleHolderChange = (field, value) => {
        setReservationHolder(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Manejador para los campos de los Pasajeros
    const handleChange = (index, field, value) => {
        const updatedData = [...passengersData];
        updatedData[index] = { ...updatedData[index], [field]: value };
        setPassengersData(updatedData);
    };

    return (
        <div className="passenger-details-stack d-flex flex-column gap-3">
            
            {/* Reservation Holder - Estilo Unificado */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl border-2 border-sky-200"
            >
                <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-bold text-slate-900 mb-0">Reservation Holder</h3>
                </div>

                <div className="flex flex-column gap-2">
                    {/* Nombre y Apellido */}
                    <div className="d-flex gap-2">
                        <div className="flex-grow-1">
                            <label className="fw-bold small text-primary text-uppercase mb-1 d-block">First Name</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="John"
                                value={reservationHolder?.firstName}
                                onChange={(e) => handleHolderChange('firstName', e.target.value)}
                            />
                        </div>
                        <div className="flex-grow-1">
                            <label className="fw-bold small text-primary text-uppercase mb-1 d-block">Last Name</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Doe"
                                value={reservationHolder?.lastName}
                                onChange={(e) => handleHolderChange('lastName', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Email y Teléfono */}
                    <div className="d-flex gap-2 mt-2">
                        <div className="flex-grow-1">
                            <label className="fw-bold small text-primary text-uppercase mb-1 d-block">Email</label>
                            <input
                                type="email"
                                className="form-control"
                                placeholder="john.doe@example.com"
                                value={reservationHolder?.email}
                                onChange={(e) => handleHolderChange('email', e.target.value)}
                            />
                        </div>
                        <div className="flex-grow-1">
                            <label className="fw-bold small text-primary text-uppercase mb-1 d-block">Phone</label>
                            <input
                                type="tel"
                                className="form-control"
                                placeholder="+1 (555) 123-4567"
                                value={reservationHolder?.phone}
                                onChange={(e) => handleHolderChange('phone', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            <hr />

            <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-bold text-slate-900 mb-0">Passengers</h3>
            </div>

            {/* Pasajeros */}
            {Array.from({ length: count }).map((_, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex-grow-1">
                        <label className="fw-bold small text-primary text-uppercase mb-1 d-block">
                            Passenger #{i + 1}
                        </label>
                        <div className="d-flex gap-2 mb-2">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Name"
                                value={passengersData[i]?.firstName || ''}
                                onChange={(e) => handleChange(i, 'firstName', e.target.value)}
                            />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Surname"
                                value={passengersData[i]?.lastName || ''}
                                onChange={(e) => handleChange(i, 'lastName', e.target.value)}
                            />
                        </div>
                    </div>
                </motion.div>
            ))}

            <div className="mt-4">
                <h3 className="h5 fw-bold">Notes (optional)</h3>
                <textarea 
                    className="form-control" 
                    placeholder="Add any notes here" 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ minHeight: "120px", borderRadius: "15px" }} 
                />
            </div>
        </div>
    );
};

export default PassengerDetails;