"use client";

import { useState } from "react";
import { Button, Form, Input, Label, FormGroup, Alert, Spinner } from "reactstrap";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "../login/login.module.css";

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await ApiComunicator("/auth/resetPassword", "POST", { token, password, passwordConfirm });
      router.push("/login");
    } catch (err) {
      setError(err.message || "Could not reset the password.");
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
          <h2 className={styles.title}>New password</h2>
          {token ? (
            <>
              <p className={styles.subtitle}>Verify and confirm the new password.</p>
              <Form onSubmit={handleSubmit}>
                <FormGroup className="mb-3" floating>
                  <Input id="password" type="password" name="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} minLength={8} autoComplete="new-password" required />
                  <Label for="password">New password</Label>
                </FormGroup>
                <FormGroup className="mb-4" floating>
                  <Input id="passwordConfirm" type="password" name="passwordConfirm" placeholder="Repeat password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} disabled={loading} minLength={8} autoComplete="new-password" required />
                  <Label for="passwordConfirm">Confirm new password</Label>
                </FormGroup>
                {error && <Alert color="danger" className="py-2">{error}</Alert>}
                <Button type="submit" color="primary" className={`w-100 ${styles.submit}`} disabled={loading}>
                  {loading ? <><Spinner size="sm" className="me-2" />Saving...</> : "Save password"}
                </Button>
              </Form>
            </>
          ) : (
            <Alert color="danger">This link is invalid or has expired.</Alert>
          )}
          <p className={styles.links}><Link href="/login">Back to sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
