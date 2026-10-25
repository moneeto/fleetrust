"use client";

import { useRef, useState } from "react";
import { Button, Form, Alert, Spinner } from "reactstrap";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "../login/login.module.css";

const EMPTY = ["", "", "", "", "", ""];

export default function VerifyEmail() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [digits, setDigits] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputs = useRef([]);
  const router = useRouter();
  const code = digits.join("");

  const focusAt = (index) => {
    const box = inputs.current[Math.max(0, Math.min(index, 5))];
    if (box) box.focus();
  };

  const writeDigits = (start, raw) => {
    const chars = raw.replace(/\D/g, "").slice(0, 6 - start);
    const next = [...digits];
    if (!chars) {
      next[start] = "";
      setDigits(next);
      return;
    }
    chars.split("").forEach((char, offset) => {
      next[start + offset] = char;
    });
    setDigits(next);
    focusAt(start + chars.length);
  };

  const onPaste = (event) => {
    const text = event.clipboardData.getData("text").replace(/\D/g, "");
    if (text.length < 2) return;
    event.preventDefault();
    const next = text.slice(0, 6).split("");
    while (next.length < 6) next.push("");
    setDigits(next);
    focusAt(text.length);
  };

  const onKeyDown = (index, event) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      focusAt(index - 1);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || code.length < 6) return;
    setError("");
    setLoading(true);
    try {
      await ApiComunicator("/auth/verifyEmail", "POST", { email, code });
      router.refresh();
      router.replace("/tours/calendar");
    } catch (err) {
      setError(err.message || "Could not verify the email.");
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
          <h2 className={styles.title}>Confirm email</h2>
          <p className={styles.subtitle}>
            {email ? `Enter the code we sent to ${email}.` : "Open this page from the registration form."}
          </p>
          <Form onSubmit={handleSubmit}>
            <div className={styles.digits} onPaste={onPaste}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(node) => { inputs.current[index] = node; }}
                  className={styles.digit}
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  aria-label={`Digit ${index + 1}`}
                  maxLength={1}
                  value={digit}
                  disabled={loading || !email}
                  autoFocus={index === 0}
                  onFocus={(event) => event.target.select()}
                  onChange={(event) => writeDigits(index, event.target.value)}
                  onKeyDown={(event) => onKeyDown(index, event)}
                />
              ))}
            </div>
            {error && <Alert color="danger" className="py-2">{error}</Alert>}
            <Button type="submit" color="primary" className={`w-100 ${styles.submit}`} disabled={loading || !email || code.length < 6}>
              {loading ? <><Spinner size="sm" className="me-2" />Checking...</> : "Verify"}
            </Button>
          </Form>
          <p className={styles.links}><Link href="/login">Back to sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
