import { SignOutButton } from "@/components/auth-buttons";
import { NavLinks, type NavLink } from "@/components/nav-links";
import { UnsavedChangesProvider } from "@/components/unsaved-changes";
import { requireUser } from "@/lib/session";

// Daily pages first. Setup is reference data the owners touch a few times a year.
const dailyLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/batches", label: "Batch orders", icon: "batches" },
  { href: "/orders", label: "Individual orders", icon: "orders" },
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
    <div className="flex flex-col gap-6">
      <NavLinks links={dailyLinks} />
      <div className="flex flex-col gap-1">
        <h2 className="px-3 text-xs font-medium tracking-wider text-[#b9a894] uppercase">
          Setup
        </h2>
        <NavLinks links={setup} />
      </div>
    </div>
  );

  const initials = user.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const account = (
    <div className="flex flex-col gap-3 border-t border-sidebar-border pt-3 text-sm">
      <div className="flex items-center gap-2.5 px-1">
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full bg-[#5a4637] text-xs font-semibold text-white"
        >
          {initials}
        </span>
        <span className="flex flex-col">
          <span className="text-white">{user.name}</span>
          <span className="text-xs text-[#b9a894] capitalize">{user.role}</span>
        </span>
      </div>
      <SignOutButton />
    </div>
  );
  const logo = (
    <div className="flex items-center gap-2.5 px-2">
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary font-bold text-sidebar-primary-foreground"
      >
        O
      </span>
      <span className="text-[15px] font-semibold text-white">
        Order tracker
      </span>
    </div>
  );

  return (
    <UnsavedChangesProvider>
      <div className="md:flex md:min-h-screen">
        {/* Phones: native <details> opens and closes the menu without any JavaScript. */}
        <details className="bg-sidebar p-3 text-sidebar-foreground md:hidden">
          <summary className="flex cursor-pointer items-center justify-between font-medium text-white">
            {logo}
            <span>Menu</span>
          </summary>
          <nav aria-label="Main" className="mt-3 flex flex-col gap-3">
            {navigation}
            {account}
          </nav>
        </details>

        <aside className="hidden w-[232px] shrink-0 flex-col gap-6 bg-sidebar px-3.5 py-5 text-sidebar-foreground md:flex">
          {logo}
          <nav
            aria-label="Main"
            className="flex flex-1 flex-col justify-between"
          >
            {navigation}
            {account}
          </nav>
        </aside>

        <main className="w-full max-w-6xl p-4 md:px-10 md:py-8">
          {children}
        </main>
      </div>
    </UnsavedChangesProvider>
  );
}
