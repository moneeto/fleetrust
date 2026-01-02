"use client"
import { useState } from "react";
import { Badge, Card, CardBody, Button, ButtonGroup, Col, Form, Input, Label, Row, FormGroup, Modal, ModalHeader, ModalBody, ModalFooter, Alert, Progress, Container } from "reactstrap";
import { FaArrow } from "react-icons/fa"
import { ApiComunicator } from "@/helpers/ApiComunicator";
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
      const resp = await ApiComunicator("/auth/login", "POST", form);
      router.refresh();
      router.replace("/tours/bookings");
    } catch (err) {
      // console.log(err)
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Form onSubmit={handleSubmit}>
        <h2 >Log in</h2>

        <Input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
        />

        <Input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />

        {error && <Badge color="danger">{error}</Badge>}

        <Button
          type="submit"
          disabled={loading}
          color="primary"
        >
          {loading ? "Logging in..." : "Login"}
        </Button>
      </Form>
    </div>
  );
}