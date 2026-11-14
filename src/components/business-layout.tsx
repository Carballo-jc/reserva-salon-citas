import { useEffect, type CSSProperties } from "react";
import { Outlet, useLocation, useParams } from "react-router";
import { NotFound } from "@/components/not-found";
import { getPublicBusiness } from "@/lib/public-business";

const APP_NAME = "Reserva Salón";

/** Shell of the public pages of a business: branding, background and footer. */
export function BusinessLayout() {
  const { slug } = useParams();
  const { pathname } = useLocation();

  // Each booking step starts at the top of the page.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const business = slug ? getPublicBusiness(slug) : null;
  if (!business) return <NotFound />;

  // Each business brands its public page with its own accent color.
  const accentStyle = { "--accent": business.color } as CSSProperties;

  return (
    <div
      style={accentStyle}
      className="flex flex-1 flex-col bg-night font-sans text-white"
    >
      <title>{`${business.name} · Turnos`}</title>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 md:px-8 md:py-12">
        <Outlet context={business} />
        <footer className="mt-auto pt-10 text-center text-xs text-white/40">
          Hecho con {APP_NAME}
        </footer>
      </div>
    </div>
  );
}
