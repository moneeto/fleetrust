"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Button, Form, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import { Fingerprint, KeyRound, UserRound } from "lucide-react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { biometricCancelled, registerBiometric } from "@/helpers/biometric";
import { useToast } from "@/components/ui/use-toast";
import PasswordInput from "@/components/ui/PasswordInput";
import styles from "./page.module.css";

export default function Settings() {
    const { toast } = useToast();
    const [profile, setProfile] = useState(null);
    const [passkeys, setPasskeys] = useState(0);
    const [modal, setModal] = useState(""); // "", "info" or "password"
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const load = () => {
        ApiComunicator("/auth/profile", "GET").then(setProfile).catch((err) => setError(err.message));
        ApiComunicator("/auth/biometricStatus", "GET").then((s) => setPasskeys(Number(s.passkeys))).catch(() => {});
    };

    useEffect(load, []);

    function openModal(name, values) {
        setError("");
        setForm(values);
        setModal(name);
    }

    function change(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    // Runs an action, shows the toast, reloads. Used by every button on the page.
    async function run(action, okMessage, closeModal) {
        setError("");
        setSaving(true);
        try {
            await action();
            toast({ title: okMessage });
            if (closeModal) setModal("");
            load();
        } catch (err) {
            if (!biometricCancelled(err)) setError(err.message || "Something went wrong.");
        } finally {
            setSaving(false);
        }
    }

    function submit(e) {
        e.preventDefault();
        if (modal === "info") {
            run(() => ApiComunicator("/auth/profile", "POST", form), "Personal information updated.", true);
        } else {
            run(() => ApiComunicator("/auth/changePassword", "POST", form), "Password updated.", true);
        }
    }

    if (!profile) return error ? <Alert color="danger">{error}</Alert> : <Spinner />;

    const initials = ((profile.name?.[0] || "") + (profile.surname?.[0] || "")).toUpperCase() || profile.email[0].toUpperCase();
    const since = new Date(profile.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    return (
        <div className={styles.profile}>
            <div className={styles.avatar}>{initials}</div>
            <h1 className={styles.name}>{profile.name} {profile.surname}</h1>
            <p className={styles.meta}>{profile.email}</p>
            {profile.role && <p className={styles.meta}>{profile.role}</p>}
            <p className={styles.meta}>Member since {since}</p>

            {error && !modal && <Alert color="danger" className="mt-3">{error}</Alert>}

            <div className={styles.cards}>
                <section className={styles.card}>
                    {/* <span className={styles.icon}><UserRound size={22} /></span> */}
                    <h2>Personal information</h2>
                    <p>Update the name shown on your account.</p>
                    <div className={styles.actions}>
                        <Button color="primary" outline onClick={() => openModal("info", { name: profile.name || "", surname: profile.surname || "" })}>
                            Change
                        </Button>
                    </div>
                </section>

                <section className={styles.card}>
                    {/* <span className={styles.icon}><KeyRound size={22} /></span> */}
                    <h2>Password</h2>
                    <p>Use at least 8 characters.</p>
                    <div className={styles.actions}>
                        <Button color="primary" outline onClick={() => openModal("password", { currentPassword: "", password: "", passwordConfirm: "" })}>
                            Change password
                        </Button>
                    </div>
                </section>

                {profile.code === "ADM" && (
                    <section className={styles.card}>
                        <h2>Users</h2>
                        <p>Add, edit and deactivate the people who use this account.</p>
                        <div className={styles.actions}>
                            <Link href="/settings/users" className="btn btn-outline-primary">Manage</Link>
                        </div>
                    </section>
                )}

                <section className={styles.card}>
                    {/* <span className={styles.icon}><Fingerprint size={22} /></span> */}
                    <h2>Biometric / passkey sign in</h2>
                    <p>{passkeys > 0 ? "Enabled. Sign in with your fingerprint, face or device lock." : "Sign in with your fingerprint, face or device lock."}</p>
                    <div className={styles.actions}>
                        <Button color="primary" outline={passkeys > 0} disabled={saving} onClick={() => run(registerBiometric, "Biometric login enabled.")}>
                            {passkeys > 0 ? "Register again" : "Register"}
                        </Button>
                        {passkeys > 0 && (
                            <Button color="danger" outline disabled={saving} onClick={() => run(() => ApiComunicator("/auth/biometricRemove", "POST", {}), "Biometric login removed.")}>
                                Remove
                            </Button>
                        )}
                    </div>
                </section>
            </div>

            <p className={styles.help}>
                Do you need more help?<br />
                Contact us: <a href="mailto:info@loderole.com">info@loderole.com</a>
            </p>

            <Modal isOpen={!!modal} toggle={() => setModal("")} centered>
                <Form onSubmit={submit}>
                    <ModalHeader toggle={() => setModal("")}>
                        {modal === "info" ? "Personal information" : "Change password"}
                    </ModalHeader>
                    <ModalBody>
                        {error && <Alert color="danger" className="py-2">{error}</Alert>}
                        {modal === "info" && (
                            <>
                                <FormGroup>
                                    <Label for="name">First name</Label>
                                    <Input id="name" name="name" value={form.name} onChange={change} required />
                                </FormGroup>
                                <FormGroup className="mb-0">
                                    <Label for="surname">Last name</Label>
                                    <Input id="surname" name="surname" value={form.surname} onChange={change} required />
                                </FormGroup>
                            </>
                        )}
                        {modal === "password" && (
                            <>
                                {profile.hasPassword ? <PasswordInput id="currentPassword" name="currentPassword" label="Current password" value={form.currentPassword} onChange={change} required /> : null}
                                <PasswordInput id="password" name="password" label="New password" value={form.password} onChange={change} required minLength={8} />
                                <PasswordInput id="passwordConfirm" name="passwordConfirm" label="Confirm new password" className="mb-0" value={form.passwordConfirm} onChange={change} required />
                            </>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button type="button" color="secondary" outline onClick={() => setModal("")}>Cancel</Button>
                        <Button type="submit" color="primary" disabled={saving}>Save</Button>
                    </ModalFooter>
                </Form>
            </Modal>
        </div>
    );
}
