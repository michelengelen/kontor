"use client";

import { useState } from "react";
import { ChevronDown } from "@carbon/icons-react";
import { formatCents } from "@/lib/money";
import ui from "@/components/ui.module.css";
import styles from "./sheets.module.css";

const COOKIE = "kontor-years";

function writeOpenState(year: number, open: boolean) {
  let map: Record<string, boolean> = {};
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${COOKIE}=`));
  if (match) {
    try {
      map = JSON.parse(decodeURIComponent(match.split("=")[1]));
    } catch {
      map = {};
    }
  }
  map[String(year)] = open;
  const value = encodeURIComponent(JSON.stringify(map));
  document.cookie = `${COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
}

export function YearGroup({
  year,
  defaultOpen,
  count,
  sumCents,
  children,
}: {
  year: number;
  defaultOpen: boolean;
  count: number;
  sumCents: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  function toggle() {
    const next = !open;
    setOpen(next);
    writeOpenState(year, next);
  }

  return (
    <section className={ui.card}>
      <button
        type="button"
        className={styles.yearHeader}
        aria-expanded={open}
        onClick={toggle}
      >
        <ChevronDown
          size={16}
          className={open ? ui.chevron : ui.chevronClosed}
        />
        <span className={styles.yearName}>{year}</span>
        <span className={ui.leader} aria-hidden />
        <span className={ui.metaMono}>
          {count} {count === 1 ? "Blatt" : "Blätter"} · {formatCents(sumCents)}
        </span>
      </button>
      <div className={open ? styles.yearBody : styles.yearBodyClosed}>
        <div>
          <div className={styles.yearContent}>{children}</div>
        </div>
      </div>
    </section>
  );
}
