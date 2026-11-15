import { useState, type FormEvent } from "react";
import { ServiceForm, type PanelService } from "@/components/service-form";
import { useBusiness } from "@/hooks/use-business";
import type { ServiceCategory } from "@/lib/public-business";
import { formatArs, getDepositAmount } from "@/utils/money";

/** What the service dialog is doing: closed, adding a service or editing one. */
type ServiceDialog =
  | { mode: "closed" }
  | { mode: "new" }
  | { mode: "edit"; service: PanelService };

const SECONDARY_BUTTON_CLASS =
  "flex min-h-12 items-center justify-center rounded-xl border border-ink/20 px-4 text-sm font-semibold transition-colors hover:border-ink/50";
const CATEGORY_INPUT_CLASS =
  "min-h-12 min-w-0 flex-1 rounded-xl border border-ink/15 bg-white px-4 text-base outline-none transition-colors focus:border-(--accent)";

/**
 * Panel section: services grouped by category, each one defined by the salon.
 * Temporary: changes live only in this page until the database is connected.
 */
export function PanelServicesPage() {
  const business = useBusiness();
  const [categories, setCategories] = useState<ServiceCategory[]>(
    business.categories,
  );
  const [services, setServices] = useState<PanelService[]>(() =>
    business.services.map((service) => ({ ...service, isActive: true })),
  );
  const [dialog, setDialog] = useState<ServiceDialog>({ mode: "closed" });
  const [newCategoryName, setNewCategoryName] = useState("");
  // Category being renamed and its draft name.
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const canAddCategory = newCategoryName.trim().length > 0;
  const canRename = renameDraft.trim().length > 0;

  function handleSaveService(saved: PanelService) {
    setServices((current) => {
      const exists = current.some((service) => service.id === saved.id);
      return exists
        ? current.map((service) => (service.id === saved.id ? saved : service))
        : [...current, saved];
    });
    setDialog({ mode: "closed" });
  }

  function handleToggleActive(serviceId: string) {
    setServices((current) =>
      current.map((service) =>
        service.id === serviceId
          ? { ...service, isActive: !service.isActive }
          : service,
      ),
    );
  }

  function handleAddCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canAddCategory) return;
    const category: ServiceCategory = {
      id: crypto.randomUUID(),
      name: newCategoryName.trim(),
      icon: "sparkles",
    };
    setCategories((current) => [...current, category]);
    setNewCategoryName("");
  }

  function handleStartRename(category: ServiceCategory) {
    setRenamingId(category.id);
    setRenameDraft(category.name);
  }

  function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canRename) return;
    setCategories((current) =>
      current.map((category) =>
        category.id === renamingId
          ? { ...category, name: renameDraft.trim() }
          : category,
      ),
    );
    setRenamingId(null);
  }

  return (
    <main className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-4xl font-bold tracking-tight">
            Servicios
          </h1>
          <p className="text-ink/60">
            Lo que las clientas pueden reservar, agrupado por categoría.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialog({ mode: "new" })}
          disabled={categories.length === 0}
          className="flex min-h-12 items-center justify-center rounded-xl bg-(--accent) px-6 font-semibold text-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Nuevo servicio
        </button>
      </header>

      {categories.map((category) => {
        const categoryServices = services.filter(
          (service) => service.categoryId === category.id,
        );
        const isRenaming = renamingId === category.id;
        return (
          <section
            key={category.id}
            aria-label={category.name}
            className="flex flex-col gap-3"
          >
            {isRenaming ? (
              <form onSubmit={handleRename} className="flex flex-wrap gap-2">
                <input
                  type="text"
                  aria-label="Nombre de la categoría"
                  autoFocus
                  value={renameDraft}
                  onChange={(event) => setRenameDraft(event.target.value)}
                  className={CATEGORY_INPUT_CLASS}
                />
                <button
                  type="submit"
                  disabled={!canRename}
                  className={`${SECONDARY_BUTTON_CLASS} disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setRenamingId(null)}
                  className={SECONDARY_BUTTON_CLASS}
                >
                  Cancelar
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xs font-semibold tracking-[0.15em] text-gold uppercase">
                  {category.name}
                </h2>
                <button
                  type="button"
                  onClick={() => handleStartRename(category)}
                  className="flex min-h-12 items-center text-sm font-semibold text-ink/60 transition-colors hover:text-ink"
                >
                  Renombrar
                </button>
              </div>
            )}

            {categoryServices.length > 0 ? (
              <ul className="flex flex-col divide-y divide-ink/10 rounded-3xl border border-ink/10 bg-white">
                {categoryServices.map((service) => {
                  const depositAmount = getDepositAmount(
                    service.price,
                    service.depositType,
                    service.depositValue,
                  );
                  const depositLabel =
                    depositAmount > 0
                      ? `Seña ${formatArs(depositAmount)}`
                      : "Sin seña";
                  return (
                    <li
                      key={service.id}
                      className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-6 md:px-6"
                    >
                      <div
                        className={`flex min-w-0 flex-1 flex-col gap-1 ${service.isActive ? "" : "opacity-50"}`}
                      >
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-serif text-xl font-semibold">
                            {service.name}
                          </span>
                          {!service.isActive && (
                            <span className="rounded-full bg-ink/10 px-2.5 py-0.5 text-xs font-semibold">
                              Inactivo
                            </span>
                          )}
                        </span>
                        <span className="text-sm text-ink/60">
                          {service.durationMin} min ·{" "}
                          {formatArs(service.price)} · {depositLabel}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDialog({ mode: "edit", service })}
                          className={`${SECONDARY_BUTTON_CLASS} flex-1 md:flex-none`}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(service.id)}
                          className={`${SECONDARY_BUTTON_CLASS} flex-1 md:w-28 md:flex-none`}
                        >
                          {service.isActive ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-3xl border border-dashed border-ink/20 p-6 text-center text-sm text-ink/60">
                Esta categoría todavía no tiene servicios.
              </p>
            )}
          </section>
        );
      })}

      <form
        onSubmit={handleAddCategory}
        className="flex flex-col gap-3 border-t border-ink/10 pt-6"
      >
        <label htmlFor="new-category" className="text-sm font-semibold">
          Nueva categoría
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="new-category"
            type="text"
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            className={`${CATEGORY_INPUT_CLASS} md:max-w-sm`}
          />
          <button
            type="submit"
            disabled={!canAddCategory}
            className={`${SECONDARY_BUTTON_CLASS} disabled:cursor-not-allowed disabled:opacity-40`}
          >
            Agregar categoría
          </button>
        </div>
      </form>

      {dialog.mode !== "closed" && (
        <ServiceForm
          service={dialog.mode === "edit" ? dialog.service : null}
          categories={categories}
          onSave={handleSaveService}
          onCancel={() => setDialog({ mode: "closed" })}
        />
      )}
    </main>
  );
}
