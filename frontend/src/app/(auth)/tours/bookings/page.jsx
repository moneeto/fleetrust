"use client";

import { useEffect, useState, useRef, use } from "react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { Form, FormGroup, Label, Input, Button, Table, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { FaArrowAltCircleRight, FaEdit, FaExclamationCircle, FaEye, FaPrint, FaTimes } from "react-icons/fa";
import moment from "moment";
import { useToast } from "@/components/ui/use-toast";
import { EditIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";

export default function ToursPage() {
    let today = moment().format("YYYY-MM-DD");
    const [date, setDate] = useState(today);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalDetail, setModalDetail] = useState({ show: false, reservation: null });
    const tableRef = useRef(null);
    const { toast } = useToast();
    const router = useRouter();
    const [reservation, setReservation] = useState(null);
    console.log(reservation);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editFormData, setEditFormData] = useState(null);
    const [errorModal, setErrorModal] = useState({ show: false, message: '' });
    const [deleteConfirmModal, setDeleteConfirmModal] = useState({ show: false, idReservation: null });

    function handlePrint() {
        // generate a tailored table for printing: pax instead of passengers, plus flight type and notes
        const buildTable = () => {
            const headerCols = [
                'Code', 'Starts at', 'Ends', 'Pax', 'Client', 'Email', 'Flight Type', 'Notes'
            ];

            const ths = headerCols.map(c => `<th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">${c}</th>`).join('');

            const rows = reservations.map(r => {
                const start = moment(r.startDate).format('HH:mm') +
                    (moment(r.startDate).format('YYYY-MM-DD') !== date ? ` ${moment(r.startDate).format('MMMM DD')}` : '');
                const end = moment(r.endDate).format('HH:mm') +
                    (moment(r.endDate).format('YYYY-MM-DD') !== moment(r.startDate).format('YYYY-MM-DD') ?
                        ` ${moment(r.endDate).format('MMMM DD')}` : '');
                const pax = r.passengers ? r.passengers : '-';
                const client = r.name && r.lastname ? `${r.name} ${r.lastname}` : '-';
                const email = r.email ? r.email : '-';
                const flightType = r.route ? r.route : '-';
                const notes = r.notes ? r.notes : '-';
                return `<tr>
                    <td class="px-4 py-3 text-sm">#${r.codeReservation}</td>
                    <td class="px-4 py-3 text-sm">${start}</td>
                    <td class="px-4 py-3 text-sm">${end}</td>
                    <td class="px-4 py-3 text-sm">${pax}</td>
                    <td class="px-4 py-3 text-sm">${client}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${email}</td>
                    <td class="px-4 py-3 text-sm">${flightType}</td>
                    <td class="px-4 py-3 text-sm">${notes}</td>
                </tr>`;
            }).join('');

            return `<table>
                    <thead style="background: #f3f4f6" class="border-b"><tr>${ths}</tr></thead>
                    <tbody class="divide-y">${rows}</tbody>
                </table>`;
        };

        const tableHTML = buildTable();
        const printWindow = window.open("", "_blank", "width=900,height=650");

        printWindow.document.open();
        printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Reservations</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
        <style>
          body {
            font-family: Arial, Helvetica, sans-serif;
            padding: 24px;
            color: #111;
            background-color: white !important;
          }

          h1 {
            margin-bottom: 4px;
            font-size: 20px;
          }

          .subtitle {
            font-size: 13px;
            color: #555;
            margin-bottom: 20px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-top: 10px;
          }

          thead {
            background-color: #f3f4f6 !important;
            -webkit-print-color-adjust: exact;
          }

          th, td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
            text-align: left;
          }

          th {
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.03em;
          }

          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>Bookings for ${moment(date).format("MMMM DD, YYYY")}</h1>
        <div class="subtitle">
          Generated on ${new Date().toLocaleDateString()}
        </div>
        ${tableHTML}
        <script>
          window.onload = function() {
            setTimeout(() => {
                window.focus();
                window.print();
            }, 250);
          };
        </script>
      </body>
    </html>
  `);

        printWindow.document.close();
    }

    async function fetchReservations() {
        try {
            setLoading(true);
            setError(null);

            const res = await ApiComunicator(
                `/reservations/reservationsByDate?date=${date}`
            );

            setReservations(res.reservations);
        } catch (err) {
            setError(err.message);
            setReservations([]);
        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        if (!date) { return; }
        else {
            fetchReservations();
        }
    }, [date]);

    const getReservationById = async (id) => {
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
                idAircraft: editFormData.idAircraft
            };

            const response = await ApiComunicator(`/reservations/updateReservation`, "POST", updateData);

            if (response.success) {
                setReservation(editFormData);
                setIsEditMode(false);
                toast({
                    variant: "default",
                    title: "Success",
                    description: "Reservation updated successfully"
                });
                // Reload reservations
                setDate(date);
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
        setDeleteConfirmModal({ show: true, idReservation: reservation?.idReservation });
    }

    const confirmDelete = async () => {
        try {
            setLoading(true);
            const response = await ApiComunicator(`/reservations/deleteReservation`, "POST", {
                idReservation: deleteConfirmModal.idReservation
            });

            if (response.success) {
                setDeleteConfirmModal({ show: false, idReservation: null });
                setModalDetail({ show: false, reservation: null });
                setIsEditMode(false);
                setEditFormData(null);
                toast({
                    variant: "default",
                    title: "Success",
                    description: "Reservation deleted successfully"
                });
                fetchReservations()
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

    if(loading) {
        return <Spinner />
    }

    return (
        <div className="p-6 space-y-6">
            {/* Filtro */}
            <Form className="bg-white rounded-lg shadow-sm border p-4 d-flex gap-3 align-items-end">
                <FormGroup style={{ maxWidth: '250px' }}>
                    <Label for="date">
                        Search by date
                    </Label>

                    <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </FormGroup>
                {reservations && reservations.length > 0 &&
                    <FormGroup>
                        <Button
                            color="primary"
                            style={{ color: 'white' }}
                            onClick={() => handlePrint()}
                        >
                            <FaPrint color="white" /> Print
                        </Button>
                    </FormGroup>}
            </Form>

            {error && (
                <p className="text-sm text-red-600">
                    {error}
                </p>
            )}

            {/* Tabla */}
            {!loading && reservations.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
                    <Table innerRef={tableRef}>
                        <thead style={{ background: '#f3f4f6' }} className="border-b">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Code
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Starts at
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Ends
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Passengers
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Client
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Email
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Phone
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {reservations.map((r) => (
                                <tr
                                    key={r.idReservation}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-4 py-3 text-sm">
                                        #{r.codeReservation}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {moment(r.startDate).format('HH:mm')}
                                        {moment(r.startDate).format('YYYY-MM-DD') !== date ?
                                            ` ${moment(r.startDate).format('MMMM DD')}` : ``}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {moment(r.endDate).format('HH:mm')}
                                        {moment(r.endDate).format('YYYY-MM-DD') !== moment(r.startDate).format('YYYY-MM-DD') ?
                                            ` ${moment(r.endDate).format('MMMM DD')}` : ``}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {r.passengers ? r.passengers : `-`}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {r.name && r.lastname ? `${r.name} ${r.lastname}` : `-`}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {r.email ? r.email : `-`}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {r.phoneNumber ? r.phoneNumber : `-`}
                                    </td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <Button
                                                color="secondary"
                                                size="sm"
                                                onClick={() => { setModalDetail({ show: true }); getReservationById(r.idReservation) }}
                                            >
                                                <FaEye /> View more
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}

            {/* Sin resultados */}
            {!loading && date && reservations.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm border">
                    <div
                        style={{
                            minHeight: "220px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            padding: "40px 20px",
                            gap: "18px"
                        }}
                    >
                        <div
                            style={{
                                fontSize: "14px",
                                color: "#6b7280",
                                fontWeight: 500
                            }}
                        >
                            No bookings for selected date
                        </div>

                        <Button
                            color="primary"
                            size="lg"
                            style={{
                                fontWeight: 600,
                                padding: "12px 28px",
                                borderRadius: "999px",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                            }}
                            onClick={() => {
                                router.push("/tours/book-dates");
                            }}
                        >
                            Start booking 
                        </Button>
                    </div>
                </div>
            )}
            <Modal isOpen={modalDetail.show} centered size="lg">
                {/* Header with dark background to match your table */}
                <ModalHeader
                    toggle={() => {
                        setModalDetail({ ...modalDetail, show: false, reservation: null });
                        setIsEditMode(false);
                        setEditFormData(null);
                    }}
                    style={{ backgroundColor: '#1e1e1e', color: 'white' }}
                >
                    <span style={{ color: 'white' }}>Booking #{reservation?.codeReservation}</span>
                </ModalHeader>

                <ModalBody style={{ padding: '0' }}>
                    {reservation && editFormData ? (
                        <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>

                            {!isEditMode ? (
                                <>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '20px',
                                        borderBottom: '1px solid #f0f0f0',
                                        paddingBottom: '15px'
                                    }}>
                                        <div style={{ textAlign: 'left' }}>
                                            <span style={{ fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>Start</span>
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                                                {moment(reservation?.startDate).format("MMM DD, YYYY - HH:mm")}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'left' }}>
                                            <span style={{ fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>End</span>
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                                                {moment(reservation?.endDate).format("MMM DD, YYYY - HH:mm")}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div style={{
                                        display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #f0f0f0',
                                        paddingBottom: '15px'
                                    }}>
                                        <div style={{ flex: '1 1 40%' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Flight Type</label>
                                            <span style={{ fontWeight: '600', color: '#222' }}>{reservation?.route}</span>
                                        </div>
                                        <div style={{ flex: '1 1 40%' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>PREMIUM EXPERIENCE</label>
                                            <span style={{ fontWeight: '600', color: '#222' }}>{reservation?.experience || "-"}</span>
                                        </div>
                                        <div style={{ flex: '1 1 40%' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Passengers</label>
                                            <span style={{ fontWeight: '600', color: '#222' }}>{reservation?.passengers ? ` ${reservation?.passengers.length} passengers` : ` - `}</span>
                                        </div>
                                        <div style={{ flex: '1 1 40%' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Client Name</label>
                                            <span style={{ fontWeight: '600', color: '#222' }}>{reservation?.name} {reservation?.lastname}</span>
                                        </div>
                                        <div style={{ flex: '1 1 40%' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Phone Number</label>
                                            <span style={{ fontWeight: '600', color: '#222' }}>{reservation?.phoneNumber ? `${reservation.phoneNumber}` : `-`}</span>
                                        </div>
                                        <div style={{ flex: '1 1 40%' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Aircraft</label>
                                            <span style={{ fontWeight: '600', color: '#222' }}>{`${reservation.aircraft} (${reservation.registrationNumber})`}</span>
                                        </div>
                                        <div style={{ flex: '1 1 100%' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Email Address</label>
                                            <span style={{ fontWeight: '600', color: '#222' }}>{reservation?.email ? `${reservation.email}` : `-`}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
                                        {reservation?.passengers && reservation?.passengers?.length > 0 &&
                                            reservation?.passengers.map((passenger, index) => (
                                                <div key={'pssgr-' + index}>
                                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                        Passenger #{index + 1}
                                                    </label>
                                                    <span style={{ fontWeight: '600', color: '#222' }}>{passenger.name} {passenger.lastname}</span>
                                                </div>
                                            ))
                                        }
                                    </div>

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
                            <Button
                                style={{ fontSize: '13px', fontWeight: '600' }}
                                color="secondary"
                                outline
                                onClick={() => {
                                    setModalDetail({ ...modalDetail, show: false, reservation: null });
                                    setIsEditMode(false);
                                    setEditFormData(null);
                                }}
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

            {/* Error Modal */}
            <Modal isOpen={errorModal.show} centered>
                <ModalHeader
                    toggle={() => setErrorModal({ show: false, message: '' })}
                    style={{ backgroundColor: '#dc3545', color: 'white' }}
                >
                    <span style={{ color: 'white' }}>Error Updating Reservation</span>
                </ModalHeader>
                <ModalBody>
                    <p style={{ marginBottom: '0', color: "#dc3545", fontSize: '16px' }}>
                        <FaExclamationCircle /> Error: {errorModal.message}
                    </p>
                </ModalBody>
                <ModalFooter style={{ backgroundColor: '#f8f9fa' }}>
                    <Button
                        style={{ fontSize: '13px', fontWeight: '600' }}
                        color="secondary"
                        outline
                        onClick={() => setErrorModal({ show: false, message: '' })}
                    >
                        Close
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteConfirmModal.show} centered>
                <ModalHeader
                    toggle={() => setDeleteConfirmModal({ show: false, idReservation: null })}
                    style={{ backgroundColor: '#721c24', color: 'white' }}
                >
                    <span style={{ color: 'white' }}>Confirm Deletion</span>
                </ModalHeader>
                <ModalBody>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <FaExclamationCircle style={{ color: '#dc3545', fontSize: '20px', marginTop: '4px', flexShrink: 0 }} />
                        <div>
                            <p style={{ marginBottom: '8px', color: '#333', fontWeight: '600' }}>
                                Are you sure you want to cancel this reservation?
                            </p>
                            <p style={{ marginBottom: '0', color: '#666', fontSize: '13px' }}>
                                This action will cancel the reservation and make the slot available again.
                            </p>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter style={{ backgroundColor: '#f8f9fa' }}>
                    <Button
                        style={{ fontSize: '13px', fontWeight: '600' }}
                        color="secondary"
                        outline
                        onClick={() => setDeleteConfirmModal({ show: false, idReservation: null })}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        style={{ fontSize: '13px', fontWeight: '600' }}
                        color="danger"
                        onClick={confirmDelete}
                        disabled={loading}
                    >
                        {loading ? 'Canceling...' : 'Cancel Reservation'}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>

    );
}
