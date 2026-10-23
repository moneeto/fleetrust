"use client";

import { useState } from "react";
import { Button, Form, Input, Label, FormGroup, Alert, Spinner } from "reactstrap";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { getRecaptchaToken } from "@/helpers/recaptcha";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/components/ui/PasswordInput";
import styles from "../login/login.module.css";

export default function Register() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const captchaToken = await getRecaptchaToken("register");
      await ApiComunicator("/auth/register", "POST", { ...form, captchaToken });
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setError(err.message || "Could not create the account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.brandPanel}>
        <h1 className={`brand ${styles.brandName}`}>Fleetrust</h1>
        {/* <p className={styles.brandTagline}>Back office for your tours and fleet.</p> */}
      </div>
      <div className={styles.formPanel}>
        <div className={styles.formBox}>
          <h1 className={`brand ${styles.formBrand}`}>Fleetrust</h1>
          <h2 className={styles.title}>Create account</h2>
          <p className={styles.subtitle}>We will send a code to your email to confirm it.</p>
          <Form onSubmit={handleSubmit}>
            <FormGroup className="mb-3" floating>
              <Input id="email" type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} disabled={loading} required />
              <Label for="email">Email</Label>
            </FormGroup>
            <PasswordInput id="password" name="password" value={form.password} onChange={handleChange} disabled={loading} autoComplete="new-password" className="mb-4" minLength={8} required />
            {error && <Alert color="danger" className="py-2">{error}</Alert>}
            <Button type="submit" color="primary" className={`w-100 ${styles.submit}`} disabled={loading}>
              {loading ? <><Spinner size="sm" className="me-2" />Creating...</> : "Create account"}
            </Button>
          </Form>
          <p className={styles.links}>Already have an account? <Link href="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
