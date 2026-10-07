"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConfirmLeave } from "./unsaved-changes";

export type NavLink = { href: string; label: string };

// Client component only to know the current page, for aria-current and the highlight.
export function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const confirmLeave = useConfirmLeave();
  return (
    <ul className="flex flex-col gap-1">
      {links.map((link) => {
        const current =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={current ? "page" : undefined}
              onNavigate={confirmLeave}
              // On phones the menu is a <details>; close it after choosing a page.
              onClick={(e) =>
                e.currentTarget.closest("details")?.removeAttribute("open")
              }
              className="block rounded px-3 py-2 hover:bg-gray-100 aria-[current=page]:bg-gray-900 aria-[current=page]:text-white"
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
