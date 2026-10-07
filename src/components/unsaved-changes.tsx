"use client";

import { createContext, use, useEffect, useRef, type RefObject } from "react";

// Lets a form with unsaved changes stop the sidebar links (and closing the tab) from
// throwing its work away. The flag is a ref, so typing doesn't re-render the sidebar.

const UnsavedChanges = createContext<RefObject<boolean> | null>(null);

export function UnsavedChangesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dirtyRef = useRef(false);
  return <UnsavedChanges value={dirtyRef}>{children}</UnsavedChanges>;
}

const message = "You have unsaved changes. Leave this page anyway?";

// In a form: pass React Hook Form's isDirty.
export function useWarnOnLeave(isDirty: boolean) {
  const dirtyRef = use(UnsavedChanges);
  useEffect(() => {
    if (!dirtyRef) return;
    if (!isDirty) {
      removeCopy();
      return;
    }
    dirtyRef.current = true;
    // Reload or closing the tab: the browser shows its own message.
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);

    // Back button: browsers can't cancel it, so add a copy of this page to the
    // history. Back then lands on the copy (same page, nothing lost) and we ask.
    // The marker keeps it to one copy however often the form becomes dirty again.
    if (!window.history.state?.[UNSAVED_MARKER]) {
      pushCopy();
    }
    const onBack = () => {
      if (window.confirm(message)) {
        window.removeEventListener("popstate", onBack);
        dirtyRef.current = false;
        window.history.back(); // past the copy, to the page they wanted
      } else {
        pushCopy(); // stay, and keep Back guarded
      }
    };
    window.addEventListener("popstate", onBack);

    return () => {
      dirtyRef.current = false;
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("popstate", onBack);
    };
  }, [dirtyRef, isDirty]);
}

const UNSAVED_MARKER = "unsavedChangesCopy";

// Once nothing is unsaved (after a save, or arriving back on an old copy), step off
// the copy so a single Back press leaves again. The flag stops a second step while
// the first is still happening (React runs effects twice in development).
let removingCopy = false;
function removeCopy() {
  if (removingCopy || !window.history.state?.[UNSAVED_MARKER]) return;
  removingCopy = true;
  window.addEventListener("popstate", () => (removingCopy = false), {
    once: true,
  });
  window.history.back();
}

// Keeps Next.js's own history state, so returning to the copy doesn't reload the page.
function pushCopy() {
  window.history.pushState(
    { ...window.history.state, [UNSAVED_MARKER]: true },
    "",
    window.location.href,
  );
}

// For <Link onNavigate>: asks before leaving a page with unsaved changes.
export function useConfirmLeave() {
  const dirtyRef = use(UnsavedChanges);
  return (event: { preventDefault: () => void }) => {
    if (dirtyRef?.current && !window.confirm(message)) event.preventDefault();
  };
}
