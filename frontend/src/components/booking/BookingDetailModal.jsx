"use client";

import { useEffect, useState } from "react";
import { FormGroup, Label, Input, Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { FaEdit, FaTimes } from "react-icons/fa";
import MessageModal from "@/components/ui/MessageModal";
import moment from "moment";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { useToast } from "@/components/ui/use-toast";

export default function BookingDetailModal({ idReservation, onClose, onChanged, onBack }) {
    const [reservation, setReservation] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editFormData, setEditFormData] = useState(null);
    const [errorModal, setErrorModal] = useState({ show: false, message: "" });
    const [deleteConfirmModal, setDeleteConfirmModal] = useState({ show: false, idReservation: null });
    const [cancellationReasons, setCancellationReasons] = useState([]);
    const [selectedCancellationReason, setSelectedCancellationReason] = useState(null);
    const [cancellationDetail, setCancellationDetail] = useState("");
    const [pilots, setPilots] = useState([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    function close() {
        onClose?.();
    }


    useEffect(() => {
        if (!idReservation) return;
        setReservation(null);
        setEditFormData(null);
        let cancelled = false;
        ApiComunicator("/pilots", "GET").then((res) => {
            if (!cancelled) setPilots(res?.pilots || []);
        }).catch(() => {});
        ApiComunicator("/reservations/cancellationReasons", "GET").then((res) => {
            if (!cancelled) setCancellationReasons(res?.cancellationReasons || []);
        }).catch(() => {});
        loadReservation(idReservation);
        return () => { cancelled = true; };
    }, [idReservation]);

    async function loadReservation(id) {
        try {
            setLoading(true)
            let reserv = await ApiComunicator(`/reservations/getReservationById`, "POST", { id });
            setReservation(reserv)
            setEditFormData(reserv)
        } catch (error) {
            let message = "An error occurred while getting the reservation details.";
            if (error.message) { message = error.message }
            toast({
                variant: "destructive",
                title: "Error",
                description: message
            });
        } finally {
            setLoading(false)
        }
    }

    const handleSaveReservation = async () => {
        try {
            setLoading(true);
            const updateData = {
                idReservation: editFormData.idReservation,
                name: editFormData.name,
                lastname: editFormData.lastname,
                email: editFormData.email,
                phoneNumber: editFormData.phoneNumber,
                notes: editFormData.notes,
                startDate: editFormData.startDate,
                endDate: editFormData.endDate,
                idRoute: editFormData.idRoute,
                idExperience: editFormData.idExperience,
                idAircraft: editFormData.idAircraft,
                idPilot: editFormData.idPilot
            };

            const response = await ApiComunicator(`/reservations/updateReservation`, "POST", updateData);

            if (response.success) {
                await loadReservation(editFormData.idReservation);
                onChanged?.();
                setIsEditMode(false);
                toast({
                    variant: "default",
                    title: "Success",
                    description: "Reservation updated successfully"
                });
            }
        } catch (error) {
            let errorMessage = "An error occurred while updating the reservation.";

            console.log(error);

            if (error?.mensaje) {
                errorMessage = error.mensaje;
            } else if (error?.message) {
                errorMessage = error.message;
            } else if (typeof error === "string") {
                errorMessage = error;
            }

            setErrorModal({ show: true, message: errorMessage });
        } finally {
            setLoading(false);
        }
    }

    const handleEditChange = (field, value) => {
        setEditFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }

    const cancel = () => {
        setSelectedCancellationReason(null);
        setCancellationDetail("");
        setDeleteConfirmModal({ show: true, idReservation: reservation?.idReservation });
    }

    const confirmDelete = async () => {
        try {
            setLoading(true);
            const response = await ApiComunicator(`/reservations/deleteReservation`, "POST", {
                idReservation: deleteConfirmModal.idReservation,
                idCancellationReason: selectedCancellationReason.idCancellationReason,
                cancellationDetail: selectedCancellationReason.cancellationReason.toUpperCase() === 'OTHER' ? cancellationDetail : null
            });

            if (response.success) {
                setDeleteConfirmModal({ show: false, idReservation: null });
                setSelectedCancellationReason(null);
                setCancellationDetail("");
                toast({
                    variant: "default",
                    title: "Success",
                    description: "Reservation deleted successfully"
                });
                onChanged?.();
                onClose?.();
            }
        } catch (error) {
            console.log(error);
            let errorMessage = "An error occurred while deleting the reservation.";

            if (error && error.message) {
                errorMessage = error.message;
            } else if (error && typeof error === 'string') {
                errorMessage = error;
            }

            setErrorModal({ show: true, message: errorMessage });
        } finally {
            setLoading(false);
        }
    }

    const reservationAddons = reservation?.addons || [];
    let addonsTotal = 0;
    for (let i = 0; i < reservationAddons.length; i++) {
        addonsTotal += reservationAddons[i].price * reservationAddons[i].quantity;
    }

    return (
        <>
            <Modal
                isOpen={!!idReservation}
                centered
                size="lg"
                toggle={close}
                onClosed={() => {
                    if (idReservation) return;
                    setReservation(null);
                    setEditFormData(null);
                    setIsEditMode(false);
                }}
            >
                <ModalHeader
                    toggle={close}
                    style={{ backgroundColor: '#1e1e1e', color: 'white' }}
                >
                    <span style={{ color: 'white' }}>Booking #{reservation?.codeReservation}</span>
                </ModalHeader>

                <ModalBody style={{ padding: '0' }}>
                    {reservation && editFormData ? (
                        <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>

                            {!isEditMode ? (
                                <>
                                    {(reservation?.startDate || reservation?.endDate) && (
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '20px',
                                            borderBottom: '1px solid #f0f0f0',
                                            paddingBottom: '15px'
                                        }}>
                                            {reservation?.startDate && (
                                                <div style={{ textAlign: 'left' }}>
                                                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>Start</span>
                                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                                                        {moment(reservation.startDate).format("MMM DD, YYYY - HH:mm")}
                                                    </div>
                                                </div>
                                            )}
                                            {reservation?.endDate && (
                                                <div style={{ textAlign: 'left' }}>
                                                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>End</span>
                                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                                                        {moment(reservation.endDate).format("MMM DD, YYYY - HH:mm")}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div style={{
                                        display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #f0f0f0',
                                        paddingBottom: '15px'
                                    }}>
                                        {reservation?.service && (
                                            <div style={{ flex: '1 1 40%' }}>
                                                <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Flight Type</label>
                                                <span style={{ fontWeight: '600', color: '#222' }}>{reservation.service}</span>
                                            </div>
                                        )}
                                        {reservation?.passengers?.length > 0 && (
                                            <div style={{ flex: '1 1 40%' }}>
                                                <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Passengers</label>
                                                <span style={{ fontWeight: '600', color: '#222' }}>{reservation.passengers.length} passengers</span>
                                            </div>
                                        )}
                                        {(reservation?.name || reservation?.lastname) && (
                                            <div style={{ flex: '1 1 40%' }}>
                                                <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Client Name</label>
                                                <span style={{ fontWeight: '600', color: '#222' }}>{[reservation?.name, reservation?.lastname].filter(Boolean).join(" ")}</span>
                                            </div>
                                        )}
                                        {reservation?.phoneNumber && (
                                            <div style={{ flex: '1 1 40%' }}>
                                                <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Phone Number</label>
                                                <span style={{ fontWeight: '600', color: '#222' }}>{reservation.phoneNumber}</span>
                                            </div>
                                        )}
                                        {(reservation?.aircraft || reservation?.registrationNumber) && (
                                            <div style={{ flex: '1 1 40%' }}>
                                                <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Aircraft</label>
                                                <span style={{ fontWeight: '600', color: '#222' }}>
                                                    {reservation.aircraft}{reservation.registrationNumber ? ` (${reservation.registrationNumber})` : ""}
                                                </span>
                                            </div>
                                        )}
                                        {reservation?.email && (
                                            <div style={{ flex: '1 1 40%' }}>
                                                <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Email Address</label>
                                                <span style={{ fontWeight: '600', color: '#222' }}>{reservation.email}</span>
                                            </div>
                                        )}
                                        {reservation?.pilotName && (
                                            <div style={{ flex: '1 1 40%' }}>
                                                <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Pilot</label>
                                                <span style={{ fontWeight: '600', color: '#222' }}>{reservation.pilotName}</span>
                                            </div>
                                        )}
                                    </div>
                                    {reservation?.passengers?.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
                                            {reservation.passengers.map((passenger, index) => (
                                                (passenger.name || passenger.lastname) && (
                                                    <div key={'pssgr-' + index}>
                                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                            Passenger #{index + 1}
                                                        </label>
                                                        <span style={{ fontWeight: '600', color: '#222' }}>{[passenger.name, passenger.lastname].filter(Boolean).join(" ")}</span>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    )}

                                    {reservationAddons.length > 0 && (
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '6px' }}>Addons</label>
                                            <div style={{ maxHeight: '88px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '4px' }}>
                                                {reservationAddons.map((addon) => (
                                                    <div key={addon.idAddon} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '6px 10px', fontSize: '13px', color: '#222', borderBottom: '1px solid #f5f5f5' }}>
                                                        <span style={{ fontWeight: '600' }}>{addon.addon} × {addon.quantity}</span>
                                                        <span>{Number(addon.price) === 0 ? 'Included' : `$${addon.price * addon.quantity}`}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {reservation?.notes && (
                                        <>
                                            <div style={{ borderBottom: '1px solid #f0f0f0', marginBottom: '20px' }}></div>
                                            <div style={{
                                                backgroundColor: '#b8d1ffff',
                                                borderLeft: '5px solid #007bff',
                                                padding: '16px',
                                                borderRadius: '4px',
                                                marginTop: '20px',
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    marginBottom: '8px',
                                                    fontWeight: 'bold',
                                                    color: "#000000ff",
                                                    fontSize: '11px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    CUSTOMER NOTES
                                                </div>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: '14px',
                                                    color: '#000000',
                                                    lineHeight: '1.5',
                                                    fontStyle: 'italic',
                                                    fontWeight: '500'
                                                }}>
                                                    "{reservation.notes}"
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* Edit Mode */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
                                        <div style={{ flex: '1 1 45%', minWidth: '200px' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>Start Date & Time</label>
                                            <input
                                                type="datetime-local"
                                                value={editFormData?.startDate ? moment(editFormData.startDate).format('YYYY-MM-DDTHH:mm') : ''}
                                                onChange={(e) => handleEditChange('startDate', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    fontSize: '14px',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 45%', minWidth: '200px' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>End Date & Time</label>
                                            <input
                                                type="datetime-local"
                                                value={editFormData?.endDate ? moment(editFormData.endDate).format('YYYY-MM-DDTHH:mm') : ''}
                                                onChange={(e) => handleEditChange('endDate', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    fontSize: '14px',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 45%', minWidth: '200px' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>First Name</label>
                                            <input
                                                type="text"
                                                value={editFormData?.name || ''}
                                                onChange={(e) => handleEditChange('name', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    fontSize: '14px',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 45%', minWidth: '200px' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>Last Name</label>
                                            <input
                                                type="text"
                                                value={editFormData?.lastname || ''}
                                                onChange={(e) => handleEditChange('lastname', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    fontSize: '14px',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 45%', minWidth: '200px' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>Email</label>
                                            <input
                                                type="email"
                                                value={editFormData?.email || ''}
                                                onChange={(e) => handleEditChange('email', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    fontSize: '14px',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 45%', minWidth: '200px' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>Phone Number</label>
                                            <input
                                                type="tel"
                                                value={editFormData?.phoneNumber || ''}
                                                onChange={(e) => handleEditChange('phoneNumber', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    fontSize: '14px',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 45%', minWidth: '200px' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>Pilot</label>
                                            <select
                                                value={editFormData.idPilot ? editFormData.idPilot : ""}
                                                onChange={(e) => handleEditChange('idPilot', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    fontSize: '14px',
                                                    fontFamily: 'inherit'
                                                }}
                                            >
                                                <option value="">Select a pilot</option>
                                                {pilots.map((p) => (
                                                    <option key={p.idPilot} value={p.idPilot}>
                                                        {p.pilotName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{ flex: '1 1 100%' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>Notes</label>
                                            <textarea
                                                value={editFormData?.notes || ''}
                                                onChange={(e) => handleEditChange('notes', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    fontSize: '14px',
                                                    fontFamily: 'inherit',
                                                    minHeight: '80px',
                                                    resize: 'vertical'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                        </div>
                    ) : (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                            <p>Loading reservation details...</p>
                        </div>
                    )}
                </ModalBody>

                {reservation && (
                    <ModalFooter style={{ backgroundColor: '#fff', display: 'block', textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', color: '#333', marginBottom: '6px' }}>
                            <span>{reservation.service}</span>
                            <span style={{ marginLeft: '16px' }}>${reservation.totalValue - addonsTotal}</span>
                        </div>
                        {addonsTotal > 0 && (
                            <div style={{ fontSize: '14px', color: '#333', marginBottom: '6px' }}>
                                <span>Addons</span>
                                <span style={{ marginLeft: '16px' }}>${addonsTotal}</span>
                            </div>
                        )}
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#111', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                            <span>Total</span>
                            <span style={{ marginLeft: '16px' }}>${reservation.totalValue}</span>
                        </div>
                    </ModalFooter>
                )}

                <ModalFooter style={{ backgroundColor: '#f8f9fa' }}>
                    {!isEditMode ? (
                        <>
                            <Button
                                style={{ fontSize: '13px', fontWeight: '600' }}
                                color="danger"
                                onClick={() => cancel()}
                            >
                                <FaTimes /> Cancel reservation
                            </Button>
                            <Button
                                style={{ fontSize: '13px', fontWeight: '600' }}
                                color="primary"
                                onClick={() => setIsEditMode(true)}
                            >
                                <FaEdit /> Edit
                            </Button>
                            {onBack && (
                                <Button style={{ fontSize: '13px', fontWeight: '600' }} color="secondary" outline onClick={onBack}>
                                    Back
                                </Button>
                            )}
                            <Button
                                style={{ fontSize: '13px', fontWeight: '600' }}
                                color="secondary"
                                outline
                                onClick={close}
                            >
                                Close
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                style={{ fontSize: '13px', fontWeight: '600' }}
                                color="success"
                                onClick={handleSaveReservation}
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button
                                style={{ fontSize: '13px', fontWeight: '600' }}
                                color="secondary"
                                outline
                                onClick={() => {
                                    setIsEditMode(false);
                                    setEditFormData(reservation);
                                }}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                        </>
                    )}
                </ModalFooter>
            </Modal>

            <MessageModal
                isOpen={errorModal.show}
                type="error"
                title="Error updating reservation"
                onClose={() => setErrorModal({ show: false, message: "" })}
            >
                {errorModal.message}
            </MessageModal>

            <MessageModal
                isOpen={deleteConfirmModal.show}
                type="confirm"
                title="Confirm deletion"
                confirmLabel={loading ? "Canceling..." : "Cancel reservation"}
                confirmColor="danger"
                disabled={loading}
                confirmDisabled={!selectedCancellationReason || (selectedCancellationReason.cancellationReason.toUpperCase() === "OTHER" && !cancellationDetail)}
                onClose={() => {
                    setDeleteConfirmModal({ show: false, idReservation: null });
                    setSelectedCancellationReason(null);
                    setCancellationDetail("");
                }}
                onConfirm={confirmDelete}
            >
                <p style={{ marginBottom: "8px", fontWeight: 600 }}>Are you sure you want to cancel this reservation?</p>
                <p style={{ marginBottom: "16px", color: "#666", fontSize: "13px" }}>This action will cancel the reservation and make the slot available again.</p>
                <FormGroup>
                    <Label for="cancellationReason">Cancellation reason</Label>
                    <Input
                        id="cancellationReason"
                        type="select"
                        value={selectedCancellationReason ? selectedCancellationReason.idCancellationReason : ""}
                        onChange={(e) => {
                            const selected = cancellationReasons.find(r => r.idCancellationReason == e.target.value);
                            setSelectedCancellationReason(selected);
                            setCancellationDetail("");
                        }}
                    >
                        <option value="">Select a reason</option>
                        {cancellationReasons.map((r) => (
                            <option key={r.idCancellationReason} value={r.idCancellationReason}>{r.cancellationReason}</option>
                        ))}
                    </Input>
                </FormGroup>
                {selectedCancellationReason && selectedCancellationReason.cancellationReason.toUpperCase() === "OTHER" && (
                    <FormGroup>
                        <Label for="cancellationDetail">Detail</Label>
                        <Input id="cancellationDetail" type="textarea" value={cancellationDetail} onChange={(e) => setCancellationDetail(e.target.value)} />
                    </FormGroup>
                )}
            </MessageModal>

        </>
    );
}
