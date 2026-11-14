import { Link } from "react-router";
import { Icon } from "@/components/icon";
import type { PublicBusiness } from "@/lib/public-business";

type BookingHeaderProps = {
  business: PublicBusiness;
  /** Name of the chosen service, shown as the completed first step. */
  serviceName: string;
  currentStep: 2 | 3;
  backHref: string;
};

/** Header of the booking steps: business bar, back link and progress through the 3 steps. */
export function BookingHeader({
  business,
  serviceName,
  currentStep,
  backHref,
}: BookingHeaderProps) {
  const steps = [
    { number: 1, label: serviceName },
    { number: 2, label: "Día y horario" },
    { number: 3, label: "Pagar seña" },
  ];

  return (
    <header className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
        <Link
          to={`/${business.slug}`}
          className="flex min-h-12 min-w-0 items-center gap-3"
        >
          {business.logoUrl ? (
            <img
              src={business.logoUrl}
              alt=""
              className="size-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--accent) font-bold text-night"
            >
              {business.name.charAt(0)}
            </span>
          )}
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-semibold">{business.name}</span>
            {business.address && (
              <span className="truncate text-sm text-white/60">
                {business.address}
              </span>
            )}
          </span>
        </Link>
        {business.whatsapp && (
          <a
            href={`https://wa.me/${business.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 shrink-0 items-center gap-2 text-sm font-semibold text-(--accent)"
          >
            <Icon name="whatsapp" className="size-5 md:hidden" />
            <span className="hidden md:inline">
              ¿Dudas? Escribinos por WhatsApp
            </span>
          </a>
        )}
      </div>

      <Link
        to={backHref}
        className="-ml-2 flex min-h-12 items-center gap-2 self-start px-2 text-sm font-semibold text-white/70 transition-colors hover:text-white"
      >
        <Icon name="arrow-left" className="size-5" />
        Volver
      </Link>

      <ol className="flex gap-2 md:gap-3">
        {steps.map((step) => {
          const isDone = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          return (
            <li
              key={step.number}
              aria-current={isCurrent ? "step" : undefined}
              className={`flex min-h-14 min-w-0 items-center gap-3 rounded-2xl border px-4 md:flex-1 ${
                isCurrent
                  ? "flex-1 border-(--accent) bg-(--accent)/10"
                  : "border-transparent bg-white/5"
              }`}
            >
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  isDone
                    ? "bg-emerald-500 text-night"
                    : isCurrent
                      ? "bg-(--accent) text-night"
                      : "bg-white/10 text-white/70"
                }`}
              >
                {isDone ? (
                  <Icon name="check" className="size-4" />
                ) : (
                  step.number
                )}
              </span>
              {/* On small screens only the current step shows its label. */}
              <span
                className={`min-w-0 flex-col ${isCurrent ? "flex" : "hidden md:flex"}`}
              >
                <span className="text-xs text-white/60">
                  Paso {step.number}
                </span>
                <span className="truncate text-sm font-semibold">
                  {step.label}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </header>
  );
}
