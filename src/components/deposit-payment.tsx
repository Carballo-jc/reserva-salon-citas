import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Icon } from "@/components/icon";
import { formatCountdown } from "@/utils/format-countdown";

type DepositPaymentProps = {
  /** Moment the held time is released, as epoch milliseconds. */
  expiresAt: number;
  /** Time left when the server rendered the page, so the first paint matches on hydration. */
  initialRemainingMs: number;
  /** Where the customer picks a new time once the hold expired. */
  chooseTimeHref: string;
};

const TICK_MS = 1000;

/** Countdown of the held time plus the button to pay the deposit. */
export function DepositPayment({
  expiresAt,
  initialRemainingMs,
  chooseTimeHref,
}: DepositPaymentProps) {
  const [remainingMs, setRemainingMs] = useState(initialRemainingMs);
  const [isPaymentUnavailable, setIsPaymentUnavailable] = useState(false);

  const isExpired = remainingMs <= 0;

  useEffect(() => {
    if (isExpired) return;
    const intervalId = window.setInterval(() => {
      setRemainingMs(expiresAt - Date.now());
    }, TICK_MS);
    return () => window.clearInterval(intervalId);
  }, [expiresAt, isExpired]);

  if (isExpired) {
    return (
      <div className="flex flex-col gap-4">
        <p
          role="alert"
          className="rounded-2xl bg-white/5 p-4 text-center text-sm font-medium text-white/80"
        >
          Se agotó el tiempo y el horario se liberó.
        </p>
        <Link
          to={chooseTimeHref}
          className="flex min-h-12 w-full items-center justify-center rounded-xl border border-(--accent) px-8 font-semibold text-(--accent)"
        >
          Elegir otro horario
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 rounded-2xl bg-(--accent)/10 p-4 text-(--accent)">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Icon name="clock" className="size-5 shrink-0" />
          Te guardamos el horario por
        </span>
        <span
          role="timer"
          aria-live="off"
          className="text-2xl font-bold tabular-nums"
        >
          {formatCountdown(remainingMs)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setIsPaymentUnavailable(true)}
        className="flex min-h-12 w-full items-center justify-center rounded-xl bg-mp px-8 font-semibold text-white transition-opacity hover:opacity-90"
      >
        Pagar seña con Mercado Pago
      </button>

      {isPaymentUnavailable && (
        <p role="status" className="text-center text-sm text-white/60">
          El pago con Mercado Pago todavía no está conectado.
        </p>
      )}
    </div>
  );
}
