import Link from "next/link";
import { Logout } from "@carbon/icons-react";
import { signOut } from "@/auth";
import { NavLinks } from "./nav-links";
import styles from "./nav.module.css";

export function Nav() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand}>
          Kontor
        </Link>
        <NavLinks />
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className={styles.signOut}
            aria-label="Abmelden"
            title="Abmelden"
          >
            <Logout size={16} />
          </button>
        </form>
      </nav>
    </header>
  );
}
