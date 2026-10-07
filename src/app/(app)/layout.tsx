import { SignOutButton } from "@/components/auth-buttons";
import { NavLinks, type NavLink } from "@/components/nav-links";
import { requireUser } from "@/lib/session";

// Daily pages first (Dashboard joins them when it's built).
// Setup is reference data the owners touch a few times a year.
const dailyLinks: NavLink[] = [
  { href: "/batches", label: "Batches" },
  { href: "/orders", label: "Orders" },
];
const setupLinks: NavLink[] = [
  { href: "/areas", label: "Areas" },
  { href: "/schools", label: "Schools" },
  { href: "/agents", label: "Agents" },
  { href: "/designs", label: "Designs" },
  { href: "/stones", label: "Stones" },
];
const adminSetupLinks: NavLink[] = [{ href: "/invites", label: "Invites" }];

// Shell for every signed-in page: a sidebar on laptops, a Menu button on phones.
// Each page and action still checks the session itself: a layout isn't a security boundary.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const setup =
    user.role === "admin" ? [...setupLinks, ...adminSetupLinks] : setupLinks;
  const navigation = (
    <div className="flex flex-col gap-4">
      <NavLinks links={dailyLinks} />
      <div className="flex flex-col gap-1">
        <h2 className="px-3 text-xs font-semibold tracking-wide text-gray-600 uppercase">
          Setup
        </h2>
        <NavLinks links={setup} />
      </div>
    </div>
  );

  const account = (
    <div className="flex flex-col gap-2 border-t pt-3 text-sm">
      <span>
        {user.name} ({user.role})
      </span>
      <SignOutButton />
    </div>
  );

  return (
    <div className="md:flex md:min-h-screen">
      {/* Phones: native <details> opens and closes the menu without any JavaScript. */}
      <details className="border-b p-3 md:hidden">
        <summary className="cursor-pointer font-medium">Menu</summary>
        <nav aria-label="Main" className="mt-3 flex flex-col gap-3">
          {navigation}
          {account}
        </nav>
      </details>

      <aside className="hidden w-56 shrink-0 flex-col gap-4 border-r p-4 md:flex">
        <nav aria-label="Main" className="flex flex-1 flex-col justify-between">
          {navigation}
          {account}
        </nav>
      </aside>

      <main className="w-full max-w-6xl p-4 md:p-6">{children}</main>
    </div>
  );
}
