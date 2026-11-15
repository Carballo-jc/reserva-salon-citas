import { useState, type FormEvent } from "react";
import type {
  DepositType,
  PublicService,
  ServiceCategory,
} from "@/lib/public-business";

/** Service as managed from the panel: inactive services are hidden from the public page. */
export type PanelService = PublicService & { isActive: boolean };

type ServiceFormProps = {
  /** Service being edited, or null when adding a new one. */
  service: PanelService | null;
  categories: ServiceCategory[];
  onSave: (service: PanelService) => void;
  onCancel: () => void;
};

const CENTS_PER_PESO = 100;
const MAX_PERCENT = 100;

const INPUT_CLASS =
  "min-h-12 w-full rounded-xl border border-ink/15 bg-white px-4 text-base text-ink outline-none transition-colors focus:border-(--accent)";
const LABEL_CLASS = "flex flex-col gap-1.5 text-sm font-medium";

/** Dialog to add or edit a service: name, category, duration, price and deposit. */
export function ServiceForm({
  service,
  categories,
  onSave,
  onCancel,
}: ServiceFormProps) {
  const [name, setName] = useState(service?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    service?.categoryId ?? categories[0]?.id ?? "",
  );
  const [durationMin, setDurationMin] = useState(
    service ? String(service.durationMin) : "",
  );
  // Money is edited in pesos and stored as integer cents.
  const [pricePesos, setPricePesos] = useState(
    service ? String(service.price / CENTS_PER_PESO) : "",
  );
  const [depositType, setDepositType] = useState<DepositType>(
    service?.depositType ?? "percent",
  );
  const initialDepositValue =
    service?.depositType === "fixed"
      ? service.depositValue / CENTS_PER_PESO
      : (service?.depositValue ?? "");
  const [depositValue, setDepositValue] = useState(String(initialDepositValue));

  const duration = Number(durationMin);
  const price = Number(pricePesos);
  const deposit = Number(depositValue);
  const maxDeposit = depositType === "percent" ? MAX_PERCENT : price;

  const isNameValid = name.trim().length > 0;
  const isCategoryValid = categories.some((item) => item.id === categoryId);
  const isDurationValid = Number.isInteger(duration) && duration > 0;
  const isPriceValid = pricePesos !== "" && price > 0;
  const isDepositValid =
    depositValue !== "" && deposit >= 0 && deposit <= maxDeposit;
  const canSave =
    isNameValid &&
    isCategoryValid &&
    isDurationValid &&
    isPriceValid &&
    isDepositValid;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;

    const depositStored =
      depositType === "percent" ? deposit : Math.round(deposit * CENTS_PER_PESO);
    onSave({
      id: service?.id ?? crypto.randomUUID(),
      isActive: service?.isActive ?? true,
      name: name.trim(),
      categoryId,
      durationMin: duration,
      price: Math.round(price * CENTS_PER_PESO),
      depositType,
      depositValue: depositStored,
    });
  }

  return (
    <div className="fixed inset-0 z-10 flex items-end justify-center bg-ink/40 p-0 md:items-center md:p-4">
      <form
        onSubmit={handleSubmit}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-form-title"
        className="flex max-h-full w-full max-w-lg flex-col gap-5 overflow-y-auto rounded-t-3xl bg-white p-5 md:rounded-3xl md:p-8"
      >
        <h2 id="service-form-title" className="font-serif text-2xl font-semibold">
          {service ? "Editar servicio" : "Nuevo servicio"}
        </h2>

        <label className={LABEL_CLASS}>
          Nombre
          <input
            type="text"
            name="name"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={INPUT_CLASS}
          />
        </label>

        <label className={LABEL_CLASS}>
          Categoría
          <select
            name="categoryId"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className={INPUT_CLASS}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className={LABEL_CLASS}>
            Duración (min)
            <input
              type="number"
              name="durationMin"
              inputMode="numeric"
              min={1}
              value={durationMin}
              onChange={(event) => setDurationMin(event.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <label className={LABEL_CLASS}>
            Precio ($)
            <input
              type="number"
              name="price"
              inputMode="decimal"
              min={0}
              value={pricePesos}
              onChange={(event) => setPricePesos(event.target.value)}
              className={INPUT_CLASS}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className={LABEL_CLASS}>
            Tipo de seña
            <select
              name="depositType"
              value={depositType}
              onChange={(event) =>
                setDepositType(event.target.value as DepositType)
              }
              className={INPUT_CLASS}
            >
              <option value="percent">Porcentaje</option>
              <option value="fixed">Monto fijo</option>
            </select>
          </label>
          <label className={LABEL_CLASS}>
            {depositType === "percent" ? "Seña (%)" : "Seña ($)"}
            <input
              type="number"
              name="depositValue"
              inputMode="decimal"
              min={0}
              value={depositValue}
              onChange={(event) => setDepositValue(event.target.value)}
              className={INPUT_CLASS}
            />
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="flex min-h-12 items-center justify-center rounded-xl border border-ink/20 px-6 font-semibold transition-colors hover:border-ink/50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="flex min-h-12 items-center justify-center rounded-xl bg-(--accent) px-8 font-semibold text-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
