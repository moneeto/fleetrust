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
import PassengerDetails from '@/components/booking/PassengerDetails';
import { ApiComunicator } from '@/helpers/ApiComunicator';
import styles from './page.module.css';

export default function BookDatesPage({ initialDate = "", initialTime = "", onDone } = {}) {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    // 'MANUAL' = Pilot (single): bloquea horario del piloto, sin pasajeros
    const bookingType = selectedService ? (selectedService === 'MANUAL' ? 'me' : 'others') : null;
    const [date, setDate] = useState(initialDate);
    const [time, setTime] = useState(initialTime);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [overlappingData, setOverlappingData] = useState(null);
    const [people, setPeople] = useState([]);
    const [notes, setNotes] = useState('');
    const [aircrafts, setAircrafts] = useState([]);
    const [pilots, setPilots] = useState([]);
    const [idAircraft, setIdAircraft] = useState("all");
    const [idPilot, setIdPilot] = useState("");
    const [reservationId, setReservationId] = useState(null);
    const [customLength, setCustomLength] = useState(false);
    const [dateRange, setDateRange] = useState({ from: null, to: null });
    const [timeRange, setTimeRange] = useState({ start: "07:00", end: "07:00" });
    const [openDays, setOpenDays] = useState([]);

    useEffect(() => {
        getAircrafts();
        getPilots();
        getServices();
        ApiComunicator("/business-hours", "GET")
            .then((res) => {
                const days = [...new Set((res.hours || []).filter((row) => Number(row.available) === 1).map((row) => Number(row.day)))];
                setOpenDays(days);
            })
            .catch(() => setOpenDays([]));
    }, []);

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

    const handleBack = () => setStep((prev) => prev - 1);

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
                passengerCount: bookingType === 'me' ? 1 : guests.length,
                passengers: [],
                notes,
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
                passengers: bookingType === 'me' ? [] : guests,
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

    // Capacidad: la del avion elegido o, con "Any Available", la mayor entre los disponibles
    const capacity = Math.max(1, ...aircrafts
        .filter((a) => idAircraft === 'all' ? a.available : String(a.idAircraft) === String(idAircraft))
        .map((a) => Number(a.capacity)));
    // Filas usadas: las que tienen algun dato, sin pasar la capacidad. La primera es el holder.
    const guests = people.slice(0, capacity)
        .map((p) => Object.fromEntries(Object.entries(p || {}).map(([k, v]) => [k, String(v).trim()])))
        .filter((p) => Object.values(p).some(Boolean));
    const holder = people[0] || {};
    const isDetailsValid = ['firstName', 'email', 'phone'].every((k) => holder[k]?.trim()) &&
        guests.every((p) => p.firstName);

    // Pantallas: 0 vuelo + piloto + fecha/hora, 1 datos, 2 resumen
    const titles = ['New Book', 'Details', 'Summary'];
    const isLast = step === 2;

    const clientServices = services.filter(
        (service) => service.code !== 'MANUAL' && service.visibleToClients !== 0 && service.visibleToClients !== false && !service.deleted
    );

    const serviceCode = selectedService;
    const product = services.find((item) => item.code === serviceCode);

    const scheduleReady = customLength ? !!(dateRange.from && dateRange.to) : !!(date && time);
    const nextDisabled =
        (step === 0 && (!selectedService || !idPilot || !scheduleReady)) ||
        (step === 1 && bookingType === 'others' && !isDetailsValid);

    const fmt = (d) => moment(d).format('MMM D, YYYY');
    const summaryRows = [
        ['Flight', bookingType === 'me' ? 'Pilot (single)' : product?.title],
        ['Aircraft', idAircraft === 'all' ? 'Any Available' : aircrafts.find((a) => String(a.idAircraft) === String(idAircraft))?.aircraft],
        ['Pilot', pilots.find((p) => String(p.idPilot) === String(idPilot))?.pilotName],
        ['When', customLength
            ? `${fmt(dateRange.from)} ${timeRange.start} → ${fmt(dateRange.to)} ${timeRange.end}`
            : `${fmt(date)} ${time}`],
        ...(bookingType === 'others' ? [
            ['Passengers', guests.length],
            ['Reservation holder', `${holder.firstName || ''} ${holder.lastName || ''}`.trim()],
            ['Email', holder.email],
            ['Phone', holder.phone],
            ['Passenger names', guests.map((p) => `${p.firstName || ''} ${p.lastName || ''}`.trim()).join(', ')],
        ] : []),
        ['Notes', notes],
    ];

    return (
        <div className={styles.page}>

            <div className={styles.header}>
                <h2 className="fw-bold text-dark">{titles[step]}</h2>
                <div className="d-flex justify-content-center gap-2 mt-3">
                    {titles.map((_, s) => (
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
                            {step === 0 && (
                                <div className={styles.scheduleStack}>
                                    <div className="row g-3">
                                        <div className="col-12 col-md-4">
                                            <FormGroup className="mb-0">
                                                <Label className="small fw-bold" for="selectService">Select Flight (*)</Label>
                                                <Input
                                                    id="selectService"
                                                    type="select"
                                                    className="form-select rounded-3"
                                                    value={selectedService || ''}
                                                    onChange={(e) => {
                                                        setSelectedService(e.target.value || null);
                                                        // el rango de fechas solo existe para Pilot (single)
                                                        if (e.target.value !== 'MANUAL') setCustomLength(false);
                                                    }}
                                                >
                                                    <option value="">Select a flight</option>
                                                    <option value="MANUAL">Pilot (single)</option>
                                                    {clientServices.map((service) => (
                                                        <option key={service.code} value={service.code}>{service.title}</option>
                                                    ))}
                                                </Input>
                                            </FormGroup>
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <FormGroup className="mb-0">
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
                                                        <option key={a.idAircraft} value={a.idAircraft}>{a.aircraft}</option>
                                                    ))}
                                                </Input>
                                            </FormGroup>
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <FormGroup className="mb-0">
                                                <Label className="small fw-bold" for="selectPilot">Select Pilot (*)</Label>
                                                <Input
                                                    id="selectPilot"
                                                    type="select"
                                                    className="form-select rounded-3"
                                                    value={idPilot}
                                                    onChange={(e) => setIdPilot(e.target.value)}
                                                >
                                                    <option value="">Select a pilot</option>
                                                    {pilots.map((p) => (
                                                        <option key={p.idPilot} value={p.idPilot}>{p.pilotName}</option>
                                                    ))}
                                                </Input>
                                            </FormGroup>
                                        </div>
                                    </div>

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
                                            <Label check for="toggleRange" className="small">Select date range</Label>
                                        </FormGroup>
                                    )}

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
                                                allowedWeekdays={openDays}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            {step === 1 && (
                                <div className={styles.scheduleStack}>
                                    {bookingType === 'others' && (
                                        <PassengerDetails
                                            capacity={capacity}
                                            people={people} setPeople={setPeople}
                                        />
                                    )}
                                    <div className={styles.settingsPanel}>
                                        <FormGroup className="mb-0">
                                            <Label className="small fw-bold">Notes (optional)</Label>
                                            <Input
                                                type="textarea"
                                                className="rounded-3"
                                                rows={3}
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                            />
                                        </FormGroup>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className={styles.narrow}>
                                    {summaryRows.filter(([, v]) => v).map(([k, v]) => (
                                        <div key={k} className="d-flex justify-content-between gap-3 py-2 border-bottom">
                                            <span className="text-muted small fw-bold">{k}</span>
                                            <span className="text-end">{v}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {(
                    <div className={styles.navBar}>
                        {step > 0 ? (
                            <Button color="link" className="text-decoration-none text-muted fw-bold" onClick={handleBack} disabled={loading}>
                                <FaChevronLeft className="me-2" /> Back
                            </Button>
                        ) : <span />}

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
                                        disabled={loading}
                                    >
                                        {loading ? 'Processing...' : 'Confirm'}
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
                {holder.email ? <> A boarding pass was sent to {holder.email}.</> : null}
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
