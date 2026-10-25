"use client";

import { useState } from "react";
import { Button, Form, Input, Label, FormGroup, Alert, Spinner } from "reactstrap";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import Link from "next/link";
import styles from "../login/login.module.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await ApiComunicator("/auth/forgotPassword", "POST", { email });
      setSent(data.message);
    } catch (err) {
      setError(err.message || "Could not send the email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.brandPanel}>
        <h1 className={`brand ${styles.brandName}`}>Fleetrust</h1>
      </div>
      <div className={styles.formPanel}>
        <div className={styles.formBox}>
          <h1 className={`brand ${styles.formBrand}`}>Fleetrust</h1>
          <h2 className={styles.title}>Forgot password</h2>
          {sent ? (
            <Alert color="success">{sent}</Alert>
          ) : (
            <>
              <p className={styles.subtitle}>Enter your email and we will send a recovery link.</p>
              <Form onSubmit={handleSubmit}>
                <FormGroup className="mb-4" floating>
                  <Input id="email" type="email" name="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} required />
                  <Label for="email">Email</Label>
                </FormGroup>
                {error && <Alert color="danger" className="py-2">{error}</Alert>}
                <Button type="submit" color="primary" className={`w-100 ${styles.submit}`} disabled={loading}>
                  {loading ? <><Spinner size="sm" className="me-2" />Sending...</> : "Send"}
                </Button>
              </Form>
            </>
          )}
          <p className={styles.links}><Link href="/login">Back to sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
