import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { verifyPanelPin } from "@/lib/panel-access";
import type { PublicBusiness } from "@/lib/public-business";

type PanelPinGateProps = {
  business: PublicBusiness;
  onUnlock: () => void;
};

type GateError = "wrong" | "locked" | "network";

const ERROR_MESSAGES: Record<GateError, string> = {
  wrong: "Clave incorrecta.",
  locked: "Demasiados intentos. Probá de nuevo en unos minutos.",
  network:
    "No pudimos verificar la clave. Revisá tu conexión e intentá de nuevo.",
};

/** Asks for the PIN of the business before showing its panel. */
export function PanelPinGate({ business, onUnlock }: PanelPinGateProps) {
  const [pin, setPin] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<GateError | null>(null);

  const canSubmit = pin.length > 0 && !isChecking;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setIsChecking(true);
    setError(null);
    try {
      const result = await verifyPanelPin(business.slug, pin);
      if (result === "ok") {
        onUnlock();
        return;
      }
      setError(result);
      setPin("");
    } catch {
      // The PIN is kept so the same attempt can be retried.
      setError("network");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex w-full max-w-sm flex-col gap-5 rounded-3xl border border-ink/10 bg-white p-6 md:p-8"
      >
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-[0.15em] text-gold uppercase">
            {business.name}
          </p>
          <h1 className="font-serif text-3xl font-semibold">Panel del salón</h1>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Clave
          <input
            type="password"
            name="pin"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            aria-invalid={error === "wrong"}
            aria-describedby={error ? "pin-error" : undefined}
            className="min-h-12 w-full rounded-xl border border-ink/15 bg-white px-4 text-base tracking-widest text-ink outline-none transition-colors focus:border-(--accent)"
          />
        </label>

        {error && (
          <p id="pin-error" role="alert" className="text-sm text-red-700">
            {ERROR_MESSAGES[error]}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex min-h-12 items-center justify-center rounded-xl bg-(--accent) px-8 font-semibold text-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isChecking ? "Verificando…" : "Entrar"}
        </button>

        <Link
          to={`/${business.slug}`}
          className="flex min-h-12 items-center justify-center text-sm font-semibold text-ink/60 transition-colors hover:text-ink"
        >
          Volver a la página del salón
        </Link>
      </form>
    </main>
  );
}
