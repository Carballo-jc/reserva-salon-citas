import { Link, Navigate, useParams } from "react-router";
import { BookingHeader } from "@/components/booking-header";
import { Icon } from "@/components/icon";
import { NotFound } from "@/components/not-found";
import { useBusiness } from "@/hooks/use-business";
import { ANY_STAFF_ID } from "@/lib/public-business";

/** Booking step: pick a professional, or "Cualquiera" when there is no preference. */
export function ChooseStaffPage() {
  const business = useBusiness();
  const { serviceId } = useParams();

  const service = business.services.find((item) => item.id === serviceId);
  if (!service) return <NotFound />;

  const schedulePath = `/${business.slug}/reservar/${service.id}/horario`;

  // With a single professional there is nothing to choose: skip this step.
  const hasSingleStaff = business.staff.length === 1;
  if (hasSingleStaff) {
    const onlyStaffHref = `${schedulePath}?profesional=${business.staff[0].id}`;
    return <Navigate replace to={onlyStaffHref} />;
  }

  const staffOptions = [
    { id: ANY_STAFF_ID, name: "Cualquiera" },
    ...business.staff,
  ];

  return (
    <main className="flex flex-col gap-8">
      <BookingHeader
        business={business}
        serviceName={service.name}
        currentStep={2}
        backHref={`/${business.slug}`}
      />

      <section aria-labelledby="staff-title" className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 id="staff-title" className="font-serif text-3xl font-semibold">
            Elegí profesional
          </h1>
          <p className="text-sm text-ink/60">
            {service.name} · {service.durationMin} min
          </p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {staffOptions.map((staff) => (
            <li key={staff.id}>
              <Link
                to={`${schedulePath}?profesional=${staff.id}`}
                className="flex min-h-20 items-center gap-4 rounded-2xl border border-ink/10 bg-white p-4 transition-colors hover:border-(--accent)/60"
              >
                <span
                  aria-hidden
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-(--accent)/15 text-lg font-bold text-gold"
                >
                  {staff.id === ANY_STAFF_ID ? (
                    <Icon name="star" className="size-5" />
                  ) : (
                    staff.name.charAt(0)
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {staff.name}
                </span>
                <Icon
                  name="chevron-right"
                  className="size-5 shrink-0 text-ink/40"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
