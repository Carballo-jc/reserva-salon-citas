type LoadStatusProps = {
  /** When set, the load failed and this retries it; otherwise it is still loading. */
  onRetry?: () => void;
};

/** Full-page placeholder while a page loads its data, or the error with a retry button. */
export function LoadStatus({ onRetry }: LoadStatusProps) {
  if (!onRetry) {
    return (
      <main
        role="status"
        className="flex flex-1 items-center justify-center p-8 text-ink/60"
      >
        Cargando…
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center text-ink">
      <p role="alert" className="text-ink/70">
        No pudimos cargar la página. Revisá tu conexión e intentá de nuevo.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="flex min-h-12 items-center justify-center rounded-xl border border-ink/20 px-6 font-semibold transition-colors hover:border-ink/50"
      >
        Reintentar
      </button>
    </main>
  );
}
