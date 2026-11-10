"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Lista" },
  { href: "/calendario", label: "Calendario" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex rounded-lg bg-zinc-200/70 p-0.5 text-sm dark:bg-zinc-800/70">
      {LINKS.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              active
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
