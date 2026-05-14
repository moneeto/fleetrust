"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import jsQR from "jsqr";
import { Alert, Button, Form, FormGroup, Input, Label } from "reactstrap";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import styles from "./page.module.css";

/** @typedef {"checking" | "ready" | "no-camera" | "blocked" | "error"} ScanPhase */

const QR_ERR_EN = {
    NOT_FOUND: "No reservation was found with this confirmation code.",
    INVALID_STATUS: "The reservation is not confirmed and paid (confirmed status is required).",
    ALREADY_VALIDATED: "This reservation was already validated at check-in.",
    MISSING_HASH: "The confirmation code is missing.",
    NO_PASSENGERS: "There are no passengers registered for this reservation.",
    UPDATE_CONFLICT:
        "Check-in could not be completed. Another session may have updated the reservation.",
};

function formatReservationDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function mapQrApiError(err) {
    if (!err || typeof err !== "object") return "Error communicating with the server.";
    const code = err.code;
    if (code && QR_ERR_EN[code]) return QR_ERR_EN[code];
    if (typeof err.message === "string" && err.message.trim()) return err.message;
    return "The operation could not be completed.";
}

function formatPassengerName(passenger) {
    return [passenger?.name, passenger?.lastName || passenger?.lastname].filter(Boolean).join(" ").trim();
}

