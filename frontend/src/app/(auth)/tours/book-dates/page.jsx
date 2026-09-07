'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from "next/navigation";
import { Modal, ModalBody, Button, FormGroup, Label, Input } from 'reactstrap';
import { FaCheckCircle, FaChevronLeft, FaChevronRight, FaInfoCircle } from 'react-icons/fa';
import moment from 'moment';

import SelectDateTime from '@/components/booking/SelectDateTime';
import SelectDateRange from '@/components/booking/SelectDateRange';
import SelectPassengersNumber from '@/components/booking/SelectPassengersNumber';
import PassengerDetails from '@/components/booking/PassengerDetails';
import SelectBookingType from '@/components/booking/SelectBookingType';
import SelectOfferCategory from '@/components/booking/SelectOfferCategory';
import { ApiComunicator } from '@/helpers/ApiComunicator';
import styles from './page.module.css';

export default function BookDatesPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [routes, setRoutes] = useState([]);
    const [experiences, setExperiences] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [selectedExperience, setSelectedExperience] = useState(null);
    const [offerCategory, setOfferCategory] = useState(null); // 'tour' | 'experience'
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
    const [pilots, setPilots] = useState([]);
    const [idAircraft, setIdAircraft] = useState("all");
    const [idPilot, setIdPilot] = useState("");
    const [reservationId, setReservationId] = useState(null);
    const [customLength, setCustomLength] = useState(false);
    const [dateRange, setDateRange] = useState({ from: null, to: null });
    const [timeRange, setTimeRange] = useState({ start: "07:00", end: "07:00" });

    useEffect(() => {
        if (bookingType === 'others') {
            setPassengersData(prev =>
                Array.from({ length: passengers }, (_, i) => prev[i] || { firstName: '', lastName: '' })
            );
        }
    }, [passengers, bookingType]);

    useEffect(() => {
        getAircrafts();
        getPilots();
        getRoutes();
        getExperiences();
    }, []);

    const getRoutes = async () => {
        try {
            const res = await ApiComunicator(`/routes/getRoutes`, 'GET');
            setRoutes(res.routes || []);
        } catch (err) { console.error(err); }
    };

    const getExperiences = async () => {
        try {
            const res = await ApiComunicator(`/experiences/getExperiences`, 'GET');
            setExperiences((res.experiences || []).filter((e) => e.code !== 'STAN'));
        } catch (err) { console.error(err); }
    };

    const getAircrafts = async () => {
        try {
            const res = await ApiComunicator(`/aircrafts/`, 'GET');
            setAircrafts(res.aircrafts || []);
        } catch (err) { console.error(err); }
    };

    const getPilots = async () => {
        try {
            const res = await ApiComunicator(`/pilots`, 'GET');
            setPilots(res.pilots || []);
        } catch (err) { console.error(err); }
    };

    const resetPilotFlow = () => {
        setCustomLength(false);
        setDateRange({ from: null, to: null });
        setTimeRange({ start: "07:00", end: "07:00" });
        setDate('');
        setTime('');
        setIdAircraft("all");
        setIdPilot("");
    };

    const resetOfferSelection = () => {
        setOfferCategory(null);
        setSelectedRoute(null);
        setSelectedExperience(null);
    };

    const handleBack = () => {
        if (step === 1) {
            setBookingType(null);
            resetPilotFlow();
            resetOfferSelection();
            setPassengers(2);
        }
        if (bookingType === 'others' && step === 2) {
            setSelectedRoute(null);
            setSelectedExperience(null);
        }
        setStep((prev) => prev - 1);
    };

    const handleNext = async () => {
        setError(null);
        // Draft se crea al salir del schedule (step 4 en others)
        if (bookingType === 'others' && step === 4) {
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
                notes,
                reservationHolder: {},
                idAircraft,
                idPilot: idPilot || null,
            };

            if (bookingType === 'me') {
                data.routeCode = 'BAS';
            } else if (offerCategory === 'experience') {
                data.experienceCode = selectedExperience;
            } else {
                data.routeCode = selectedRoute;
            }

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
                idAircraft, idPilot: idPilot || null, notes
            });
            if (res.success) setShowSuccessModal(true);
        } catch (err) {
            if (err.overlapping) { setOverlappingData(err); setShowErrorModal(true); }
            else setError(err.message);
        } finally { setLoading(false); }
    };

    const isDetailsValid = reservationHolder.firstName.trim() !== '' &&
        reservationHolder.email.trim() !== '' &&
        (bookingType === 'me' || passengersData.every(p => p.firstName?.trim() !== ''));

    const setStepTitle = () => {
        if (step === 0) return 'Booking Experience';
        if (bookingType === 'me') return 'Schedule your Flight';
        const titles = [
            'Tour or Experience',
            offerCategory === 'experience' ? 'Select Experience' : 'Select Tour',
            'Passengers',
            'Flight Schedule',
            'Confirm Details',
        ];
        return titles[step - 1] || '';
    };

    const clientVisibleRoutes = routes.filter(
        (route) => route.visibleToClients !== 0 && route.visibleToClients !== false
    );

    const offerSelected =
        offerCategory === 'experience' ? !!selectedExperience : !!selectedRoute;

    const nextDisabled =
        (bookingType === 'others' && step === 1 && !offerCategory) ||
        (bookingType === 'others' && step === 2 && !offerSelected) ||
        (bookingType === 'others' && step === 4 && (!date || !time || !idPilot));

    const renderOfferCard = (item, selected, onClick) => (
        <div key={item.code} className="col-12" onClick={onClick}>
            <div
                className={`p-4 border rounded-4 cursor-pointer transition-all ${selected ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'hover-bg-light'}`}
                style={{ cursor: 'pointer', border: selected ? undefined : '2px solid transparent' }}
            >
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 className="fw-bold mb-1">{item.title}</h6>
                        <p className="text-muted small mb-0">{item.description}</p>
                    </div>
                    {selected && <FaCheckCircle className="text-primary" size={20} />}
                </div>
            </div>
        </div>
    );

    return (
        <div className={styles.page}>

            <div className={styles.header}>
                <h2 className="fw-bold text-dark">{setStepTitle()}</h2>
                <div className="d-flex justify-content-center gap-2 mt-3">
                    {[0, 1, 2, 3, 4, 5].slice(0, bookingType === 'me' ? 2 : 6).map((s) => (
                        <div key={s} className={`rounded-pill ${step >= s ? 'bg-primary' : 'bg-light'}`}
                            style={{ width: '40px', height: '6px', transition: '0.3s' }} />
                    ))}
                </div>
            </div>

            <div className={styles.cardShell}>
                <div className={styles.cardBody}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25 }}
                        >
                            {/* STEP 0: Piloto / Pasajeros */}
                            {step === 0 && (
                                <div className="py-4">
                                    <SelectBookingType onSelect={(type) => { setBookingType(type); setStep(1); }} />
                                </div>
                            )}

                            {/* STEP 1 (Others): Tour o Experience */}
                            {bookingType === 'others' && step === 1 && (
                                <div className="py-4">
                                    <SelectOfferCategory
                                        onSelect={(category) => {
                                            setOfferCategory(category);
                                            setSelectedRoute(null);
                                            setSelectedExperience(null);
                                            setStep(2);
                                        }}
                                    />
                                </div>
                            )}

                            {/* STEP 2 (Others): Lista de tours o experiences */}
                            {bookingType === 'others' && step === 2 && (
                                <div className="row g-3">
                                    {offerCategory === 'experience'
                                        ? experiences.map((experience) =>
                                            renderOfferCard(
                                                experience,
                                                selectedExperience === experience.code,
                                                () => setSelectedExperience(experience.code)
                                            )
                                        )
                                        : clientVisibleRoutes.map((route) =>
                                            renderOfferCard(
                                                route,
                                                selectedRoute === route.code,
                                                () => setSelectedRoute(route.code)
                                            )
                                        )}
                                    {offerCategory === 'experience' && experiences.length === 0 && (
                                        <p className="text-muted text-center">No experiences available.</p>
                                    )}
                                    {offerCategory === 'tour' && clientVisibleRoutes.length === 0 && (
                                        <p className="text-muted text-center">No tours available.</p>
                                    )}
                                </div>
                            )}

                            {/* STEP 3 (Others): Pasajeros */}
                            {bookingType === 'others' && step === 3 && (
                                <div className="text-center py-4">
                                    <SelectPassengersNumber count={passengers} onCountChange={setPassengers} />
                                </div>
                            )}

                            {/* STEP 1 (Me) o STEP 4 (Others): Aircraft + fecha/hora */}
                            {((bookingType === 'me' && step === 1) || (bookingType === 'others' && step === 4)) && (
                                <div className={styles.scheduleStack}>
                                    <div className={styles.settingsPanel}>
                                        {bookingType === 'me' ? (
                                            <Label className="fw-bold small text-uppercase text-muted mb-3 d-block">Settings</Label>
                                        ) : null}

                                        <FormGroup className="mb-3">
                                            <Label className="small fw-bold" for="selectAircraft">
                                                Select Aircraft {customLength ? '(*)' : ''}
                                            </Label>
                                            <Input
                                                id="selectAircraft"
                                                type="select"
                                                className="form-select rounded-3"
                                                value={idAircraft}
                                                onChange={(e) => {
                                                    setIdAircraft(e.target.value);
                                                    setDate('');
                                                    setTime('');
                                                    setDateRange({ from: null, to: null });
                                                    setTimeRange({ start: '07:00', end: '07:00' });
                                                }}
                                            >
                                                <option value="all">Any Available</option>
                                                {aircrafts.map((a) => (
                                                    <option key={a.idAircraft} value={a.idAircraft}>
                                                        {a.aircraft}
                                                    </option>
                                                ))}
                                            </Input>
                                        </FormGroup>

                                        <FormGroup className="mb-3">
                                            <Label className="small fw-bold" for="selectPilot">
                                                Select Pilot (*)
                                            </Label>
                                            <Input
                                                id="selectPilot"
                                                type="select"
                                                className="form-select rounded-3"
                                                value={idPilot}
                                                onChange={(e) => setIdPilot(e.target.value)}
                                            >
                                                <option value="">Select a pilot</option>
                                                {pilots.map((p) => (
                                                    <option key={p.idPilot} value={p.idPilot}>
                                                        {p.pilotName}
                                                    </option>
                                                ))}
                                            </Input>
                                        </FormGroup>

                                        {bookingType === 'me' && (
                                            <FormGroup check className="mb-0">
                                                <Input
                                                    type="checkbox"
                                                    id="toggleRange"
                                                    checked={customLength}
                                                    onChange={(e) => {
                                                        setCustomLength(e.target.checked);
                                                        setDate('');
                                                        setTime('');
                                                        setDateRange({ from: null, to: null });
                                                        setTimeRange({ start: '07:00', end: '07:00' });
                                                    }}
                                                />
                                                <Label check for="toggleRange" className="small">
                                                    Select date range
                                                </Label>
                                            </FormGroup>
                                        )}
                                    </div>

                                    <div className={styles.scheduleMain}>
                                        {customLength ? (
                                            <SelectDateRange
                                                range={dateRange}
                                                timeRange={timeRange}
                                                onDateChange={setDateRange}
                                                onTimeChange={setTimeRange}
                                            />
                                        ) : (
                                            <SelectDateTime
                                                date={date}
                                                time={time}
                                                onDateChange={setDate}
                                                onTimeChange={setTime}
                                                idAircraft={idAircraft}
                                                experienceCode={
                                                    offerCategory === 'experience' ? selectedExperience : null
                                                }
                                            />
                                        )}
                                    </div>

                                    <div className={styles.settingsPanel}>
                                        <FormGroup className="mb-0">
                                            <Label className="small fw-bold">Notes (optional)</Label>
                                            <Input
                                                type="textarea"
                                                className="rounded-3"
                                                rows={4}
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder=""
                                            />
                                        </FormGroup>
                                    </div>
                                </div>
                            )}

                            {/* STEP 5 (Others): Detalles finales */}
                            {bookingType === 'others' && step === 5 && (
                                <PassengerDetails
                                    count={passengers} passengersData={passengersData} setPassengersData={setPassengersData}
                                    notes={notes} setNotes={setNotes} reservationHolder={reservationHolder} setReservationHolder={setReservationHolder}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {step > 0 && (
                    <div className={styles.navBar}>
                        <Button color="link" className="text-decoration-none text-muted fw-bold" onClick={handleBack} disabled={loading}>
                            <FaChevronLeft className="me-2" /> Back
                        </Button>

                        <div className="d-flex gap-3">
                            {(() => {
                                const isLast = (bookingType === 'me' && step === 1) || (bookingType === 'others' && step === 5);
                                if (!isLast) {
                                    return (
                                        <Button
                                            color="primary"
                                            className="px-5 py-2 rounded-pill fw-bold shadow-sm"
                                            onClick={handleNext}
                                            disabled={nextDisabled || loading}
                                        >
                                            Next <FaChevronRight className="ms-2" />
                                        </Button>
                                    );
                                }
                                return (
                                    <Button
                                        color="success"
                                        className="px-5 py-2 rounded-pill fw-bold shadow-sm"
                                        onClick={customLength ? handleSubmitRange : confirmBooking}
                                        disabled={loading || !idPilot || (bookingType === 'others' && !isDetailsValid)}
                                    >
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
                    <button
                        type="button"
                        className="btn-close ms-3"
                        aria-label="Close"
                        onClick={() => setError(null)}
                        style={{ fontSize: '0.8rem', filter: 'invert(0.5)' }}
                    ></button>
                </motion.div>
            )}

            <Modal isOpen={showSuccessModal} centered contentClassName="border-0 rounded-4 shadow-lg text-center p-4">
                <ModalBody>
                    <div className="mb-4"><FaCheckCircle className="text-success" size={60} /></div>
                    <h3 className="fw-bold">Reservation Confirmed!</h3>
                    <p className="text-muted">
                        Your flight for <strong>{date}</strong> is ready.
                        {reservationHolder?.email ? (
                            <> A boarding pass was sent to <strong>{reservationHolder.email}</strong>.</>
                        ) : null}
                    </p>
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
