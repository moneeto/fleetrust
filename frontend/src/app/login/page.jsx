"use client"
import { useState } from "react";
import { Badge, Card, CardBody, Button, ButtonGroup, Col, Form, Input, Label, Row, FormGroup, Modal, ModalHeader, ModalBody, ModalFooter, Alert, Progress, Container } from "reactstrap";
import { FaArrow } from "react-icons/fa"
import { ApiComunicator } from "@/helpers/ApiComunicator";

export default function Login() {
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      console.log("que onda lagarto");
      const resp = await ApiComunicator("/auth/login", "POST", form)
      console.log(resp)
    } catch (err) {
      console.log(err)
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Form onSubmit={handleSubmit}>
        <h2 >Iniciar Sesión</h2>

        <Input
          type="text"
          name="user"
          placeholder="Usuario"
          value={form.user}
          onChange={handleChange}
        />

        <Input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={handleChange}
        />

        {error && <Badge color="danger">{error}</Badge>}

        <Button
          type="submit"
          disabled={loading}
          color="primary"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </Button>
      </Form>
    </div>
  );
}