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
import styles from "./login.module.css";

export default function Login() {
  const [form, setForm] = useState({
    username: "",
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
      router.replace("/tours/calendar");
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
      </div>

      <div className={styles.formPanel}>
        <div className={styles.formBox}>
          <h1 className={`brand ${styles.formBrand}`}>Fleetrust</h1>
          <h2 className={styles.title}>Sign in</h2>
          <p className={styles.subtitle}>Enter your credentials to access the back office.</p>

              <Form onSubmit={handleSubmit}>
                <FormGroup className="mb-3" floating>
                  <Input
                    id="username"
                    type="text"
                    name="username"
                    placeholder="Enter your username"
                    value={form.username}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                  <Label for="username">
                    Username
                  </Label>
                </FormGroup>

                <FormGroup className="mb-4" floating>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                  <Label for="password">
                    Password
                  </Label>
                </FormGroup>

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
                    "Login"
                  )}
                </Button>
              </Form>
        </div>
      </div>
    </div>
  );
}
