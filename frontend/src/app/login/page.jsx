"use client";

import { useState } from "react";
import {
  Badge,
  Card,
  CardBody,
  Button,
  Form,
  Input,
  Label,
  FormGroup,
  Alert,
  Spinner,
  Container,
  Row,
  Col
} from "reactstrap";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { getRecaptchaToken } from "@/helpers/recaptcha";
import { useRouter } from "next/navigation";

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
      router.replace("/tours/bookings");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="vh-100 bg-light">
      <Row className="h-100 justify-content-center align-items-center">
        <Col xs="12" sm="10" md="6" lg="4">
          <Card className="shadow-md" style={{ border: '0px' }}>
            <CardBody className="p-4">
              <img src="/images/logo-bw.svg" alt="Logo" className="mb-4 d-block mx-auto" style={{ maxWidth: '250px' }} />

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
                  className="w-100"
                  style={{backgroundColor: "black"}}
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
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
