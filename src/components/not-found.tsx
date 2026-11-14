/** Shown when the business or the service in the URL does not exist. */
export function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-white">
      <h1 className="font-serif text-3xl font-bold">Página no encontrada</h1>
      <p className="text-white/60">Revisá que el enlace esté bien escrito.</p>
    </main>
  );
}
