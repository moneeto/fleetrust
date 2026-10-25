'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from "next/navigation";
import { Button, FormGroup, Label, Input } from 'reactstrap';
import MessageModal from '@/components/ui/MessageModal';
import { FaChevronLeft, FaChevronRight, FaInfoCircle } from 'react-icons/fa';
import moment from 'moment';

import SelectDateTime from '@/components/booking/SelectDateTime';
import SelectDateRange from '@/components/booking/SelectDateRange';
import SelectPassengersNumber from '@/components/booking/SelectPassengersNumber';
import PassengerDetails from '@/components/booking/PassengerDetails';
import SelectBookingType from '@/components/booking/SelectBookingType';
import { ApiComunicator } from '@/helpers/ApiComunicator';
import styles from './page.module.css';
import { defaultPassengerCount } from '@/helpers/bookingConfig';

export default function BookDatesPage({ initialDate = "", initialTime = "", onDone } = {}) {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [bookingType, setBookingType] = useState(null);
    const [date, setDate] = useState(initialDate);
    const [time, setTime] = useState(initialTime);
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
        getServices();
    }, []);

    useEffect(() => {
        const product = services.find((item) => item.code === selectedService);
        if (!product) return;
        setPassengers(defaultPassengerCount(product));
    }, [selectedService, services]);

    const getServices = async () => {
        try {
            const res = await ApiComunicator(`/services/getServices`, 'GET');
            setServices(res.services || []);
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
        setSelectedService(null);
    };

    const handleBack = () => {
        if (step === 1) {
            setBookingType(null);
            resetPilotFlow();
            resetOfferSelection();
            setPassengers(2);
        }
        setStep((prev) => prev - 1);
    };

    const handleNext = () => {
        setError(null);
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
                serviceCode,
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
        passengersData.every(p => p.firstName?.trim() !== '');

    // Pantallas del flujo; `current` es la clave de la pantalla activa
    const flow = bookingType === 'me'
        ? ['type', 'resource', 'when']
        : ['type', 'service', 'pax', 'resource', 'when'];
    const current = flow[step];
    const isLast = step === flow.length - 1;
    const titles = { type: 'New Book', service: 'Service', pax: 'Passengers', resource: 'Aircraft & Pilot', when: 'Date & Time' };

    const clientServices = services.filter(
        (service) => service.visibleToClients !== 0 && service.visibleToClients !== false && !service.deleted
    );

    const serviceCode = bookingType === 'me' ? 'MANUAL' : selectedService;
    const product = services.find((item) => item.code === serviceCode);

    const nextDisabled =
        (current === 'service' && !selectedService) ||
        (current === 'pax' && !isDetailsValid) ||
        (current === 'resource' && !idPilot);

    const renderOfferCard = (item, selected, onClick) => (
        <div key={item.code} className="col-12" onClick={onClick}>
            <div
                className={`p-4 border rounded-4 cursor-pointer transition-all ${selected ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'bg-white shadow-sm'}`}
                style={{ cursor: 'pointer', border: selected ? undefined : '2px solid transparent' }}
            >
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 className="fw-bold mb-1">{item.title}</h6>
                        <p className="text-muted small mb-0">{item.description}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className={styles.page}>

            <div className={styles.header}>
                <h2 className="fw-bold text-dark">{titles[current]}</h2>
                <div className="d-flex justify-content-center gap-2 mt-3">
                    {flow.map((_, s) => (
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
                            {current === 'type' && (
                                <div className="py-5">
                                    <SelectBookingType onSelect={(type) => { setBookingType(type); setStep(1); }} />
                                </div>
                            )}

                            {current === 'service' && (
                                <div className="row g-3">
                                    {clientServices.map((service) =>
                                        renderOfferCard(
                                            service,
                                            selectedService === service.code,
                                            () => setSelectedService(service.code)
                                        )
                                    )}
                                    {clientServices.length === 0 && (
                                        <p className="text-muted text-center">No services available.</p>
                                    )}
                                </div>
                            )}

                            {current === 'pax' && (
                                <div className={styles.scheduleStack}>
                                    <div className={styles.settingsPanel}>
                                        <SelectPassengersNumber
                                            count={passengers}
                                            onCountChange={setPassengers}
                                            prices={product?.prices}
                                        />
                                    </div>
                                    <PassengerDetails
                                        count={passengers} passengersData={passengersData} setPassengersData={setPassengersData}
                                        reservationHolder={reservationHolder} setReservationHolder={setReservationHolder}
                                    />
                                </div>
                            )}

                            {current === 'resource' && (
                                <div className={`${styles.scheduleStack} ${styles.narrow}`}>
                                    <div className={styles.settingsPanel}>
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
                                </div>
                            )}

                            {current === 'when' && (
                                <div className={styles.scheduleStack}>
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
                                                serviceCode={serviceCode}
                                                allowedWeekdays={product?.allowedWeekdays}
                                            />
                                        )}
                                    </div>

                                    <div className={styles.settingsPanel}>
                                        <FormGroup className="mb-0">
                                            <Label className="small fw-bold">Notes (optional)</Label>
                                            <Input
                                                type="textarea"
                                                className="rounded-3"
                                                rows={3}
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder=""
                                            />
                                        </FormGroup>
                                    </div>
                                </div>
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
                                if (!isLast) {
                                    return (
                                        <Button
                                            color="primary"
                                            className="px-4 px-md-5 py-2 rounded-pill fw-bold shadow-sm"
                                            onClick={handleNext}
                                            disabled={nextDisabled || loading}
                                        >
                                            Next <FaChevronRight className="ms-2" />
                                        </Button>
                                    );
                                }
                                return (
                                    <Button
                                        color="primary"
                                        className="px-4 px-md-5 py-2 rounded-pill fw-bold shadow-sm"
                                        onClick={customLength ? handleSubmitRange : confirmBooking}
                                        disabled={loading || (!customLength && (!date || !time))}
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

            <MessageModal
                isOpen={showSuccessModal}
                type="success"
                title="Reservation confirmed"
                confirmLabel="Finish"
                onClose={() => onDone ? onDone() : router.push('/operations/bookings')}
            >
                Your flight for {date} is ready.
                {reservationHolder?.email ? <> A boarding pass was sent to {reservationHolder.email}.</> : null}
            </MessageModal>

            <MessageModal
                isOpen={showErrorModal}
                type="error"
                title="Scheduling conflict"
                confirmLabel="Retry"
                onClose={() => setShowErrorModal(false)}
            >
                <p className="mb-2">{overlappingData?.message || "Selected time is unavailable."}</p>
                <ul className="mb-0">
                    {overlappingData?.overlapping?.map((item, i) => (
                        <li key={i}>{item.startDate} to {item.endDate}</li>
                    ))}
                </ul>
            </MessageModal>
        </div>
    );
}
