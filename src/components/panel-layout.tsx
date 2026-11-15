import type { CSSProperties } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { NotFound } from "@/components/not-found";
import { DEFAULT_BUSINESS_SLUG, getPublicBusiness } from "@/lib/public-business";

const NAV_ITEMS = [{ to: "/panel/servicios", label: "Servicios" }];

/** Shell of the owner panel: business bar, section navigation and page content. */
export function PanelLayout() {
  // Temporary: there is no sign-in yet, so the panel always opens the sample business.
  const business = getPublicBusiness(DEFAULT_BUSINESS_SLUG);
  if (!business) return <NotFound />;

  const accentStyle = { "--accent": business.color } as CSSProperties;

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
          <Link
            to={`/${business.slug}`}
            className="flex min-h-12 items-center text-sm font-semibold text-gold"
          >
            Ver página pública
          </Link>
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
