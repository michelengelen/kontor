"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./nav.module.css";

export function NavLinks() {
  const pathname = usePathname();
  const links = [
    {
      href: "/sheets",
      label: "Blätter",
      active: pathname === "/" || pathname.startsWith("/sheets"),
    },
    {
      href: "/vergleich",
      label: "Vergleich",
      active: pathname.startsWith("/vergleich"),
    },
    {
      href: "/template",
      label: "Vorlage",
      active: pathname.startsWith("/template"),
    },
  ];

  return (
    <div className={styles.links}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={link.active ? styles.linkActive : styles.link}
          aria-current={link.active ? "page" : undefined}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
