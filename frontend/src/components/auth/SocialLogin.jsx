"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Alert, Button, Spinner } from "reactstrap";
import { useRouter } from "next/navigation";
import { PiFingerprint } from "react-icons/pi";
import { renderGoogleButton, loginWithGoogle } from "@/helpers/google";
import { biometricCancelled, biometricSupported, loginWithBiometric } from "@/helpers/biometric";
import styles from "@/app/login/login.module.css";

export default function SocialLogin() {
  const router = useRouter();
  const googleButton = useRef(null);
  const supported = useSyncExternalStore(() => () => {}, biometricSupported, () => false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signIn = async (login) => {
    setError("");
    setLoading(true);
    try {
      await login();
      router.refresh();
      router.replace("/tours/calendar");
    } catch (err) {
      if (!biometricCancelled(err)) setError(err.message || "Could not sign in.");
      setLoading(false);
    }
  };

  useEffect(() => {
    renderGoogleButton(googleButton.current, (idToken) => signIn(() => loginWithGoogle(idToken)))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <>
      <div className={styles.divider}><span>or</span></div>
      <div ref={googleButton} className={styles.googleButton} />
      {supported && (
        <Button type="button" color="light" className={`w-100 ${styles.submit} ${styles.biometric}`} disabled={loading} onClick={() => signIn(loginWithBiometric)}>
          {loading ? <Spinner size="sm" /> : <PiFingerprint size={20} />}
          Sign in with a passkey
        </Button>
      )}
      {error && <Alert color="danger" className="py-2 mt-3 mb-0">{error}</Alert>}
    </>
  );
}
