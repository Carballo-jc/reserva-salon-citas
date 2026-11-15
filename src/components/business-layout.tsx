import { useEffect, type CSSProperties } from "react";
import { Link, Outlet, useLocation, useParams } from "react-router";
import { LoadStatus } from "@/components/load-status";
import { NotFound } from "@/components/not-found";
import { usePublicBusiness } from "@/hooks/use-public-business";

const APP_NAME = "Reserva Salón";

/**
 * Shell of the public pages of a business: loads the business once for all the
 * booking steps and renders branding, background and footer around them.
 */
export function BusinessLayout() {
  const { slug = "" } = useParams();
  const { pathname } = useLocation();
  const state = usePublicBusiness(slug);

  // Each booking step starts at the top of the page.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (state.status === "loading") return <LoadStatus />;
  if (state.status === "error") return <LoadStatus onRetry={state.retry} />;

  const { business } = state;
  if (!business) return <NotFound />;

  // Each business brands its public page with its own accent color.
  const accentStyle = { "--accent": business.color } as CSSProperties;

  return (
    <div
      style={accentStyle}
      className="flex flex-1 flex-col bg-cream font-sans text-ink"
    >
      <title>{`${business.name} · Turnos`}</title>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 md:px-8 md:py-12">
        <Outlet context={business} />
        <footer className="mt-auto flex flex-col items-center gap-1 pt-10 text-xs text-ink/40">
          <span>Hecho con {APP_NAME}</span>
          {/* Discreet entry for the salon staff; customers do not need it. */}
          <Link
            to="/panel"
            className="flex min-h-12 items-center font-semibold text-ink/60 underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            Panel del salón
          </Link>
        </footer>
      </div>
    </div>
  );
}
