const PRODUCT_NAME = "Order Management System";

// The logo and business name come from the environment so they stay out of this public repo.
// Without them (the public demo), the product name stands in as the title.
export function Brand({ variant }: { variant: "login" | "sidebar" }) {
  const businessName = process.env.BUSINESS_NAME;
  const logoUrl = process.env.BUSINESS_LOGO_URL;

  // next/image needs the host in the repo, which would make it public.
  /* eslint-disable @next/next/no-img-element */
  if (variant === "login") {
    return (
      <>
        {logoUrl && <img src={logoUrl} alt="" className="mx-auto mb-2 h-20" />}
        <h1 className="text-2xl font-semibold tracking-tight">
          {businessName || PRODUCT_NAME}
        </h1>
        {businessName && (
          <p className="text-sm text-muted-foreground">{PRODUCT_NAME}</p>
        )}
      </>
    );
  }

  return (
    <div className="flex items-center gap-2.5 px-2">
      {logoUrl ? (
        <img src={logoUrl} alt="" className="h-10 shrink-0" />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary font-bold text-sidebar-primary-foreground"
        >
          O
        </span>
      )}
      <span className="flex flex-col">
        <span className="text-[15px] font-semibold text-white">
          {businessName || PRODUCT_NAME}
        </span>
        {businessName && (
          <span className="text-[11px] font-normal text-[#b9a894]">
            {PRODUCT_NAME}
          </span>
        )}
      </span>
    </div>
  );
  /* eslint-enable @next/next/no-img-element */
}
