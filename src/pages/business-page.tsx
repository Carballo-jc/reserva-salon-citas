import { useState } from "react";
import { Link } from "react-router";
import { Icon, type IconName } from "@/components/icon";
import { useBusiness } from "@/hooks/use-business";
import { formatArs, getDepositAmount } from "@/utils/money";

const ALL_CATEGORIES_ID = "todos";

const SOCIAL_LINK_CLASS =
  "flex min-h-12 items-center rounded-full border border-white/20 px-5 text-sm font-semibold text-(--accent) transition-colors hover:border-(--accent)/60";

/** Public page of the business: branding plus the services grouped by category. */
export function BusinessPage() {
  const business = useBusiness();
  const [selectedCategoryId, setSelectedCategoryId] =
    useState(ALL_CATEGORIES_ID);

  const categoryOptions = [
    { id: ALL_CATEGORIES_ID, name: "Todos" },
    ...business.categories,
  ];
  const categoryNameById = new Map(
    business.categories.map((category) => [category.id, category.name]),
  );
  const visibleServices =
    selectedCategoryId === ALL_CATEGORIES_ID
      ? business.services
      : business.services.filter(
          (service) => service.categoryId === selectedCategoryId,
        );

  const highlights: { icon: IconName; text: string }[] = [
    { icon: "zap", text: "Turno confirmado al instante" },
    { icon: "shield-check", text: "Seña protegida por Mercado Pago" },
    {
      icon: "clock",
      text: `Reprogramás hasta ${business.cancelHours} h antes`,
    },
  ];

  return (
    <main className="flex flex-col gap-8 md:gap-10">
      <header className="flex flex-col gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3">
          {business.address && (
            <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">
              {business.address}
            </p>
          )}
          <h1 className="font-serif text-5xl font-bold tracking-tight md:text-6xl">
            {business.name}
          </h1>
          {business.description && (
            <p className="text-white/70 md:text-lg">{business.description}</p>
          )}
        </div>
        {(business.instagram || business.whatsapp) && (
          <div className="flex shrink-0 flex-wrap gap-3">
            {business.instagram && (
              <a
                href={`https://instagram.com/${business.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className={SOCIAL_LINK_CLASS}
              >
                Instagram
              </a>
            )}
            {business.whatsapp && (
              <a
                href={`https://wa.me/${business.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className={SOCIAL_LINK_CLASS}
              >
                WhatsApp
              </a>
            )}
          </div>
        )}
      </header>

      <section aria-labelledby="services-title" className="flex flex-col gap-8">
        <h2 id="services-title" className="sr-only">
          Elegí un servicio
        </h2>

        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          {categoryOptions.map((category) => {
            const isSelected = category.id === selectedCategoryId;
            return (
              <li key={category.id} className="shrink-0">
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`min-h-12 rounded-full border px-5 text-sm font-semibold whitespace-nowrap transition-colors ${
                    isSelected
                      ? "border-white bg-white text-night"
                      : "border-white/20 text-white hover:border-white/50"
                  }`}
                >
                  {category.name}
                </button>
              </li>
            );
          })}
        </ul>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {visibleServices.map((service) => {
            const depositAmount = getDepositAmount(
              service.price,
              service.depositType,
              service.depositValue,
            );
            return (
              <li
                key={service.id}
                className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-night-raised p-5 md:p-6"
              >
                <div className="flex items-center justify-between gap-4 text-xs">
                  <span className="font-semibold tracking-[0.15em] text-gold uppercase">
                    {categoryNameById.get(service.categoryId)}
                  </span>
                  <span className="text-sm text-white/60">
                    {service.durationMin} min
                  </span>
                </div>
                <h3 className="font-serif text-2xl leading-tight font-semibold">
                  {service.name}
                </h3>
                <div className="mt-auto flex items-baseline justify-between gap-4">
                  <span className="text-xl font-bold">
                    {formatArs(service.price)}
                  </span>
                  <span className="text-sm whitespace-nowrap text-white/60">
                    {depositAmount > 0
                      ? `Seña ${formatArs(depositAmount)}`
                      : "Sin seña"}
                  </span>
                </div>
                <Link
                  to={`/${business.slug}/reservar/${service.id}`}
                  className="flex min-h-12 items-center justify-center rounded-xl bg-(--accent) px-6 font-semibold text-night transition-opacity hover:opacity-90"
                >
                  Reservar turno
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <ul className="flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/70 md:flex-row md:gap-8">
        {highlights.map((highlight) => (
          <li key={highlight.text} className="flex items-center gap-2">
            <Icon name={highlight.icon} className="size-4 shrink-0 text-gold" />
            {highlight.text}
          </li>
        ))}
      </ul>
    </main>
  );
}
