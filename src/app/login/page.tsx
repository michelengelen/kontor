import { LoginForm } from "./login-form";
import styles from "./login.module.css";

export const metadata = { title: "Anmelden — Kontor" };

export default function LoginPage() {
  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <p className={styles.brand}>Kontor</p>
        <h1 className={styles.title}>Anmelden</h1>
        <hr className={styles.rule} />
        <LoginForm />
      </div>
    </main>
  );
}
