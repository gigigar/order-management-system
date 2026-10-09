"use client";

import { LayoutDashboard, Table2, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConfirmLeave } from "./unsaved-changes";

// Icons are named here, not passed in: a server layout can't hand components to a client one.
const icons = {
  dashboard: LayoutDashboard,
  batches: Table2,
  orders: UserRound,
};

export type NavLink = {
  href: string;
  label: string;
  icon?: keyof typeof icons;
};

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
              className="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent/60 aria-[current=page]:bg-sidebar-accent aria-[current=page]:text-sidebar-accent-foreground aria-[current=page]:shadow-[inset_3px_0_0_var(--sidebar-primary)]"
            >
              {link.icon && <Icon name={link.icon} />}
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Icon({ name }: { name: keyof typeof icons }) {
  const Component = icons[name];
  return (
    <Component
      aria-hidden="true"
      className="size-[18px] shrink-0 group-aria-[current=page]:text-sidebar-primary"
      strokeWidth={1.8}
    />
  );
}
