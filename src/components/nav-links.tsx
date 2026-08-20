"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./nav.module.css";

export function NavLinks() {
  const pathname = usePathname();
  const links = [
    {
      href: "/sheets",
      label: "Sheets",
      active: pathname === "/" || pathname.startsWith("/sheets"),
    },
    {
      href: "/template",
      label: "Template",
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
