import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Icon } from "@/components/icon";
import type { PublicService } from "@/lib/public-business";
import {
  parseSavedCustomer,
  readSavedCustomerRaw,
  saveCustomer,
  type CustomerDetails,
} from "@/utils/customer-storage";
import { formatArs, getDepositAmount } from "@/utils/money";
import { addMinutesToTime } from "@/utils/time";

export type BookingDay = {
  /** YYYY-MM-DD */
  date: string;
  weekdayLabel: string;
  dayLabel: string;
  /** Full date for the summary, e.g. "jueves 19 de noviembre". */
  longLabel: string;
  slots: string[];
};

type BookingFormProps = {
  days: BookingDay[];
  /** Path of the next step; the chosen date and time are appended as query params. */
  nextPath: string;
  staffId: string;
  /** Professional shown in the summary, e.g. "Sofía" or "Cualquiera". */
  staffLabel: string;
  service: PublicService;
};

const MIN_PHONE_DIGITS = 8;
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

/** Slots before this time are listed under "Mañana", the rest under "Tarde". */
const AFTERNOON_START = "12:00";

const INPUT_CLASS =
  "min-h-12 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-base text-white outline-none transition-colors focus:border-(--accent)";

const STRIP_ARROW_CLASS =
  "flex size-12 items-center justify-center rounded-xl border border-white/20 text-white transition-colors hover:border-white/50";

