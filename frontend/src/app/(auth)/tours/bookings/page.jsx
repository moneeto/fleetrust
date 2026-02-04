"use client";

import { useEffect, useState, useRef, use } from "react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { Form, FormGroup, Label, Input, Button, Table, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { FaPrint } from "react-icons/fa";
import moment from "moment";
import { useToast } from "@/components/ui/use-toast";
import { EditIcon } from "lucide-react";

export default function ToursPage() {
    let today = moment().format("YYYY-MM-DD");
    const [date, setDate] = useState(today);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [modalDetail, setModalDetail] = useState({ show: false, reservation: null });
    const tableRef = useRef(null);
    const toast = useToast();

    const [reservation, setReservation] = useState(null);

    function handlePrint() {
        if (!tableRef.current) return;

        // Clonamos la tabla para no afectar la original en la UI
        const tableHTML = tableRef.current.outerHTML;
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

          /* Tu diseño actual de tabla para asegurar que se vea bien */
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-top: 10px;
          }

          thead {
            background-color: #f3f4f6 !important;
            -webkit-print-color-adjust: exact; /* Para que el color de fondo se imprima */
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

          /* Ocultar la columna de 'Actions' en la impresión */
          th:last-child, td:last-child {
            display: none;
          }

          tbody tr:nth-child(even) {
            background-color: #fafafa !important;
            -webkit-print-color-adjust: exact;
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
          // Esperar a que cargue el CSS de Bootstrap antes de imprimir
          window.onload = function() {
            setTimeout(() => {
                window.focus();
                window.print();
                // window.close(); // Opcional: cerrar ventana tras imprimir
            }, 250);
          };
        </script>
      </body>
    </html>
  `);

        printWindow.document.close();
    }


    useEffect(() => {
        if (!date) return;

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

        fetchReservations();
    }, [date]);

    const getReservationById = async (id) => {
        try {
            setLoading(true)
            let reserv = await ApiComunicator(`/reservations/getReservationById`, "POST", { id });
            setReservation(reserv)
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
                                                View Details
                                            </Button>
                                            <Button
                                                color="primary"
                                                size="sm"
                                                outline
                                                onClick={() => { setModalDetail({ show: true }); getReservationById(r.idReservation) }}
                                            >
                                                <EditIcon size={16} /> Edit
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
                <div className="bg-white rounded-lg border p-4 text-sm text-gray-500">
                    No bookings for selected date.
                </div>
            )}
            {loading && (
                <div className="bg-white rounded-lg border p-4 text-sm text-gray-500">
                    Loading bookings...
                </div>
            )}
            <Modal isOpen={modalDetail.show} centered>
                {/* Header with dark background to match your table */}
                <ModalHeader
                    toggle={() => setModalDetail({ ...modalDetail, show: false, reservation: null })}
                    style={{ backgroundColor: '#1e1e1e', color: 'white' }}
                >
                    <span style={{ color: 'white' }}>Booking #{reservation?.codeReservation}</span>
                </ModalHeader>

                <ModalBody style={{ padding: '0' }}>
                    {reservation ? (
                        <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>

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

                        </div>
                    ) : (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                            <p>Loading reservation details...</p>
                        </div>
                    )}
                </ModalBody>

                <ModalFooter style={{ backgroundColor: '#f8f9fa' }}>
                    <Button
                        style={{ fontSize: '13px', fontWeight: '600' }}
                        color="secondary"
                        outline
                        onClick={() => setModalDetail({ ...modalDetail, show: false, reservation: null })}
                    >
                        Close
                    </Button>
                </ModalFooter>
            </Modal>
        </div>

    );
}
