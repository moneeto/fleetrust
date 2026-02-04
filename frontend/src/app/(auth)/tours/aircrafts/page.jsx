"use client";

import { useEffect, useState } from "react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { FormGroup, Label, Input, Button, Table} from "reactstrap";
import { useToast } from "@/components/ui/use-toast";
import { CheckIcon, EditIcon, XIcon } from "lucide-react";
import styles from './page.module.css';
import Spinner from "@/components/ui/Spinner";

export default function AircraftList() {
    const [aircrafts, setAircrafts] = useState([]);
    const [selectedAircraft, setSelectedAircraft] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [creatingAircraft, setCreatingAircraft] = useState(null);

    const { toast } = useToast();

    async function fetchAircrafts() {
        try {
            setLoading(true);
            setError(null);

            const res = await ApiComunicator(`/aircrafts`, 'GET');

            setAircrafts(res.aircrafts);
        } catch (err) {
            setError(err.message);
            setReservations([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAircrafts();
    }, []);

    const createAircraft = async () => {
        try {
            setLoading(true);

            await ApiComunicator(`/aircrafts/new`, "POST", creatingAircraft);

            // recargamos lista (más simple y seguro)
            await fetchAircrafts();

            setCreatingAircraft(null);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Error creating aircraft"
            });
        } finally {
            setLoading(false);
        }
    };

    const editAircraft = async (id) => {
        try {
            setLoading(true)
            await ApiComunicator(`/aircrafts/edit`, "POST", { idAircraft: id, ...selectedAircraft });
            setAircrafts(prev => prev.map(aircraft => aircraft.idAircraft === id ? { ...aircraft, ...selectedAircraft } : aircraft));
            setSelectedAircraft(null);
        } catch (error) {
            let message = "An error occurred while editing aircraft's information. Please try again.";
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
    function toggleEditAircraft(aircraft) {
        setSelectedAircraft(aircraft);

    }
    if (loading) {
        return <Spinner />
    }
    return (
        <div className="p-6 space-y-6">
            {error && (
                <p className="text-sm text-red-600">
                    {error}
                </p>
            )}

            {/* Tabla */}
            {!loading && aircrafts.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
                    <Table>
                        <thead style={{ background: '#f3f4f6' }} className="border-b">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Aircraft
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Capacity
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Registration number
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Available
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {aircrafts.map((r) =>
                                (selectedAircraft && selectedAircraft.idAircraft === r.idAircraft) ? (
                                    <tr className={styles.customRow}>
                                        <td className="px-4 py-3 text-sm">
                                            <Input
                                                type="text"
                                                size="sm"
                                                defaultValue={selectedAircraft.aircraft}
                                                onChange={(e) => setSelectedAircraft({ ...selectedAircraft, aircraft: e.target.value })}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <Input
                                                size="sm"
                                                type="number"
                                                defaultValue={selectedAircraft.capacity}
                                                onChange={(e) => setSelectedAircraft({ ...selectedAircraft, capacity: e.target.value })}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <Input
                                                size="sm"
                                                type="text"
                                                defaultValue={selectedAircraft.registrationNumber}
                                                onChange={(e) => setSelectedAircraft({ ...selectedAircraft, registrationNumber: e.target.value })}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <FormGroup switch>
                                                <Input
                                                    type="switch"
                                                    id="available"
                                                    checked={selectedAircraft.available}
                                                    style={{ cursor: 'pointer' }}
                                                    onChange={(e) => setSelectedAircraft({ ...selectedAircraft, available: e.target.checked })}
                                                />
                                                <Label for="available"></Label>
                                            </FormGroup>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2 align-items-center">
                                                <Button
                                                    color="success"
                                                    size="sm"
                                                    onClick={() => { editAircraft(selectedAircraft.idAircraft) }}
                                                >
                                                    Save
                                                </Button>
                                                <Button
                                                    color="danger"
                                                    size="sm"
                                                    outline
                                                    className="ml-2"
                                                    onClick={() => { setSelectedAircraft(null); }}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <tr
                                        key={r.idAircraft}
                                        className={styles.customRow}
                                    >
                                        <td className="px-4 py-3 text-sm">
                                            {r.aircraft}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {r.capacity}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {r.registrationNumber}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {r.available ?
                                                <>
                                                    <CheckIcon color="green" size={16} /> Yes
                                                </>
                                                : <>
                                                    <XIcon color="red" size={16} /> No
                                                </>}
                                        </td>
                                        <td>
                                            <Button
                                                color="primary"
                                                size="sm"
                                                outline
                                                onClick={() => { toggleEditAircraft(r) }}
                                            >
                                                <EditIcon size={16} /> Edit
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            {creatingAircraft && (
                                <tr className={styles.customRow}>
                                    <td className="px-4 py-3 text-sm">
                                        <Input
                                            size="sm"
                                            value={creatingAircraft.aircraft}
                                            onChange={(e) =>
                                                setCreatingAircraft({ ...creatingAircraft, aircraft: e.target.value })
                                            }
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <Input
                                            size="sm"
                                            type="number"
                                            value={creatingAircraft.capacity}
                                            onChange={(e) =>
                                                setCreatingAircraft({ ...creatingAircraft, capacity: e.target.value })
                                            }
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <Input
                                            size="sm"
                                            value={creatingAircraft.registrationNumber}
                                            onChange={(e) =>
                                                setCreatingAircraft({
                                                    ...creatingAircraft,
                                                    registrationNumber: e.target.value
                                                })
                                            }
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <FormGroup switch>
                                            <Input
                                                type="switch"
                                                checked={creatingAircraft.available}
                                                onChange={(e) =>
                                                    setCreatingAircraft({
                                                        ...creatingAircraft,
                                                        available: e.target.checked
                                                    })
                                                }
                                            />
                                            <Label />
                                        </FormGroup>
                                    </td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <Button
                                                color="success"
                                                size="sm"
                                                disabled={
                                                    !creatingAircraft.aircraft ||
                                                    !creatingAircraft.capacity ||
                                                    !creatingAircraft.registrationNumber
                                                }
                                                onClick={createAircraft}
                                            >
                                                Save
                                            </Button>
                                            <Button
                                                color="danger"
                                                size="sm"
                                                outline
                                                onClick={() => setCreatingAircraft(null)}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            )}
            <div className="d-flex justify-content-end mt-3">
                <Button
                    color="primary"
                    size="sm"
                    onClick={() =>
                        setCreatingAircraft({
                            aircraft: "",
                            capacity: "",
                            registrationNumber: "",
                            available: true
                        })
                    }
                    disabled={!!creatingAircraft || !!selectedAircraft}
                >
                    New aircraft
                </Button>
            </div>
            {loading && (
                <div className="bg-white rounded-lg border p-4 text-sm text-gray-500">
                    Loading aircrafts...
                </div>
            )}
        </div>

    );
}