/** Booking step: pick a day and a free time, then fill in the customer details. */
export function BookingForm({
  days,
  nextPath,
  staffId,
  staffLabel,
  service,
}: BookingFormProps) {
  const navigate = useNavigate();
  const dayStripRef = useRef<HTMLUListElement>(null);

  const firstDayWithSlots = days.find((day) => day.slots.length > 0);
  const [selectedDate, setSelectedDate] = useState(
    firstDayWithSlots?.date ?? days[0]?.date ?? "",
  );
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Details remembered on this device prefill the form.
  const [customer, setCustomer] = useState<CustomerDetails>(() =>
    parseSavedCustomer(readSavedCustomerRaw()),
  );

  const selectedDay = days.find((day) => day.date === selectedDate);
  const slots = selectedDay?.slots ?? [];
  const slotGroups = [
    { label: "Mañana", slots: slots.filter((slot) => slot < AFTERNOON_START) },
    { label: "Tarde", slots: slots.filter((slot) => slot >= AFTERNOON_START) },
  ].filter((group) => group.slots.length > 0);

  const depositAmount = getDepositAmount(
    service.price,
    service.depositType,
    service.depositValue,
  );
  const remainingAmount = service.price - depositAmount;
  const timeRangeLabel =
    selectedSlot === null
      ? "Elegí un horario"
      : `${selectedSlot} a ${addMinutesToTime(selectedSlot, service.durationMin)}`;
  const summaryRows = [
    { label: "Servicio", value: service.name },
    { label: "Profesional", value: staffLabel },
    { label: "Día", value: selectedDay?.longLabel ?? "" },
    { label: "Horario", value: timeRangeLabel },
    { label: "Total", value: formatArs(service.price) },
  ];

  /** Scrolls the strip of days one "page" back (-1) or forward (1). */
  function scrollDayStrip(direction: -1 | 1) {
    const strip = dayStripRef.current;
    if (!strip) return;
    strip.scrollBy({ left: direction * strip.clientWidth, behavior: "smooth" });
  }

  const phoneDigits = customer.phone.replace(/\D/g, "");
  const isNameValid = customer.name.trim().length > 0;
  const isPhoneValid = phoneDigits.length >= MIN_PHONE_DIGITS;
  const isEmailValid =
    customer.email.trim() === "" || EMAIL_PATTERN.test(customer.email.trim());
  const canContinue =
    selectedSlot !== null && isNameValid && isPhoneValid && isEmailValid;

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canContinue || selectedSlot === null) return;

    saveCustomer({
      name: customer.name.trim(),
      phone: customer.phone.trim(),
      email: customer.email.trim(),
    });
    const query = new URLSearchParams({
      profesional: staffId,
      fecha: selectedDate,
      hora: selectedSlot,
    });
    navigate(`${nextPath}?${query}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-8"
    >
      <div className="flex min-w-0 flex-col gap-8">
        <section aria-labelledby="schedule-title" className="flex flex-col gap-5">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1
                id="schedule-title"
                className="font-serif text-3xl font-semibold"
              >
                ¿Cuándo querés venir?
              </h1>
              <p className="text-sm text-white/60">
                Mostramos solo los horarios libres. Duración:{" "}
                {service.durationMin} min.
              </p>
            </div>
            <div className="hidden shrink-0 gap-2 md:flex">
              <button
                type="button"
                aria-label="Días anteriores"
                onClick={() => scrollDayStrip(-1)}
                className={STRIP_ARROW_CLASS}
              >
                <Icon name="chevron-left" className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Días siguientes"
                onClick={() => scrollDayStrip(1)}
                className={STRIP_ARROW_CLASS}
              >
                <Icon name="chevron-right" className="size-5" />
              </button>
            </div>
          </div>

          <ul
            ref={dayStripRef}
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0"
          >
            {days.map((day) => {
              const isSelected = day.date === selectedDate;
              const freeCount = day.slots.length;
              const hasSlots = freeCount > 0;
              const freeLabel = freeCount === 1 ? "1 libre" : `${freeCount} libres`;
              return (
                <li key={day.date} className="shrink-0">
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    disabled={!hasSlots}
                    onClick={() => handleSelectDate(day.date)}
                    className={`flex min-h-20 w-24 flex-col items-center justify-center rounded-2xl border text-sm transition-colors disabled:cursor-not-allowed disabled:border-white/5 disabled:text-white/30 ${
                      isSelected
                        ? "border-(--accent) bg-(--accent) text-night"
                        : "border-white/15 bg-night-raised text-white hover:border-white/40"
                    }`}
                  >
                    <span
                      className={`font-semibold capitalize ${hasSlots ? "" : "line-through"}`}
                    >
                      {day.weekdayLabel}
                    </span>
                    <span
                      className={`text-xl font-bold ${hasSlots ? "" : "line-through"}`}
                    >
                      {day.dayLabel}
                    </span>
                    <span className="text-xs opacity-80">
                      {hasSlots ? freeLabel : "Sin turnos"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {slotGroups.length > 0 ? (
            slotGroups.map((group) => (
              <div key={group.label} className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold">{group.label}</h2>
                <ul className="flex flex-wrap gap-2">
                  {group.slots.map((slot) => {
                    const isSelected = slot === selectedSlot;
                    return (
                      <li key={slot}>
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setSelectedSlot(slot)}
                          className={`min-h-12 w-20 rounded-xl border font-semibold tabular-nums transition-colors ${
                            isSelected
                              ? "border-(--accent) bg-(--accent) text-night"
                              : "border-white/15 bg-night-raised text-white hover:border-white/40"
                          }`}
                        >
                          {slot}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-white/5 p-6 text-center text-sm text-white/60">
              No hay horarios disponibles para este día.
            </p>
          )}
        </section>

        <section
          aria-labelledby="customer-title"
          className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-night-raised p-5 md:p-6"
        >
          <h2 id="customer-title" className="text-lg font-bold">
            Tus datos
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Nombre
              <input
                type="text"
                name="name"
                autoComplete="name"
                value={customer.name}
                onChange={(event) =>
                  setCustomer((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className={INPUT_CLASS}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              WhatsApp
              <input
                type="tel"
                name="phone"
                inputMode="tel"
                autoComplete="tel"
                value={customer.phone}
                onChange={(event) =>
                  setCustomer((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                className={INPUT_CLASS}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium md:col-span-2">
              <span>
                Email{" "}
                <span className="font-normal text-white/40">(opcional)</span>
              </span>
              <input
                type="email"
                name="email"
                inputMode="email"
                autoComplete="email"
                value={customer.email}
                onChange={(event) =>
                  setCustomer((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className={INPUT_CLASS}
              />
            </label>
          </div>
        </section>
      </div>

      <aside
        aria-labelledby="summary-title"
        className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-night-raised p-5 md:p-6 lg:sticky lg:top-6"
      >
        <h2 id="summary-title" className="text-lg font-bold">
          Resumen
        </h2>
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
            <span className="text-sm font-semibold">Seña para confirmar</span>
            <span className="text-xl font-bold">
              {formatArs(depositAmount)}
            </span>
          </div>
          {remainingAmount > 0 && (
            <p className="text-xs text-white/60">
              Los {formatArs(remainingAmount)} restantes los pagás en el salón.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!canContinue}
          className="flex min-h-12 w-full items-center justify-center rounded-xl bg-(--accent) px-8 font-semibold text-night transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continuar
        </button>
      </aside>
    </form>
  );
}
