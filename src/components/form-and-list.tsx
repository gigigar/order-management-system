// Manage pages: the add form on the left and the list on the right. Stacks on narrow screens.
export function FormAndList({
  form,
  children,
}: {
  form: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-8">{form}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
