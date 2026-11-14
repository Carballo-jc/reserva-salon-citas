import { useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { BookingForm, type BookingDay } from "@/components/booking-form";
import { BookingHeader } from "@/components/booking-header";
import { NotFound } from "@/components/not-found";
import { useBusiness } from "@/hooks/use-business";
import { ANY_STAFF_ID, getAvailableDays } from "@/lib/public-business";

// Dates are plain YYYY-MM-DD in the business timezone; formatting them at noon UTC
// keeps the calendar day stable whatever the timezone of the device.
const weekdayFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  timeZone: "UTC",
});

const longDateFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** Booking step: pick a day and time and fill in the customer details. */
export function ChooseDateTimePage() {
  const business = useBusiness();
  const { serviceId } = useParams();
  const [searchParams] = useSearchParams();
  // Computed once per visit so the grid does not change while the customer is choosing.
  const [availableDays] = useState(getAvailableDays);

  const service = business.services.find((item) => item.id === serviceId);
  const staffId = searchParams.get("profesional") ?? ANY_STAFF_ID;
  const staff = business.staff.find((item) => item.id === staffId);
  const isKnownStaff = staffId === ANY_STAFF_ID || staff !== undefined;
  if (!service || !isKnownStaff) return <NotFound />;

  const days: BookingDay[] = availableDays.map((day) => {
    const dayAtNoon = new Date(`${day.date}T12:00:00Z`);
    return {
      date: day.date,
      weekdayLabel: weekdayFormatter.format(dayAtNoon).replace(".", ""),
      dayLabel: String(dayAtNoon.getUTCDate()),
      longLabel: longDateFormatter.format(dayAtNoon),
      slots: day.slots,
    };
  });

  const servicePath = `/${business.slug}/reservar/${service.id}`;
  const hasSingleStaff = business.staff.length === 1;
  // With a single professional the previous step is skipped, so "back" goes to the business page.
  const backHref = hasSingleStaff ? `/${business.slug}` : servicePath;

  return (
    <main className="flex flex-col gap-8">
      <BookingHeader
        business={business}
        serviceName={service.name}
        currentStep={2}
        backHref={backHref}
      />
      <BookingForm
        days={days}
        nextPath={`${servicePath}/pago`}
        staffId={staffId}
        staffLabel={staff ? staff.name : "Cualquiera"}
        service={service}
      />
    </main>
  );
}
