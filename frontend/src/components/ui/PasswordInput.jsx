"use client";

import { useState } from "react";
import { FormGroup, Input, Label } from "reactstrap";
import { PiEye, PiEyeSlash } from "react-icons/pi";
import styles from "@/app/login/login.module.css";

export default function PasswordInput({ label = "Password", className = "mb-3", ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <FormGroup className={`${className} ${styles.passwordGroup}`} floating>
      <Input {...props} placeholder={label} type={visible ? "text" : "password"} />
      <Label for={props.id}>{label}</Label>
      <button
        type="button"
        className={styles.eye}
        onClick={() => setVisible(!visible)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <PiEyeSlash size={20} /> : <PiEye size={20} />}
      </button>
    </FormGroup>
  );
}
