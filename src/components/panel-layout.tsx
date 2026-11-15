import { useState, type CSSProperties } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { LoadStatus } from "@/components/load-status";
import { NotFound } from "@/components/not-found";
import { PanelPinGate } from "@/components/panel-pin-gate";
import { usePublicBusiness } from "@/hooks/use-public-business";
import { DEFAULT_BUSINESS_SLUG } from "@/lib/public-business";
import { readPanelUnlocked, savePanelUnlocked } from "@/utils/panel-session";

const NAV_ITEMS = [{ to: "/panel/servicios", label: "Servicios" }];

/** Shell of the owner panel: business bar, section navigation and page content. */
export function PanelLayout() {
  // Temporary: there is no sign-in yet, so the panel always opens the sample business.
  const state = usePublicBusiness(DEFAULT_BUSINESS_SLUG);
  const [isUnlocked, setIsUnlocked] = useState(() =>
    readPanelUnlocked(DEFAULT_BUSINESS_SLUG),
  );

  function handleSetUnlocked(nextIsUnlocked: boolean) {
    savePanelUnlocked(DEFAULT_BUSINESS_SLUG, nextIsUnlocked);
    setIsUnlocked(nextIsUnlocked);
  }

  if (state.status === "loading") return <LoadStatus />;
  if (state.status === "error") return <LoadStatus onRetry={state.retry} />;

  const { business } = state;
  if (!business) return <NotFound />;

  const accentStyle = { "--accent": business.color } as CSSProperties;

  if (!isUnlocked) {
    return (
      <div
        style={accentStyle}
        className="flex flex-1 flex-col bg-cream font-sans text-ink"
      >
        <title>{`Panel · ${business.name}`}</title>
        <PanelPinGate
          business={business}
          onUnlock={() => handleSetUnlocked(true)}
        />
      </div>
    );
  }

  return (
    <div
      style={accentStyle}
      className="flex flex-1 flex-col bg-cream font-sans text-ink"
    >
      <title>{`Panel · ${business.name}`}</title>
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--accent) font-bold text-ink"
            >
              {business.name.charAt(0)}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-semibold">{business.name}</span>
              <span className="text-xs font-semibold tracking-[0.15em] text-gold uppercase">
                Panel
              </span>
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link
              to={`/${business.slug}`}
              className="flex min-h-12 items-center text-sm font-semibold text-gold"
            >
              Ver página pública
            </Link>
            <button
              type="button"
              onClick={() => handleSetUnlocked(false)}
              className="flex min-h-12 items-center text-sm font-semibold text-ink/60 transition-colors hover:text-ink"
            >
              Salir
            </button>
          </div>
        </div>
        <nav
          aria-label="Secciones del panel"
          className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 md:px-8"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex min-h-12 shrink-0 items-center border-b-2 px-1 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-(--accent) text-ink"
                    : "border-transparent text-ink/60 hover:text-ink"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 md:px-8 md:py-10">
        <Outlet context={business} />
      </div>
    </div>
  );
}
