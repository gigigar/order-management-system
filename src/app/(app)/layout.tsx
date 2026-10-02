import Link from "next/link";
import { SignOutButton } from "@/components/auth-buttons";
import { requireUser } from "@/lib/session";

const links = [
  { href: "/areas", label: "Areas" },
  { href: "/schools", label: "Schools" },
  { href: "/agents", label: "Agents" },
];

// Shell for every signed-in page. Each page and action still checks the session
// itself: a layout isn't a security boundary.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <nav aria-label="Main">
          <ul className="flex gap-4">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span>
            {user.name} ({user.role})
          </span>
          <SignOutButton />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
