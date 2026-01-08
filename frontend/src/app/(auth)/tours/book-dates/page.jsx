'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SelectDateTime from '@/components/booking/SelectDateTime';
import SelectPassengersNumber from '@/components/booking/SelectPassengersNumber';
import PassengerDetails from '@/components/booking/PassengerDetails';
import SelectBookingType from '@/components/booking/SelectBookingType';
import { ApiComunicator } from '@/helpers/ApiComunicator';
import { useRouter } from "next/navigation";
import { Modal, ModalBody, Button } from 'reactstrap';
import { FaCheckCircle } from 'react-icons/fa';

export default function BookDatesPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [bookingType, setBookingType] = useState(null);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [passengers, setPassengers] = useState(2);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [passengersData, setPassengersData] = useState([]);
    const [notes, setNotes] = useState('');
    const [reservationHolder, setReservationHolder] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
});

    useEffect(() => {
        if (bookingType === 'others') {
            setPassengersData(
                Array.from({ length: passengers }, (_, i) =>
                    passengersData[i] || { firstName: '', lastName: '' }
                )
            );
        }
    }, [passengers, bookingType]);


    const nextStep = () => setStep((prev) => prev + 1);
    const prevStep = () => setStep((prev) => prev - 1);

const isStep3Valid = 
    reservationHolder.firstName.trim() !== '' && 
    reservationHolder.email.trim() !== '' && 
    (bookingType === 'me' || passengersData.every(p => p.firstName?.trim() !== ''));
    
    async function handleSubmit() {
        try {
            setLoading(true);
            setError(null);

            const data = {
                reservationDate: date,
                reservationTime: time,
                passengerCount: bookingType === 'me' ? 1 : passengers,
                passengers: bookingType === 'me' ? [] : passengersData,
                notes: notes,
                reservationHolder: bookingType === 'others' ? passengersData[0] : null
            };

            const res = await ApiComunicator(
                `/reservations/createReservation`,
                'POST',
                data
            );

            if (res.success) {
                setShowSuccessModal(true);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const handleCloseSuccess = () => {
        setShowSuccessModal(false);
        router.push('/tours/bookings');
    };

    const setStepTitle = () => {
        if (step === 0) return 'Select Booking Type';
        if (bookingType === 'me') {
            if (step === 1) return 'Select Date & Time';
        } else if (bookingType === 'others') {
            switch (step) {
                case 1: return 'Select the passenger number';
                case 2: return 'Select Date & Time';
                case 3: return 'Details';
                default: return '';
            }
        }
        return '';
    }

    return (
        <div className="max-w-2xl mx-auto p-4 flex flex-column gap-4">

            <h2 className="fw-bold mb-4">{setStepTitle()}</h2>

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {step === 0 && <SelectBookingType onSelect={(type) => { setBookingType(type); setStep(1); }} />}

                    {bookingType === 'me' && step === 1 && (
                        <SelectDateTime
                            date={date}
                            time={time}
                            onDateChange={setDate}
                            onTimeChange={setTime}
                        />
                    )}

                    {bookingType === 'others' && step === 1 && (
                        <SelectPassengersNumber
                            count={passengers}
                            onCountChange={setPassengers}
                        />
                    )}

                    {bookingType === 'others' && step === 2 && (
                        <SelectDateTime
                            date={date}
                            time={time}
                            onDateChange={setDate}
                            onTimeChange={setTime}
                        />
                    )}

                    {bookingType === 'others' && step === 3 && (
                        <PassengerDetails
                            count={passengers}
                            passengersData={passengersData}
                            setPassengersData={setPassengersData}
                            notes={notes}
                            setNotes={setNotes}
                            reservationHolder={reservationHolder}
                            setReservationHolder={setReservationHolder}
                        />
                    )}
                </motion.div>
            </AnimatePresence>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
                {step > 0 && (
                    <button
                        className="btn btn-outline-secondary px-5 me-auto"
                        onClick={prevStep}
                        disabled={loading}
                    >
                        Back
                    </button>
                )}

                {(() => {
                    const isLastStep =
                        (bookingType === 'me' && step === 1) ||
                        (bookingType === 'others' && step === 3);

                    if (step === 0) return null;

                    if (isLastStep) {
                        return (
                            <button
                                className="btn btn-success px-5"
                                disabled={
                                    loading ||
                                    (bookingType === 'me' && (!date || !time)) ||
                                    (bookingType === 'others' && !isStep3Valid)
                                }
                                onClick={handleSubmit}
                            >
                                {loading ? 'Loading...' : 'Confirm'}
                            </button>
                        );
                    } else {
                        return (
                            <button
                                className="btn btn-primary px-5"
                                onClick={nextStep}
                                disabled={
                                    (step === 1 && bookingType === 'others' && !passengers) || (step === 2 && bookingType === 'others' && (!date || !time)) 
                                }
                            >
                                Next
                            </button>
                        );
                    }
                })()}
            </div>

            {error && <p className="text-danger mt-3 text-center font-bold">{error}</p>}
            <Modal
                isOpen={showSuccessModal}
                centered
                contentClassName="border-0 rounded-2xl shadow-lg"
            >
                <ModalBody className="p-5 text-center">
                    <div className="mb-4 d-flex justify-content-center">
                        <div className="bg-success bg-opacity-10 p-3 rounded-circle">
                            <FaCheckCircle className="text-success" size={50} />
                        </div>
                    </div>

                    <h3 className="fw-bold text-dark mb-2">Reservation Created!</h3>
                    <p className="text-muted mb-4">
                        Your booking for <strong>{date}</strong> at <strong>{time?.slice(0, 5)}</strong> has been successfully registered.
                    </p>

                    <Button
                        color="success"
                        className="w-100 py-2 fw-bold rounded-xl"
                        onClick={handleCloseSuccess}
                    >
                        Finish
                    </Button>
                </ModalBody>
            </Modal>
        </div>
    );
}