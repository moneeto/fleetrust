'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SelectDateTime from '@/components/booking/SelectDateTime';
import SelectPassengersNumber from '@/components/booking/SelectPassengersNumber';
import PassengerDetails from '@/components/booking/PassengerDetails';
import SelectBookingType from '@/components/booking/SelectBookingType';
import { ApiComunicator } from '@/helpers/ApiComunicator';
import { useRouter } from "next/navigation";
import { Modal, ModalBody, Button, Form, FormGroup, Label, Input, FormText } from 'reactstrap';
import { FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import styles from "./page.module.css";
import { InfoIcon } from 'lucide-react';
import SelectDateRange from '@/components/booking/SelectDateRange';

export default function BookDatesPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
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
    const [aircrafts, setAircrafts] = useState([]);
    const [idAircraft, setIdAircraft] = useState(null)
    const [reservationId, setReservationId] = useState(null);

    useEffect(() => {
        if (bookingType === 'others') {
            setPassengersData(
                Array.from({ length: passengers }, (_, i) =>
                    passengersData[i] || { firstName: '', lastName: '' }
                )
            );
        }
    }, [passengers, bookingType]);

    useEffect(() => {
        getAircrafts();
        getRoutes();
    }, []);
    // Obtener listado de tours/routes
    const getRoutes = async () => {
        try {
            const res = await ApiComunicator(`/routes/getRoutes`, 'GET');
            setRoutes(res.routes);
        } catch (err) {
            // Opcional: setError(err.message);
        }
    };

    const [customLength, setCustomLength] = useState(false);
    const [dateRange, setDateRange] = useState({ from: null, to: null });

    const nextStep = () => setStep((prev) => prev + 1);
    const prevStep = () => {
        if (bookingType == 'me' && step === 1) {
            setBookingType(null);
        }
        setStep((prev) => prev - 1);
    }

    const handleBack = () => {
        prevStep();
    }

    const createDraftReservation = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = {
                reservationDate: date,
                reservationTime: time,
                passengerCount: bookingType === 'me' ? 1 : passengers,
                passengers: [],
                routeCode: bookingType === 'me' ? "BAS" : selectedRoute,
                notes: notes,
                reservationHolder: {},
                idAircraft: idAircraft
            };
            const res = await ApiComunicator(
                `/reservations/createReservation`,
                'POST',
                data
            );
            if (res && res.id) {
                setReservationId(res.id);
            } else {
                throw new Error(res.message || 'Could not create draft reservation.');
            }
            return res;
        } catch (err) {
            setError(err.message || String(err));
            return null;
        } finally {
            setLoading(false);
        }
    }

    const confirmBooking = async () => {
        try {
            setLoading(true);
            setError(null);
            let targetId = reservationId;
            if (!targetId) {
                // If no draft exists, create it first (handles 'me' flow)
                const draft = await createDraftReservation();
                if (!draft || !draft.id) {
                    setError('No draft reservation to confirm.');
                    return;
                }
                setReservationId(draft.id);
                targetId = draft.id;
            }
            const data = {
                idReservation: targetId,
                passengers: bookingType === 'me' ? [] : passengersData,
                reservationHolder: reservationHolder,
                notes: notes
            };
            const res = await ApiComunicator(`/reservations/confirmBooking`, 'POST', data);
            if (res.success) {
                setShowSuccessModal(true);
            } else {
                setError(res.message || 'Could not confirm reservation.');
            }
        } catch (err) {
            setError(err.message || String(err));
        } finally {
            setLoading(false);
        }
    }

    const handleNext = async () => {
        setError(null);
        // If we're on the 'others' date/time step (step 3) and advancing, create draft reservation
        if (bookingType === 'others' && step === 3) {
            const draft = await createDraftReservation();
            if (draft && draft.id) {
                setStep((s) => s + 1);
            }
            return;
        }
        setStep((s) => s + 1);
    }

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
                routeCode: bookingType === 'me' ? "BAS" : selectedRoute,
                notes: notes,
                reservationHolder: reservationHolder,
                idAircraft: idAircraft
            };
            const res = await ApiComunicator(
                `/reservations/createReservation`,
                'POST',
                data
            );
            if (res.success) {
                setShowSuccessModal(true);
            } else {
                setError(res.message || 'Could not create reservation.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmitRange() {
        try {
            setLoading(true);
            setError(null);
            if (!dateRange.from || !dateRange.to || !idAircraft) {
                setError('Please select aircraft and both start/end date and time.');
                setLoading(false);
                return;
            }
            const res = await ApiComunicator(
                `/reservations/createReservationRange`,
                'POST',
                {
                    startDate: dateRange.from,
                    endDate: dateRange.to,
                    idAircraft: idAircraft
                }
            );
            if (res.success) {
                setShowSuccessModal(true);
            } else {
                setError(res.message || 'Could not block range.');
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
                case 1: return 'Select Tour';
                case 2: return 'Select the passenger number';
                case 3: return 'Select Date & Time';
                case 4: return 'Details';
                default: return '';
            }
        }
        return '';
    }

    const getAircrafts = async () => {
        try {
            const res = await ApiComunicator(`/aircrafts/`, 'GET');
            setAircrafts(res.aircrafts);
        } catch (err) {

        }
    }


    return (
        <div className="max-w-2xl mx-auto flex flex-column gap-4">
            <h4 className="fw-bold mb-2">{setStepTitle()}</h4>


            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Step 0: Select Booking Type */}
                    {step === 0 && (
                        <SelectBookingType onSelect={(type) => {
                            setBookingType(type);
                            if (type === 'me') {
                                setStep(1);
                            } else {
                                setStep(1);
                            }
                        }} />
                    )}

                    {/* Step 1: If 'others', select tour */}
                    {bookingType === 'others' && step === 1 && (
                        <div className="mb-4">
                            <Label className="fw-semibold mb-2">Select a tour</Label>
                            <div className="d-flex flex-column gap-3">
                                {routes && routes.length > 0 ? (
                                    routes.map((route) => (
                                        <div
                                            key={route.idRoute || route.code}
                                            className={`border rounded p-3 ${selectedRoute === route.code ? 'border-primary bg-light' : ''}`}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => setSelectedRoute(route.code)}
                                        >
                                            <div className="fw-bold">{route.title}</div>
                                            <div className="text-muted small">{route.description}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-muted">No tours available.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 1 or 2: If 'me', select date/time. If 'others', select passengers */}
                    {(bookingType === 'me' && step === 1) && (
                        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                            <div style={{ flex: 2 }}>
                                {customLength ? (
                                    <SelectDateRange
                                        range={dateRange}
                                        onDateChange={(range) => setDateRange(range)}
                                        idAircraft={idAircraft}
                                    />
                                ) : (
                                    <SelectDateTime
                                        date={date}
                                        time={time}
                                        onDateChange={setDate}
                                        onTimeChange={setTime}
                                        idAircraft={idAircraft}
                                    />
                                )}
                            </div>
                            <div style={{ flex: 1, minWidth: 220 }}>
                                <Form>
                                    <FormGroup className="mb-2">
                                        <Label for="firstName" className="fw-semibold">Aircraft</Label>
                                        <Input
                                            type="select"
                                            id="idAircraft"
                                            value={idAircraft}
                                            onChange={e => setIdAircraft(e.target.value)}
                                            placeholder="Select aircraft"
                                        >
                                            <option value="all">ALL</option>
                                            {aircrafts && aircrafts.length > 0 && aircrafts.map((aircraft) => (
                                                <option key={aircraft.idAircraft} value={aircraft.idAircraft}>
                                                    {aircraft.aircraft} - {aircraft.registrationNumber}
                                                </option>
                                            ))}
                                        </Input>
                                    </FormGroup>
                                </Form>
                            </div>
                        </div>
                    )}

                    {/* For 'others', show aircraft selector in the date/time step only ONCE */}
                    {bookingType === 'others' && step === 3 && (
                        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                            <div style={{ flex: 2 }}>
                                <SelectDateTime
                                    date={date}
                                    time={time}
                                    onDateChange={setDate}
                                    onTimeChange={setTime}
                                    idAircraft={idAircraft}
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: 220 }}>
                                <Form>
                                    <FormGroup className="mb-2">
                                        <Label for="firstName" className="fw-semibold">Aircraft</Label>
                                        <Input
                                            type="select"
                                            id="idAircraft"
                                            value={idAircraft}
                                            onChange={e => setIdAircraft(e.target.value)}
                                            placeholder="Select aircraft"
                                        >
                                            <option value="all">ALL</option>
                                            {aircrafts && aircrafts.length > 0 && aircrafts.map((aircraft) => (
                                                <option key={aircraft.idAircraft} value={aircraft.idAircraft}>
                                                    {aircraft.aircraft} - {aircraft.registrationNumber}
                                                </option>
                                            ))}
                                        </Input>
                                    </FormGroup>
                                </Form>
                            </div>
                        </div>
                    )}

                    {bookingType === 'others' && step === 2 && (
                        <SelectPassengersNumber
                            count={passengers}
                            onCountChange={setPassengers}
                        />
                    )}

                    {bookingType === 'others' && step === 4 && (
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

            {/* Navigation buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
                {step > 0 && (
                    <button
                        className="btn btn-outline-secondary px-5 me-auto"
                        onClick={handleBack}
                        disabled={loading}
                    >
                        Back
                    </button>
                )}

                {(() => {
                    let isLastStep = false;
                    if (bookingType === 'me' && step === 1) isLastStep = true;
                    if (bookingType === 'others' && step === 4) isLastStep = true;
                    if (step === 0) return null;
                    if (isLastStep) {
                        // Si es 'me' y toggle de rango, usar handleSubmitRange
                        if (bookingType === 'me' && customLength) {
                            return (
                                <button
                                    className="btn btn-success px-5"
                                    disabled={loading || !dateRange.from || !dateRange.to || !idAircraft}
                                    onClick={handleSubmitRange}
                                >
                                    {loading ? 'Loading...' : 'Confirm'}
                                </button>
                            );
                        } else {
                            return (
                                <button
                                    className="btn btn-success px-5"
                                    disabled={
                                        loading ||
                                        (bookingType === 'me' && (!date || !time)) ||
                                        (bookingType === 'others' && !isStep3Valid)
                                    }
                                    onClick={confirmBooking}
                                >
                                    {loading ? 'Loading...' : 'Confirm'}
                                </button>
                            );
                        }
                    } else {
                        return (
                            <button
                                className="btn btn-primary px-5"
                                onClick={handleNext}
                                disabled={
                                    (step === 2 && bookingType === 'others' && !passengers) || (step === 3 && bookingType === 'others' && (!date || !time))
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