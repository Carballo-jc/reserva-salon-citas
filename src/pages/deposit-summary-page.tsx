import { useState } from "react";
import { Navigate, useParams, useSearchParams } from "react-router";
import { BookingHeader } from "@/components/booking-header";
import { DepositPayment } from "@/components/deposit-payment";
import { Icon } from "@/components/icon";
import { NotFound } from "@/components/not-found";
import { useBusiness } from "@/hooks/use-business";
import { ANY_STAFF_ID, getAvailableDays } from "@/lib/public-business";
import { formatArs, getDepositAmount } from "@/utils/money";
import { addMinutesToTime } from "@/utils/time";

// Dates are plain YYYY-MM-DD in the business timezone; formatting them at noon UTC
// keeps the calendar day stable whatever the timezone of the device.
const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** Booking step: summary of the appointment and payment of the deposit before the hold expires. */
export function DepositSummaryPage() {
  const business = useBusiness();
  const { serviceId } = useParams();
  const [searchParams] = useSearchParams();
  const [availableDays] = useState(getAvailableDays);

  const holdMs = business.holdMinutes * 60 * 1000;
  // Temporary: the hold starts when the page opens. It will be the appointment's
  // hold_expires_at once bookings are saved.
  const [expiresAt] = useState(() => Date.now() + holdMs);

  const service = business.services.find((item) => item.id === serviceId);
  const staffId = searchParams.get("profesional") ?? ANY_STAFF_ID;
  const staff = business.staff.find((item) => item.id === staffId);
  const isKnownStaff = staffId === ANY_STAFF_ID || staff !== undefined;
  if (!service || !isKnownStaff) return <NotFound />;

  const chooseTimeHref = `/${business.slug}/reservar/${service.id}/horario?profesional=${staffId}`;

  // Without a valid, still-free date and time there is nothing to pay: go back to pick one.
  const date = searchParams.get("fecha");
  const slot = searchParams.get("hora");
  const selectedDay = availableDays.find((day) => day.date === date);
  const isSlotAvailable =
    slot !== null && selectedDay?.slots.includes(slot) === true;
  if (!selectedDay || !isSlotAvailable) {
    return <Navigate replace to={chooseTimeHref} />;
  }

  const depositAmount = getDepositAmount(
    service.price,
    service.depositType,
    service.depositValue,
  );
  const remainingAmount = service.price - depositAmount;
  const dateLabel = dateFormatter.format(
    new Date(`${selectedDay.date}T12:00:00Z`),
  );

  const summaryRows = [
    { label: "Servicio", value: service.name },
    { label: "Profesional", value: staff ? staff.name : "Cualquiera" },
    { label: "Fecha", value: dateLabel },
    {
      label: "Horario",
      value: `${slot} a ${addMinutesToTime(slot, service.durationMin)}`,
    },
    { label: "Total", value: formatArs(service.price) },
  ];

  return (
    <main className="flex flex-col gap-8">
      <BookingHeader
        business={business}
        serviceName={service.name}
        currentStep={3}
        backHref={chooseTimeHref}
      />

      <section
        aria-labelledby="summary-title"
        className="mx-auto flex w-full max-w-xl flex-col gap-5 rounded-3xl border border-white/10 bg-night-raised p-5 md:p-8"
      >
        <h1 id="summary-title" className="font-serif text-3xl font-semibold">
          Resumen de tu turno
        </h1>

        <dl className="flex flex-col gap-3 text-sm">
          {summaryRows.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-4"
            >
              <dt className="text-white/60">{row.label}</dt>
              <dd className="text-right font-semibold first-letter:uppercase">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-1 rounded-2xl bg-white/5 p-4">
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-semibold">Seña a pagar</span>
            <span className="text-2xl font-bold text-(--accent)">
              {formatArs(depositAmount)}
            </span>
          </div>
          {remainingAmount > 0 && (
            <p className="text-xs text-white/60">
              Los {formatArs(remainingAmount)} restantes los pagás en el salón.
            </p>
          )}
        </div>

        <p className="flex gap-3 text-sm text-white/60">
          <Icon name="shield-check" className="size-5 shrink-0 text-gold" />
          <span>
            Podés reprogramar sin perder la seña hasta {business.cancelHours}{" "}
            horas antes del turno. Con menos anticipación, la seña se pierde.
          </span>
        </p>

        <DepositPayment
          expiresAt={expiresAt}
          initialRemainingMs={holdMs}
          chooseTimeHref={chooseTimeHref}
        />
      </section>
    </main>
  );
}
