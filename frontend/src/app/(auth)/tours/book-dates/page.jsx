'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from "next/navigation";
import { Modal, ModalBody, Button, FormGroup, Label, Input } from 'reactstrap';
import { FaCheckCircle, FaRegCalendarAlt, FaUserFriends, FaPlaneDeparture, FaChevronLeft, FaChevronRight, FaInfoCircle } from 'react-icons/fa';
import moment from 'moment';

// Componentes locales (Asumo que ya existen según tu código original)
import SelectDateTime from '@/components/booking/SelectDateTime';
import SelectDateRange from '@/components/booking/SelectDateRange';
import SelectPassengersNumber from '@/components/booking/SelectPassengersNumber';
import PassengerDetails from '@/components/booking/PassengerDetails';
import SelectBookingType from '@/components/booking/SelectBookingType';
import { ApiComunicator } from '@/helpers/ApiComunicator';

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
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [overlappingData, setOverlappingData] = useState(null);
    const [passengersData, setPassengersData] = useState([]);
    const [notes, setNotes] = useState('');
    const [reservationHolder, setReservationHolder] = useState({
        firstName: '', lastName: '', email: '', phone: ''
    });
    const [aircrafts, setAircrafts] = useState([]);
    const [idAircraft, setIdAircraft] = useState("all");
    const [reservationId, setReservationId] = useState(null);
    const [customLength, setCustomLength] = useState(false);
    const [dateRange, setDateRange] = useState({ from: null, to: null });
    const [timeRange, setTimeRange] = useState({ start: "07:00", end: "07:00" });

    // --- LÓGICA DE DATOS ---
    useEffect(() => {
        if (bookingType === 'others') {
            setPassengersData(prev =>
                Array.from({ length: passengers }, (_, i) => prev[i] || { firstName: '', lastName: '' })
            );
        }
    }, [passengers, bookingType]);

    useEffect(() => {
        getAircrafts();
        getRoutes();
    }, []);

    const getRoutes = async () => {
        try {
            const res = await ApiComunicator(`/routes/getRoutes`, 'GET');
            setRoutes(res.routes);
        } catch (err) { console.error(err); }
    };

    const getAircrafts = async () => {
        try {
            const res = await ApiComunicator(`/aircrafts/`, 'GET');
            setAircrafts(res.aircrafts);
        } catch (err) { console.error(err); }
    };

    // --- NAVEGACIÓN Y ACTIONS ---
    const handleBack = () => {
        // Si estamos en el primer paso después de elegir tipo, reseteamos todo al volver al menú principal
        if (step === 1) {
            setBookingType(null);
            resetPilotFlow();
            setSelectedRoute(null);
            setPassengers(2);
        }
        setStep((prev) => prev - 1);
    };

    const handleNext = async () => {
        setError(null);
        if (bookingType === 'others' && step === 3) {
            const draft = await createDraftReservation();
            if (draft && draft.id) setStep((s) => s + 1);
            return;
        }
        setStep((s) => s + 1);
    };

    const createDraftReservation = async () => {
        try {
            setLoading(true);
            const data = {
                reservationDate: date,
                reservationTime: time,
                passengerCount: bookingType === 'me' ? 1 : passengers,
                passengers: [],
                routeCode: bookingType === 'me' ? "BAS" : selectedRoute,
                notes,
                reservationHolder: {},
                idAircraft
            };
            const res = await ApiComunicator(`/reservations/createReservation`, 'POST', data);
            if (res?.id) setReservationId(res.id);
            return res;
        } catch (err) {
            setError(err.message || "Error creating draft");
            return null;
        } finally { setLoading(false); }
    };

    const confirmBooking = async () => {
        try {
            setLoading(true);
            let targetId = reservationId;
            if (!targetId) {
                const draft = await createDraftReservation();
                if (!draft?.id) return;
                targetId = draft.id;
            }
            const data = {
                idReservation: targetId,
                passengers: bookingType === 'me' ? [] : passengersData,
                reservationHolder,
                notes
            };
            const res = await ApiComunicator(`/reservations/confirmBooking`, 'POST', data);
            if (res.success) setShowSuccessModal(true);
            else setError(res.message || 'Could not confirm.');
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const handleSubmitRange = async () => {
        try {
            setLoading(true);
            if (!dateRange.from || !dateRange.to) return setError('Select date range');
            const res = await ApiComunicator(`/reservations/createReservationRange`, 'POST', {
                startDate: moment(dateRange.from).format('YYYY-MM-DD') + 'T' + timeRange.start + ':00',
                endDate: moment(dateRange.to).format('YYYY-MM-DD') + 'T' + timeRange.end + ':00',
                idAircraft, notes
            });
            if (res.success) setShowSuccessModal(true);
        } catch (err) {
            if (err.overlapping) { setOverlappingData(err); setShowErrorModal(true); }
            else setError(err.message);
        } finally { setLoading(false); }
    };

    // --- RENDER HELPERS ---
    const isStep3Valid = reservationHolder.firstName.trim() !== '' &&
        reservationHolder.email.trim() !== '' &&
        (bookingType === 'me' || passengersData.every(p => p.firstName?.trim() !== ''));

    const setStepTitle = () => {
        if (step === 0) return 'Booking Experience';
        if (bookingType === 'me') return 'Schedule your Flight';
        const titles = ['Select Tour', 'Passengers', 'Flight Schedule', 'Confirm Details'];
        return titles[step - 1] || '';
    };
  
    // --- NAVEGACIÓN Y LIMPIEZA ---
    const resetPilotFlow = () => {
        setCustomLength(false);
        setDateRange({ from: null, to: null });
        setTimeRange({ start: "07:00", end: "07:00" });
        setDate('');
        setTime('');
        setIdAircraft("all");
    };

    return (
        <div className="container py-5" style={{ maxWidth: '1200px', fontFamily: 'Inter, sans-serif' }}>

            {/* Header & Progress */}
            <div className="text-center mb-5">
                <h2 className="fw-bold text-dark">{setStepTitle()}</h2>
                <div className="d-flex justify-content-center gap-2 mt-3">
                    {[0, 1, 2, 3, 4].slice(0, bookingType === 'me' ? 2 : 5).map((s) => (
                        <div key={s} className={`rounded-pill ${step >= s ? 'bg-primary' : 'bg-light'}`}
                            style={{ width: '40px', height: '6px', transition: '0.3s' }} />
                    ))}
                </div>
            </div>

            <div className="bg-white shadow-lg border-0 rounded-4 overflow-hidden">
                <div className="p-4 p-md-5">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25 }}
                        >
                            {/* STEP 0: Tipo de Reserva */}
                            {step === 0 && (
                                <div className="py-4">
                                    <SelectBookingType onSelect={(type) => { setBookingType(type); setStep(1); }} />
                                </div>
                            )}

                            {/* STEP 1 (Others): Selección de Tour */}
                            {bookingType === 'others' && step === 1 && (
                                <div className="row g-3">
                                    {routes.map((route) => (
                                        <div key={route.code} className="col-12" onClick={() => setSelectedRoute(route.code)}>
                                            <div className={`p-4 border rounded-4 cursor-pointer transition-all ${selectedRoute === route.code ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'hover-bg-light'}`}
                                                style={{ cursor: 'pointer', border: '2px solid transparent' }}>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <h6 className="fw-bold mb-1">{route.title}</h6>
                                                        <p className="text-muted small mb-0">{route.description}</p>
                                                    </div>
                                                    {selectedRoute === route.code && <FaCheckCircle className="text-primary" size={20} />}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* STEP 2 (Others): Pasajeros */}
                            {bookingType === 'others' && step === 2 && (
                                <div className="text-center py-4">
                                    <SelectPassengersNumber count={passengers} onCountChange={setPassengers} />
                                </div>
                            )}

                            {/* STEP 1 (Me) o STEP 3 (Others): Fecha y Hora */}
                            {((bookingType === 'me' && step === 1) || (bookingType === 'others' && step === 3)) && (
                                <div className="row g-4">
                                    <div className="col-lg-8 border-end pe-lg-4">
                                        {customLength ? (
                                            <SelectDateRange range={dateRange} timeRange={timeRange} onDateChange={setDateRange} onTimeChange={setTimeRange} />
                                        ) : (
                                            <SelectDateTime date={date} time={time} onDateChange={setDate} onTimeChange={setTime} idAircraft={idAircraft} />
                                        )}
                                    </div>
                                    <div className="col-lg-4">
                                        <div className="bg-light p-4 rounded-4">
                                            {bookingType === 'me' ? <Label className="fw-bold small text-uppercase text-muted mb-3">Settings</Label> : <></>}

                                            {bookingType === 'me' && (
                                                <FormGroup check className="mb-4">
                                                    <Input type='checkbox' id="toggleRange" onChange={(e) => setCustomLength(e.target.checked)} />
                                                    <Label check for="toggleRange" className="small">Select date range</Label>
                                                </FormGroup>
                                            )}

                                            <FormGroup className="mb-4">
                                                <Label className="small fw-bold">Select Aircraft {customLength ? '(*)' : ''}</Label>
                                                <Input type="select" className="form-select-sm rounded-3" value={idAircraft} onChange={e => setIdAircraft(e.target.value)}>
                                                    <option value="all">Any Available</option>
                                                    {aircrafts.map(a => <option key={a.idAircraft} value={a.idAircraft}>{a.aircraft}</option>)}
                                                </Input>
                                            </FormGroup>

                                            <FormGroup className="mb-0">
                                                <Label className="small fw-bold">Notes (optional)</Label>
                                                <Input type="textarea" className="rounded-3" rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="" />
                                            </FormGroup>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: Detalles Finales */}
                            {bookingType === 'others' && step === 4 && (
                                <PassengerDetails
                                    count={passengers} passengersData={passengersData} setPassengersData={setPassengersData}
                                    notes={notes} setNotes={setNotes} reservationHolder={reservationHolder} setReservationHolder={setReservationHolder}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation Bar */}
                {step > 0 && (
                    <div className="bg-light p-4 d-flex justify-content-between align-items-center">
                        <Button color="link" className="text-decoration-none text-muted fw-bold" onClick={handleBack} disabled={loading}>
                            <FaChevronLeft className="me-2" /> Back
                        </Button>

                        <div className="d-flex gap-3">
                            {(() => {
                                let isLast = (bookingType === 'me' && step === 1) || (bookingType === 'others' && step === 4);
                                if (!isLast) {
                                    return (
                                        <Button color="primary" className="px-5 py-2 rounded-pill fw-bold shadow-sm" onClick={handleNext}
                                            disabled={(step === 1 && bookingType === 'others' && !selectedRoute) || (step === 3 && !date)}>
                                            Next <FaChevronRight className="ms-2" />
                                        </Button>
                                    );
                                }
                                return (
                                    <Button color="success" className="px-5 py-2 rounded-pill fw-bold shadow-sm"
                                        onClick={customLength ? handleSubmitRange : confirmBooking}
                                        disabled={loading || (bookingType === 'others' && !isStep3Valid)}>
                                        {loading ? 'Processing...' : 'Complete Booking'}
                                    </Button>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="alert alert-danger mt-4 rounded-4 shadow-sm border-0 d-flex align-items-center justify-content-between"
                >
                    <div className="d-flex align-items-center">
                        <FaInfoCircle className="me-2" />
                        <span>{error}</span>
                    </div>

                    {/* Botón de cierre (la cruz) */}
                    <button
                        type="button"
                        className="btn-close ms-3"
                        aria-label="Close"
                        onClick={() => setError(null)}
                        style={{ fontSize: '0.8rem', filter: 'invert(0.5)' }} // Ajuste estético opcional
                    ></button>
                </motion.div>
            )}

            {/* MODALS (Success & Error) */}
            <Modal isOpen={showSuccessModal} centered contentClassName="border-0 rounded-4 shadow-lg text-center p-4">
                <ModalBody>
                    <div className="mb-4"><FaCheckCircle className="text-success" size={60} /></div>
                    <h3 className="fw-bold">Reservation Confirmed!</h3>
                    <p className="text-muted">Your flight for <strong>{date}</strong> is ready.</p>
                    <Button color="success" className="w-100 py-2 rounded-pill fw-bold mt-3" onClick={() => router.push('/tours/bookings')}>Finish</Button>
                </ModalBody>
            </Modal>

            <Modal isOpen={showErrorModal} centered contentClassName="border-0 rounded-4 shadow-lg p-4" toggle={() => setShowErrorModal(false)}>
                <ModalBody className="text-center">
                    <h5 className="fw-bold text-danger mb-3">Scheduling Conflict</h5>
                    <p className="small text-muted">{overlappingData?.message || 'Selected time is unavailable.'}</p>
                    <ul className="text-start list-unstyled bg-light p-3 rounded-3 small">
                        {overlappingData?.overlapping?.map((item, i) => (
                            <li key={i} className="mb-1">• {item.startDate} to {item.endDate}</li>
                        ))}
                    </ul>
                    <Button color="danger" className="w-100 py-2 rounded-pill mt-3" onClick={() => setShowErrorModal(false)}>Retry</Button>
                </ModalBody>
            </Modal>
        </div>
    );
}