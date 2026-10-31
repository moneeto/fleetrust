"use client";

import { useState } from "react";
import {
  Button,
  Form,
  Input,
  Label,
  FormGroup,
  Alert,
  Spinner,
} from "reactstrap";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { getRecaptchaToken } from "@/helpers/recaptcha";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PiArrowRight } from "react-icons/pi";
import PasswordInput from "@/components/ui/PasswordInput";
import SocialLogin from "@/components/auth/SocialLogin";
import styles from "./login.module.css";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const captchaToken = await getRecaptchaToken("login");
      await ApiComunicator("/auth/login", "POST", { ...form, captchaToken });
      router.refresh();
      router.replace("/operations/calendar");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
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
          <h2 className={styles.title}>Welcome to Fleetrust!</h2>
          <p className={styles.subtitle}></p>

              <Form onSubmit={handleSubmit}>
                <FormGroup className="mb-3" floating>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                  <Label for="email">
                    Email
                  </Label>
                </FormGroup>

                <PasswordInput
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="current-password"
                  className="mb-2"
                  required
                />
                <Link href="/forgot-password" className={styles.forgot}>Forgot password?</Link>

                {error && (
                  <Alert color="danger" className="py-2">
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  color="primary"
                  className={`w-100 ${styles.submit}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Logging in...
                    </>
                  ) : (
                    <>Login</>
                  )}
                </Button>
              </Form>
              <SocialLogin />
              <p className={styles.links}>
                Don't have an account? <Link href="/register">Create one</Link>
              </p>
              <p className={styles.links}>
                Have any questions? Visit our <Link href="/faq">FAQ's section</Link>
              </p>
        </div>
      </div>
    </div>
  );
}