export default function QrScanPage() {
    const videoRef = useRef(null);
    const scanCanvasRef = useRef(null);
    const streamRef = useRef(null);
    const rafRef = useRef(0);
    const lastLoggedCodeRef = useRef("");
    const [phase, setPhase] = useState(/** @type {ScanPhase} */ ("checking"));
    const [manualCode, setManualCode] = useState("");
    const [lastDecoded, setLastDecoded] = useState("");
    const [statusNote, setStatusNote] = useState("");

    const [validateLoading, setValidateLoading] = useState(false);
    const [printLoading, setPrintLoading] = useState(false);
    const [completeLoading, setCompleteLoading] = useState(false);
    const [validatedHash, setValidatedHash] = useState("");
    const [reservationPreview, setReservationPreview] = useState(null);
    const [flowError, setFlowError] = useState("");
    const [apiNote, setApiNote] = useState("");
    const [printedOnce, setPrintedOnce] = useState(false);
    const [doneSuccess, setDoneSuccess] = useState(false);

    const effectiveCode = useMemo(
        () => String(lastDecoded || manualCode || "").trim(),
        [lastDecoded, manualCode]
    );

    useEffect(() => {
        if (!validatedHash) return;
        if (effectiveCode !== validatedHash) {
            setValidatedHash("");
            setReservationPreview(null);
            setPrintedOnce(false);
            setFlowError("");
            setDoneSuccess(false);
            setApiNote("");
        }
    }, [effectiveCode, validatedHash]);

    const stopStream = useCallback(() => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = 0;
        }
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const hasVideoInputDevice = useCallback(async () => {
        if (!navigator.mediaDevices?.enumerateDevices) {
            return false;
        }
        try {
            const list = await navigator.mediaDevices.enumerateDevices();
            return list.some((d) => d.kind === "videoinput");
        } catch {
            return false;
        }
    }, []);

    const openCamera = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setPhase("no-camera");
            return;
        }
        try {
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: "environment" } },
                    audio: false,
                });
            } catch {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false,
                });
            }
            streamRef.current = stream;
            setPhase("ready");
        } catch (e) {
            stopStream();
            const name = e && typeof e === "object" && "name" in e ? e.name : "";
            if (name === "NotAllowedError" || name === "PermissionDeniedError") {
                setPhase("blocked");
            } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
                setPhase("no-camera");
            } else {
                setPhase("error");
                setStatusNote(String(e?.message || e));
            }
        }
    }, [stopStream]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setPhase("checking");
            const hasCamera = await hasVideoInputDevice();

            if (cancelled) return;

            if (!hasCamera) {
                setPhase("no-camera");
                return;
            }

            await openCamera();
        })();

        return () => {
            cancelled = true;
            stopStream();
        };
    }, [hasVideoInputDevice, openCamera, stopStream]);

    useEffect(() => {
        if (phase !== "ready") return;
        const video = videoRef.current;
        const stream = streamRef.current;
        if (!video || !stream) return;

        video.srcObject = stream;
        video.play().catch(() => {});

        return () => {
            video.srcObject = null;
        };
    }, [phase]);

    useEffect(() => {
        if (phase !== "ready") return;
        const video = videoRef.current;
        const canvas = scanCanvasRef.current;
        const context = canvas?.getContext("2d", { willReadFrequently: true });
        if (!video || !canvas || !context) return;

        let stopped = false;

        const tick = () => {
            if (stopped) return;
            if (video.readyState < video.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) {
                rafRef.current = requestAnimationFrame(tick);
                return;
            }

            try {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const result = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "attemptBoth",
                });

                if (result?.data) {
                    const detectedCode = result.data;
                    setLastDecoded(detectedCode);
                    if (detectedCode !== lastLoggedCodeRef.current) {
                        lastLoggedCodeRef.current = detectedCode;
                        console.log("QR detected:", detectedCode);
                    }
                }
            } catch {
                /* ignore failed frames */
            }
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            stopped = true;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [phase]);

    const handleValidate = async () => {
        setFlowError("");
        setApiNote("");
        setDoneSuccess(false);
        if (!effectiveCode) {
            setFlowError("Enter or scan a code before validating.");
            return;
        }
        setValidateLoading(true);
        try {
            const res = await ApiComunicator(`/reservations/validateQrConfirmation`, "POST", {
                confirmationHash: effectiveCode,
            });
            if (!res?.success || !res.reservation) {
                throw res || { message: "Invalid server response." };
            }
            setValidatedHash(effectiveCode);
            setReservationPreview(res.reservation);
            setPrintedOnce(false);
            setApiNote("Reservation is ready to print tickets and complete check-in.");
        } catch (e) {
            setFlowError(mapQrApiError(e));
            setValidatedHash("");
            setReservationPreview(null);
        } finally {
            setValidateLoading(false);
        }
    };

    const handlePrintTickets = async () => {
        if (!validatedHash) return;
        setFlowError("");
        setPrintLoading(true);
        try {
            const response = await ApiComunicator(
                `/reservations/qrBoardingPassPdf`,
                "POST",
                { confirmationHash: validatedHash },
                undefined,
                true
            );
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const win = window.open(url, "_blank", "noopener,noreferrer");
            setPrintedOnce(true);
            if (win) {
                win.addEventListener("load", () => {
                    try {
                        win.print();
                    } catch {
                        /* */
                    }
                });
            }
            setTimeout(() => URL.revokeObjectURL(url), 120_000);
        } catch (e) {
            setFlowError(mapQrApiError(e));
        } finally {
            setPrintLoading(false);
        }
    };

    const handleCompleteCheckIn = async () => {
        if (!validatedHash) return;
        setFlowError("");
        setCompleteLoading(true);
        try {
            const res = await ApiComunicator(`/reservations/completeQrValidation`, "POST", {
                confirmationHash: validatedHash,
            });
            if (!res?.success) {
                throw res || { message: "Check-in could not be completed." };
            }
            setDoneSuccess(true);
            setApiNote("");
            setReservationPreview(null);
            setValidatedHash("");
            setPrintedOnce(false);
            setLastDecoded("");
            setManualCode("");
        } catch (e) {
            setFlowError(mapQrApiError(e));
        } finally {
            setCompleteLoading(false);
        }
    };

    const showManualBlock = phase === "no-camera" || phase === "blocked" || phase === "error";
    const canValidate = Boolean(effectiveCode) && !validateLoading && !doneSuccess;
    const showActions = Boolean(validatedHash && reservationPreview && !doneSuccess);
    const reservationPassengers = Array.isArray(reservationPreview?.passengers)
        ? reservationPreview.passengers
        : [];

    return (
        <div className={styles.pageShell}>
            <div className={styles.scanPanel}>
                <div className={styles.header}>
                    <p>Point the camera at the boarding pass QR to validate the reservation.</p>
                </div>

                {phase === "checking" && <p className={styles.statusText}>Checking camera…</p>}

                {phase === "ready" && (
                    <>
                        <div className={styles.scannerCard}>
                            <div className={`ratio ratio-4x3 ${styles.viewport}`}>
                                <video
                                    ref={videoRef}
                                    className={styles.video}
                                    playsInline
                                    muted
                                    autoPlay
                                />
                                <canvas ref={scanCanvasRef} className="d-none" />
                                <div className={styles.overlay} aria-hidden>
                                    <div className={styles.frame}>
                                        <span className={`${styles.corner} ${styles.cornerTl}`} />
                                        <span className={`${styles.corner} ${styles.cornerTr}`} />
                                        <span className={`${styles.corner} ${styles.cornerBl}`} />
                                        <span className={`${styles.corner} ${styles.cornerBr}`} />
                                    </div>
                                    <p className={styles.hint}>Align the QR code within the frame</p>
                                </div>
                            </div>
                        </div>
                        {typeof window !== "undefined" && "BarcodeDetector" in window && (
                            <p className={styles.supportText}>
                                Automatic QR reading is enabled when your browser supports it.
                            </p>
                        )}
                        {lastDecoded && (
                            <div className={styles.codePill}>
                                <span>Last code read</span>
                                <strong>{lastDecoded}</strong>
                            </div>
                        )}
                        {/* <FormGroup>
                        <Label for="manual-optional">Manual code (optional)</Label>
                        <Input
                            id="manual-optional"
                            type="text"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            placeholder="Paste or enter the confirmation code"
                        />
                    </FormGroup> */}
                    </>
                )}

                {/* {showManualBlock && (
                <div className="alert alert-warning" role="alert">
                    <p className="mb-2">
                        {phase === "no-camera" && (
                            <>
                                No camera was detected. Enter the confirmation code manually.
                            </>
                        )}
                        {phase === "blocked" && (
                            <>
                                Camera access was denied. Enter the confirmation code manually.
                            </>
                        )}
                        {phase === "error" && (
                            <>
                                The camera could not be started
                                {statusNote ? `: ${statusNote}` : ""}. Enter the code manually.
                            </>
                        )}
                    </p>
                    <Form>
                        <FormGroup>
                            <Label for="manual-required">Code</Label>
                            <Input
                                id="manual-required"
                                type="text"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                placeholder="Paste or enter the confirmation code"
                            />
                        </FormGroup>
                    </Form>
                </div>
                )} */}

                {flowError && (
                    <Alert color="danger" className={styles.alertBox}>
                        {flowError}
                    </Alert>
                )}
                {apiNote && !flowError && (
                    <Alert color="info" className={styles.alertBox}>
                        {apiNote}
                    </Alert>
                )}
                {doneSuccess && (
                    <Alert color="success" className={styles.alertBox}>
                        Check-in completed successfully. The reservation was validated.
                    </Alert>
                )}

                <div className={styles.primaryActions}>
                    <Button color="primary" disabled={!canValidate} onClick={handleValidate}>
                        {validateLoading ? "Validating…" : "Validate code"}
                    </Button>
                </div>

                {showActions && (
                    <div className={styles.reservationCard}>
                        <div className={styles.reservationHeader}>
                            <span>Reservation</span>
                            <strong>#{reservationPreview.codeReservation}</strong>
                        </div>
                        <ul className={styles.reservationList}>
                            <li>
                                <span>Date and time</span>
                                <strong>{formatReservationDate(reservationPreview.startDate)}</strong>
                            </li>
                            <li>
                                <span>Experience</span>
                                <strong>{reservationPreview.title}</strong>
                            </li>
                            {reservationPreview.holderName ? (
                                <li>
                                    <span>Booked by</span>
                                    <strong>{reservationPreview.holderName}</strong>
                                </li>
                            ) : null}
                            <li>
                                <span>Passengers</span>
                                <strong>{reservationPreview.passengerCount}</strong>
                            </li>
                        </ul>
                        <div className={styles.passengersBlock}>
                            <div className={styles.passengersTitle}>
                                <span>Passenger list</span>
                                <strong>{reservationPassengers.length}</strong>
                            </div>
                            {reservationPassengers.length > 0 ? (
                                <ol className={styles.passengersList}>
                                    {reservationPassengers.map((passenger, index) => {
                                        const name = formatPassengerName(passenger);
                                        return (
                                            <li key={passenger.idPassenger || `${name}-${index}`}>
                                                <span>{index + 1}</span>
                                                <strong>{name || "Passenger without name"}</strong>
                                            </li>
                                        );
                                    })}
                                </ol>
                            ) : (
                                <p className={styles.emptyPassengers}>
                                    No passengers were found for this reservation.
                                </p>
                            )}
                        </div>
                        <div className={styles.secondaryActions}>
                            <Button color="secondary" disabled={printLoading} onClick={handlePrintTickets}>
                                {printLoading ? "Generating PDF…" : "Print tickets"}
                            </Button>
                            <Button
                                color="success"
                                disabled={completeLoading || !printedOnce}
                                onClick={handleCompleteCheckIn}
                                title={
                                    printedOnce
                                        ? ""
                                        : "Print or open the ticket PDF before completing check-in."
                                }
                            >
                                {completeLoading ? "Saving…" : "Complete check-in"}
                            </Button>
                        </div>
                        {!printedOnce && (
                            <p className={styles.helperText}>
                                First use &quot;Print tickets&quot; to generate the same PDF the system sends
                                after payment; then tap &quot;Complete check-in&quot;.
                            </p>
                        )}
                    </div>
                )}

                {/* {phase === "ready" && !effectiveCode && (
                    <p className="small text-muted mt-2 mb-0">
                        Scan the QR code or enter the confirmation code and tap &quot;Validate code&quot;.
                    </p>
                )} */}
                </div>
        </div>
    );
}
