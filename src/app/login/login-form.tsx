"use client";

import { useActionState } from "react";
import { Input } from "@base-ui/react/input";
import { login } from "./actions";
import ui from "@/components/ui.module.css";
import styles from "./login.module.css";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action}>
      <div className={ui.field}>
        <label className={ui.label} htmlFor="password">
          Passwort
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          className={ui.input}
        />
      </div>
      {state?.error ? <p className={ui.error}>{state.error}</p> : null}
      <button type="submit" className={`${ui.buttonPrimaryWide} ${styles.submit}`} disabled={pending}>
        {pending ? "Anmelden…" : "Anmelden"}
      </button>
    </form>
  );
}
